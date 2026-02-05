"use client";

import React, { useEffect, useState, useRef } from 'react';
import { deviceService } from '@/services/deviceService';

interface QRCodeDisplayProps {
    deviceId: string;
    userId: string;
    onScanSuccess: (token: string) => void;
}

export default function QRCodeDisplay({ deviceId, userId, onScanSuccess }: QRCodeDisplayProps) {
    const [qrBase64, setQrBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string>('initializing');
    const [error, setError] = useState<string | null>(null);
    const [simulating, setSimulating] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const isMounted = useRef(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Store callbacks to avoid closure staleness
    const onScanSuccessRef = useRef(onScanSuccess);
    useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);

    useEffect(() => {
        isMounted.current = true;

        const fetchQR = async () => {
            if (!isMounted.current) return;

            try {
                // Clear any previous scheduled fetch
                if (timeoutRef.current) clearTimeout(timeoutRef.current);

                setError(null);
                // Only show loading on first load or if explicitly needed
                if (status === 'initializing') setLoading(true);

                const data = await deviceService.getQRCode(deviceId, userId);

                if (!isMounted.current) return;

                // HANDLE SUCCESS
                if (data.status === 'connected') {
                    handleConnected();
                    return; // Stop polling
                }

                // 🔥 FIXED: Handle qr_ready status properly
                if (data.status === 'qr_ready') {
                    if (data.qr_code) {
                        setQrBase64(data.qr_code);
                        setStatus('scannable');
                        setLoading(false);
                        setError(null);
                        console.log("✅ QR code ready for scanning");
                        
                        // Poll again in 3s to check if scanned
                        scheduleNext(3000);
                    } else {
                        // QR ready but no data yet, wait and retry
                        console.log("⏳ QR ready but no data, retrying...");
                        scheduleNext(2000);
                    }
                    return;
                }

                if (data.status === 'pending') {
                    // Soft retry state
                    if (data.message) {
                        // Optional: could show this message if UI supports it, 
                        // for now just log and retry
                        console.log("QR Pending:", data.message);
                    }
                    setStatus('initializing'); // Keep loading spinner
                    scheduleNext(3000);
                    return;
                }

                // 🔥 FIXED: Handle Cooldown as standard wait - no error UI
                if (data.status === 'cooldown') {
                    // Just wait and try again
                    console.log("Backend reported cooldown, waiting...");
                    scheduleNext(3000);
                    return;
                }

                // Legacy fallback for direct qr_code without status
                if (data.qr_code && !data.status) {
                    setQrBase64(data.qr_code);
                    setStatus('scannable');
                    setLoading(false);
                    setError(null);
                    
                    // Poll again in 3s (standard polling)
                    scheduleNext(3000);
                } else {
                    // Unexpected state, wait and retry
                    console.log("⚠️ Unexpected state:", { status: data.status, has_qr: !!data.qr_code });
                    scheduleNext(5000);
                }

            } catch (err: any) {
                if (!isMounted.current) return;
                console.error("QR Fetch Error:", err);
                setLoading(false);

                const responseStatus = err.response?.status;
                const detail = err.response?.data?.detail;

                // 409: ALREADY CONNECTED
                if (responseStatus === 409) {
                    handleConnected();
                    return; // Stop polling
                }

                // 410: LOGGED OUT / GONE
                if (responseStatus === 410) {
                    setError("Device is logged out. Please refresh or create a new device.");
                    return; // Stop polling
                }

                // 404: DELETED / NOT FOUND
                if (responseStatus === 404) {
                    setError("Device not found. It may have been deleted.");
                    return; // Stop polling
                }

                // 429: COOLDOWN -> IGNORE AND RETRY
                if (responseStatus === 429) {
                    console.log("Rate limited (429), retrying...");
                    scheduleNext(3000);
                    return;
                }

                // 503: ENGINE DOWN -> WAIT AND RETRY
                if (responseStatus === 503) {
                    // Don't show error, just keep spinning
                    console.log("Engine 503, retrying...");
                    scheduleNext(5000);
                    return;
                }

                // 500: MISCONFIGURED or INTERNAL ERROR
                if (responseStatus === 500) {
                    // Keep trying, server might recover
                    console.log("Server 500, retrying...");
                    scheduleNext(5000);
                    return;
                }

                // 502: ENGINE ERROR -> RETRY
                if (responseStatus === 502) {
                    // Keep trying
                    scheduleNext(5000);
                    return;
                }

                // GENERIC ERROR RETRY LIMIT
                if (retryCount > 10) {
                    setError("Connection failed. Please try again later.");
                    return; // Stop polling
                }

                setRetryCount(prev => prev + 1);
                scheduleNext(5000);
            }
        };

        const handleConnected = () => {
            setStatus('connected');
            setLoading(false);
            setQrBase64(null);
            onScanSuccessRef.current("real_connection_success");
        };

        const scheduleNext = (delayMs: number) => {
            if (!isMounted.current) return;
            timeoutRef.current = setTimeout(fetchQR, delayMs);
        };

        // Start the loop
        fetchQR();

        return () => {
            isMounted.current = false;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [deviceId, userId]); // Dependencies: restart loop if ID changes

    const handleSimulateScan = async () => {
        setSimulating(true);
        try {
            setTimeout(() => {
                if (isMounted.current) {
                    setStatus('connected');
                    onScanSuccessRef.current("simulated_success");
                    setSimulating(false);
                }
            }, 1000);
        } catch (err) {
            setSimulating(false);
        }
    };

    if (status === 'initializing' && loading) return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="text-gray-500">Initializing Connection...</p>
        </div>
    );

    if (status === 'connected') return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="text-green-600 font-bold text-xl">✅ Connected!</div>
            <p className="text-gray-500">Redirecting...</p>
        </div>
    );

    if (error && status !== 'cooldown') return <div className="text-center text-red-500 py-10 px-4">{error}</div>;

    return (
        <div className="flex flex-col items-center space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-inner border relative">
                {qrBase64 ? (
                    <div className="relative">
                        <img
                            src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                            alt="WhatsApp Web QR Code"
                            className="w-64 h-64 object-contain transition-opacity duration-300 opacity-100"
                        />
                    </div>
                ) : (
                    <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                        <div className="flex flex-col items-center">
                            <div className="animate-pulse">Loading QR...</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                    Open WhatsApp on your phone <br />
                    Go to <strong>Settings {'>'} Linked Devices {'>'} Link a Device</strong>
                </p>
            </div>

            <button
                onClick={handleSimulateScan}
                disabled={simulating || status === 'connected'}
                className="w-full py-3 bg-gray-50 text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
            >
                {simulating ? "Connecting..." : "Simulate Scan (Dev Only)"}
            </button>
        </div>
    );
};
