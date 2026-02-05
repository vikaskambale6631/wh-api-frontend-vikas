/**
 * Unified Backend Server with Integrated WhatsApp Engine
 * - Single Node.js process
 * - WhatsApp Engine as internal module
 * - Persistent sessions
 * - Auto-reconnection
 * - Health checks
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');
const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
} = require('@whiskeysockets/baileys');

/* =========================
   GLOBAL CRASH PROTECTION
========================= */
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
    // Keep process alive
});

process.on('uncaughtException', (error) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', error);
    // Keep process alive
});

/* =========================
   APP SETUP
========================= */
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configuration
const WHATSAPP_ENGINE_PORT = process.env.WHATSAPP_ENGINE_PORT || 3002;
const SESSION_DIR = path.join(__dirname, 'whatsapp_sessions');

// WhatsApp Engine State
const sessions = new Map();
const qrCache = new Map();
const connectionPromises = new Map();
let isEngineInitialized = false;

/* =========================
   LOGGER
========================= */
function log(level, msg, data = null) {
    const time = new Date().toISOString();
    const prefix = `[${time}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${msg}`);
    if (data) {
        try {
            console.log(JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Data serialization failed:', e.message);
        }
    }
}

/* =========================
   AUTH STATE MANAGER
========================= */
async function ensureAuthDir(deviceId) {
    const authDir = path.join(SESSION_DIR, deviceId);
    try {
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
            log('info', `Created auth directory: ${authDir}`);
        }
        return authDir;
    } catch (error) {
        log('error', `Failed to create auth dir for ${deviceId}`, error);
        throw error;
    }
}

/* =========================
   QR HANDLER
========================= */
async function handleQR(deviceId, qr) {
    try {
        log('info', `QR received for device: ${deviceId}`);
        const base64 = await QRCode.toDataURL(qr);
        const qrData = base64.split(',')[1];

        qrCache.set(deviceId, qrData);

        const session = sessions.get(deviceId);
        if (session) {
            session.qr = qrData;
            session.status = 'qr_ready';
            session.qrGeneratedAt = Date.now();
        }

        log('info', `QR processed successfully for: ${deviceId}`);
        return qrData;
    } catch (error) {
        log('error', `QR generation failed for ${deviceId}`, error);
        throw error;
    }
}

/* =========================
   CONNECTION MANAGER
========================= */
async function createConnection(deviceId) {
    const authDir = await ensureAuthDir(deviceId);

    log('info', `Creating Baileys socket for: ${deviceId}`);

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Don't print QR in terminal
        browser: Browsers.macOS('Chrome'),
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 5000,
        maxRetries: 5,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: false,
    });

    const session = {
        socket,
        status: 'connecting',
        qr: null,
        reconnects: 0,
        lastDisconnect: null,
        createdAt: Date.now(),
        qrGeneratedAt: null,
    };

    sessions.set(deviceId, session);

    return { socket, session, saveCreds };
}

/* =========================
   INIT SESSION (SINGLETON)
========================= */
async function initSession(deviceId) {
    log('info', `🚀 Initializing session: ${deviceId}`);

    if (connectionPromises.has(deviceId)) {
        log('info', `Session already initializing: ${deviceId}`);
        return connectionPromises.get(deviceId);
    }

    const initPromise = (async () => {
        try {
            // Cleanup existing session if any
            const existingSession = sessions.get(deviceId);
            if (existingSession?.socket) {
                try {
                    existingSession.socket.ev.removeAllListeners();
                    existingSession.socket.end(undefined);
                } catch (e) {
                    log('warn', `Error cleaning up existing socket for ${deviceId}`, e);
                }
            }

            const { socket, session, saveCreds } = await createConnection(deviceId);

            // Connection update handler
            socket.ev.on('connection.update', async (update) => {
                const { connection, qr, lastDisconnect } = update;

                log('info', `Connection update for ${deviceId}`, {
                    connection,
                    hasQR: !!qr,
                    lastDisconnect: lastDisconnect?.error?.output?.statusCode
                });

                // Handle QR
                if (qr) {
                    await handleQR(deviceId, qr);
                }

                // Handle successful connection
                if (connection === 'open') {
                    log('info', `✅ WHATSAPP CONNECTED: ${deviceId}`);
                    session.status = 'connected';
                    session.qr = null;
                    session.reconnects = 0;
                    session.connectedAt = Date.now();
                    qrCache.delete(deviceId);

                    // Health check log
                    log('info', `📱 WhatsApp Client Ready: ${deviceId}`);
                    log('info', `📤 Ready to Send Messages: ${deviceId}`);
                }

                // Handle disconnection
                if (connection === 'close') {
                    const code = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = code !== DisconnectReason.loggedOut;

                    session.lastDisconnect = { code, shouldReconnect, timestamp: Date.now() };

                    log('warn', `❌ WHATSAPP DISCONNECTED ${deviceId}`, {
                        code,
                        shouldReconnect,
                        reason: lastDisconnect?.error?.message
                    });

                    if (shouldReconnect) {
                        session.reconnects++;
                        const delay = Math.min(30000, Math.pow(2, session.reconnects) * 1000);
                        log('info', `🔄 Auto-reconnecting ${deviceId} in ${delay}ms (attempt ${session.reconnects})`);
                        setTimeout(() => initSession(deviceId), delay);
                    } else {
                        log('info', `🗑️ Session logged out, removing: ${deviceId}`);
                        sessions.delete(deviceId);
                        qrCache.delete(deviceId);
                        try {
                            fs.rmSync(path.join(SESSION_DIR, deviceId), { recursive: true, force: true });
                        } catch (e) {
                            log('warn', `Failed to delete session dir for ${deviceId}`, e);
                        }
                    }
                }
            });

            // Handle Incoming Messages
            socket.ev.on('messages.upsert', async (upsert) => {
                try {
                    const { messages, type } = upsert;
                    if (type === 'notify' || type === 'append') {
                        for (const msg of messages) {
                            if (!msg.key.fromMe) {
                                // Extract info
                                const remoteJid = msg.key.remoteJid;
                                const isGroup = remoteJid.endsWith('@g.us');

                                // Logic: For now handle direct messages
                                if (!remoteJid || remoteJid === 'status@broadcast') continue;

                                const phone = remoteJid.split('@')[0];
                                const text = msg.message?.conversation ||
                                    msg.message?.extendedTextMessage?.text ||
                                    msg.message?.imageMessage?.caption ||
                                    '';

                                log('info', `📨 Incoming message preview: ${text.substring(0, 30)}... from ${phone}`);

                                if (!text) {
                                    log('info', 'Skipping empty message');
                                    continue;
                                }

                                // Send to backend webhook
                                try {
                                    log('info', `🚀 Forwarding to backend webhook...`);
                                    const webhookRes = await axios.post('http://localhost:8000/api/webhook/whatsapp/incoming', {
                                        device_id: deviceId,
                                        phone_number: phone,
                                        message: text,
                                        timestamp: typeof msg.messageTimestamp === 'number' ? msg.messageTimestamp : Date.now() / 1000
                                    });
                                    log('info', `✅ Backend accepted message: ${JSON.stringify(webhookRes.data)}`);
                                } catch (err) {
                                    log('error', `❌ Failed to send webhook to backend: ${err.message}`);
                                    if (err.response) {
                                        log('error', `   Status: ${err.response.status}`);
                                        log('error', `   Data: ${JSON.stringify(err.response.data)}`);
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    log('error', 'Error handling incoming message', e);
                }
            });

            // Credentials update handler
            socket.ev.on('creds.update', saveCreds);

            // Error handler
            socket.ev.on('error', (err) => {
                log('error', `Socket error for ${deviceId}`, err);
            });

            log('info', `✅ Session initialized successfully: ${deviceId}`);
            return session;

        } catch (error) {
            log('error', `❌ Failed to initialize session: ${deviceId}`, error);
            connectionPromises.delete(deviceId);
            throw error;
        }
    })();

    connectionPromises.set(deviceId, initPromise);

    try {
        return await initPromise;
    } finally {
        connectionPromises.delete(deviceId);
    }
}

/* =========================
   AUTO-RESTORE SESSIONS
========================= */
async function restoreSessions() {
    if (!fs.existsSync(SESSION_DIR)) {
        log('info', 'No sessions directory found, starting fresh');
        return;
    }

    try {
        const dirs = fs.readdirSync(SESSION_DIR);
        log('info', `📂 Found ${dirs.length} stored sessions to restore...`);

        for (const deviceId of dirs) {
            // Skip non-directories or system files
            if (deviceId.startsWith('.')) continue;

            try {
                log('info', `🔄 Restoring session: ${deviceId}`);
                await initSession(deviceId);
            } catch (e) {
                log('error', `Failed to restore ${deviceId}`, e);
            }
        }
    } catch (e) {
        log('error', 'Failed to read sessions directory', e);
    }
}

/* =========================
   WHATSAPP ENGINE API ROUTES
========================= */

// Health Check
app.get('/health', (req, res) => {
    const connectedCount = [...sessions.values()].filter(s => s.status === 'connected').length;
    const qrReadyCount = [...sessions.values()].filter(s => s.status === 'qr_ready').length;

    const healthData = {
        status: 'ok',
        engine: 'running',
        port: WHATSAPP_ENGINE_PORT,
        total_sessions: sessions.size,
        connected: connectedCount,
        qr_ready: qrReadyCount,
        uptime: process.uptime(),
        pid: process.pid,
        memory: process.memoryUsage(),
        initialized: isEngineInitialized
    };

    if (connectedCount > 0) {
        healthData.whatsapp = 'connected';
        healthData.message = 'WhatsApp engine is connected and ready';
    } else if (qrReadyCount > 0) {
        healthData.whatsapp = 'qr_ready';
        healthData.message = 'WhatsApp engine is waiting for QR scan';
    } else {
        healthData.whatsapp = 'disconnected';
        healthData.message = 'WhatsApp engine is running but no active sessions';
    }

    res.json(healthData);
});

// Get all sessions
app.get('/sessions', (req, res) => {
    const data = {};
    sessions.forEach((session, id) => {
        data[id] = {
            status: session.status,
            has_qr: !!session.qr,
            reconnects: session.reconnects,
            created_at: session.createdAt,
            connected_at: session.connectedAt || null,
            qr_generated_at: session.qrGeneratedAt || null,
            last_disconnect: session.lastDisconnect || null,
        };
    });
    res.json(data);
});

// Get QR for device
app.get('/session/:deviceId/qr', async (req, res) => {
    const { deviceId } = req.params;

    log('info', `QR requested for device: ${deviceId}`);

    let session = sessions.get(deviceId);

    // Auto-initialize if session doesn't exist
    if (!session) {
        log('info', `Auto-initializing session for: ${deviceId}`);
        try {
            await initSession(deviceId);
            session = sessions.get(deviceId);

            // Wait a bit for QR generation
            if (session && session.status === 'connecting') {
                await new Promise(resolve => setTimeout(resolve, 3000));
                session = sessions.get(deviceId);
            }
        } catch (error) {
            log('error', `Failed to auto-init session for ${deviceId}`, error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to initialize session'
            });
        }
    }

    if (!session) {
        return res.status(500).json({
            status: 'error',
            message: 'Session creation failed'
        });
    }

    // Return based on session status
    if (session.status === 'connected') {
        return res.json({ status: 'connected' });
    }

    if (session.qr) {
        return res.json({
            status: 'qr_ready',
            qr: session.qr,
            generated_at: session.qrGeneratedAt
        });
    }

    // Still generating QR
    res.status(202).json({
        status: 'generating',
        message: 'QR code is being generated'
    });
});

// Get device status
app.get('/session/:deviceId/status', (req, res) => {
    const { deviceId } = req.params;
    const session = sessions.get(deviceId);

    if (!session) {
        return res.status(404).json({
            status: 'not_found',
            message: 'Device session not found'
        });
    }

    res.json({
        status: session.status,
        has_qr: !!session.qr,
        reconnects: session.reconnects,
        created_at: session.createdAt,
        connected_at: session.connectedAt || null,
    });
});

// Send message
app.post('/session/:deviceId/message', async (req, res) => {
    const { deviceId } = req.params;
    const { to, message, type = 'text' } = req.body;

    // Always return a response immediately
    const immediateResponse = (status, data, statusCode = 200) => {
        if (status === 'error') {
            return res.status(statusCode).json({
                status: 'error',
                error: data.error,
                message: data.message,
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(statusCode).json({
                status: 'accepted',
                messageId: data.messageId || `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                to: data.to || to,
                timestamp: new Date().toISOString(),
                note: 'Message queued for delivery'
            });
        }
    };

    // Validation
    if (!to || !message) {
        return immediateResponse('error', {
            error: 'missing_parameters',
            message: 'Both "to" and "message" are required'
        }, 400);
    }

    const session = sessions.get(deviceId);
    if (!session) {
        return immediateResponse('error', {
            error: 'device_not_found',
            message: 'Device session not found'
        }, 404);
    }

    if (session.status !== 'connected') {
        return immediateResponse('error', {
            error: 'device_not_connected',
            status: session.status,
            message: 'Device is not connected'
        }, 400);
    }

    // Generate immediate response with pending message ID
    const pendingMessageId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const jid = to.includes('@s.whatsapp.net') || to.includes('@g.us')
        ? to
        : `${to}@s.whatsapp.net`;

    // Send immediate response
    immediateResponse('success', {
        messageId: pendingMessageId,
        to: jid
    });

    // Process message asynchronously in background
    setImmediate(async () => {
        try {
            let messageObj = { text: message };

            if (type === 'image' && message.startsWith('http')) {
                messageObj = { image: { url: message }, caption: message };
            }

            const result = await session.socket.sendMessage(jid, messageObj);

            log('info', `Message sent successfully from ${deviceId}`, {
                to: jid,
                pendingMessageId,
                actualMessageId: result.key.id,
                type
            });

            // Optional: Store message status in memory for status checking
            if (!session.messageStatus) {
                session.messageStatus = new Map();
            }
            session.messageStatus.set(pendingMessageId, {
                status: 'sent',
                actualMessageId: result.key.id,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            log('error', `Send message failed for ${deviceId}`, {
                to: jid,
                pendingMessageId,
                error: error.message
            });

            // Store failure status
            if (!session.messageStatus) {
                session.messageStatus = new Map();
            }
            session.messageStatus.set(pendingMessageId, {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Check message status
app.get('/session/:deviceId/message/:messageId/status', (req, res) => {
    const { deviceId, messageId } = req.params;

    const session = sessions.get(deviceId);
    if (!session) {
        return res.status(404).json({
            error: 'device_not_found',
            message: 'Device session not found'
        });
    }

    if (!session.messageStatus || !session.messageStatus.has(messageId)) {
        return res.status(404).json({
            error: 'message_not_found',
            message: 'Message status not found'
        });
    }

    const status = session.messageStatus.get(messageId);
    res.json({
        messageId,
        deviceId,
        ...status,
        timestamp: new Date().toISOString()
    });
});

// Reconnect device
app.post('/session/:deviceId/reconnect', async (req, res) => {
    const { deviceId } = req.params;

    log('info', `Manual reconnect requested for: ${deviceId}`);

    const oldSession = sessions.get(deviceId);
    if (oldSession?.socket) {
        try {
            oldSession.socket.ev.removeAllListeners();
            oldSession.socket.end(undefined);
        } catch (e) {
            log('warn', `Error closing old socket for ${deviceId}`, e);
        }
    }

    sessions.delete(deviceId);
    qrCache.delete(deviceId);
    connectionPromises.delete(deviceId);

    try {
        await initSession(deviceId);
        res.json({
            status: 'reconnecting',
            deviceId,
            message: 'Reconnection initiated'
        });
    } catch (error) {
        log('error', `Failed to start reconnection for ${deviceId}`, error);
        res.status(500).json({
            status: 'error',
            message: 'Reconnection failed'
        });
    }
});

// Delete session
app.delete('/session/:deviceId', async (req, res) => {
    const { deviceId } = req.params;

    log('info', `Session deletion requested for: ${deviceId}`);

    try {
        const session = sessions.get(deviceId);

        if (session && session.socket) {
            // Close WhatsApp connection
            await session.socket.logout();
            session.socket.end();
        }

        // Clean up session data
        sessions.delete(deviceId);
        qrCache.delete(deviceId);
        connectionPromises.delete(deviceId);

        // Delete session directory
        try {
            fs.rmSync(path.join(SESSION_DIR, deviceId), { recursive: true, force: true });
            log('info', `Session directory deleted for: ${deviceId}`);
        } catch (e) {
            log('warn', `Failed to delete session dir for ${deviceId}`, e);
        }

        res.json({
            status: 'deleted',
            deviceId,
            message: 'Session deleted successfully'
        });

    } catch (error) {
        log('error', `Failed to delete session for ${deviceId}`, error);
        res.status(500).json({
            status: 'error',
            message: 'Session deletion failed'
        });
    }
});

/* =========================
   FRONTEND API ROUTES (Proxy)
========================= */

// Proxy any other requests to Next.js development server if available
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

/* =========================
   STARTUP & INITIALIZATION
========================= */
async function startServer() {
    try {
        // Ensure sessions directory exists
        if (!fs.existsSync(SESSION_DIR)) {
            fs.mkdirSync(SESSION_DIR, { recursive: true });
            log('info', `Created sessions directory: ${SESSION_DIR}`);
        }

        // Start Express server
        app.listen(WHATSAPP_ENGINE_PORT, '0.0.0.0', () => {
            log('info', `🚀 WhatsApp Engine Server STARTED`);
            log('info', `📡 Engine running on port ${WHATSAPP_ENGINE_PORT}`);
            log('info', `📱 WhatsApp Engine initialized`);

            // Mark engine as initialized
            isEngineInitialized = true;

            // Restore existing sessions
            restoreSessions();
        });

        // Log engine status every 5 minutes
        setInterval(() => {
            const connectedCount = [...sessions.values()].filter(s => s.status === 'connected').length;
            const qrReadyCount = [...sessions.values()].filter(s => s.status === 'qr_ready').length;

            log('info', '📊 Engine Status Check', {
                sessions: sessions.size,
                connected: connectedCount,
                qr_ready: qrReadyCount,
                uptime: process.uptime(),
            });
        }, 300000);

    } catch (error) {
        log('error', 'Failed to start server', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    log('info', '🛑 SIGINT received - shutting down gracefully');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('info', '🛑 SIGTERM received - shutting down gracefully');
    process.exit(0);
});
