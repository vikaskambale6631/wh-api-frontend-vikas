"use client";

import { useState, useEffect } from "react";
import {
    Send, MessageSquare, CheckCircle, AlertCircle,
    RefreshCw, Smartphone, ChevronRight, ChevronLeft,
    Check, Zap, XCircle, Image as ImageIcon, Activity
} from "lucide-react";
import groupService, { Group } from "@/services/groupService";
import unofficialApiService from "@/services/unofficialApiService";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { API_BASE_URL } from "@/config/api";
import MediaMessageComposer from "@/components/official-message/MediaMessageComposer";

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface ConnectedDevice {
    device_id: string;
    device_name: string;
    session_status: string;
    device_type: string;
}

interface SendResult {
    recipient: string;
    status: "success" | "error";
    error?: string;
}

export default function UnofficialMessagePage() {
    // Steps: 1=Type, 2=Recipient, 3=Compose, 4=Review
    const [currentStep, setCurrentStep] = useState(1);

    // User & Device
    const [userId, setUserId] = useState<string | null>(null);
    const [deviceStatus, setDeviceStatus] = useState<"loading" | "connected" | "disconnected">("loading");
    const [deviceName, setDeviceName] = useState<string>("");
    const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice | null>(null);
    const [engineStatus, setEngineStatus] = useState<string | null>(null);

    // Form states
    const [messageType, setMessageType] = useState<"text" | "media">("text");
    const [mediaType, setMediaType] = useState<"image" | "video" | "document">("image");
    const [filePath, setFilePath] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [recipientType, setRecipientType] = useState<"single" | "group">("single");

    // Single user messaging
    const [singleUserPhone, setSingleUserPhone] = useState("");

    // Group messaging
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    // Content
    const [messageContent, setMessageContent] = useState("");

    // Status states
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);


    // Bulk send results
    const [bulkResults, setBulkResults] = useState<SendResult[] | null>(null);

    // ─── Init ────────────────────────────────────────────────────────────────

    useEffect(() => {
        const storedUserId = localStorage.getItem("user_id");
        if (storedUserId) {
            setUserId(storedUserId);
            checkDeviceAndLoadGroups(storedUserId);
        }
    }, []);

    // Auto-poll device connection when disconnected
    useEffect(() => {
        if (!userId || deviceStatus === "connected") return;

        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/devices/unofficial/connected?user_id=${userId}`);
                const data = await response.json();

                const device = (data.devices || []).find((d: any) =>
                    d.session_status === "connected" && d.device_type === "web"
                );

                if (device) {
                    setDeviceStatus("connected");
                    setDeviceName(device.device_name);
                    setConnectedDevice(device);
                    // Run status check on the connected device
                    runStatusCheck(device.device_id, device.device_name);
                }
            } catch {
                // Ignore background polling errors
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [userId, deviceStatus]);

    // ─── Device & Groups ──────────────────────────────────────────────────────

    const checkDeviceAndLoadGroups = async (currentUserId: string) => {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // 1. Check device status
            const response = await fetch(`${API_BASE_URL}/devices/unofficial/connected?user_id=${currentUserId}`);
            const data = await response.json();

            const device = (data.devices || []).find((d: any) =>
                d.session_status === "connected" && d.device_type === "web"
            );

            if (device) {
                setDeviceStatus("connected");
                setDeviceName(device.device_name);
                setConnectedDevice(device);
                console.log("✅ Found connected device:", device.device_name);

                // 2. Run /status-check via unofficial API
                runStatusCheck(device.device_id, device.device_name);
            } else {
                setDeviceStatus("disconnected");
                console.log("❌ No connected unofficial devices found");
            }

            // 3. Load Groups
            const groupsData = await groupService.getGroups(token);
            setGroups(groupsData);

        } catch (error) {
            console.error("Failed to load initial data:", error);
            setDeviceStatus("disconnected");
        } finally {
            setLoading(false);
        }
    };

    const runStatusCheck = async (deviceId: string, deviceNameStr: string) => {
        try {
            const result = await unofficialApiService.statusCheck(deviceId, deviceNameStr);
            setEngineStatus(result?.status || result?.session_status || "checked");
            console.log("🔍 Status check result:", result);
        } catch (err: any) {
            console.warn("Status check failed:", err.message);
            setEngineStatus("error");
        }
    };

    const refreshDeviceStatus = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            await fetch(`${API_BASE_URL.replace('/api', '')}/sync-devices/${userId}`);
            await checkDeviceAndLoadGroups(userId);
        } catch (error) {
            console.error("Failed to refresh device status:", error);
            setLoading(false);
        }
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const toggleGroup = (groupId: string) => {
        if (selectedGroupIds.includes(groupId)) {
            setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
        } else {
            setSelectedGroupIds([...selectedGroupIds, groupId]);
        }
    };



    /** Collect all phone numbers from selected groups */
    const getGroupRecipients = async (): Promise<string[]> => {
        const token = localStorage.getItem("token");
        if (!token) return [];

        const allPhones: string[] = [];
        const contactPromises = selectedGroupIds.map(groupId =>
            groupService.getGroupContacts(token, groupId)
                .then(contacts => {
                    contacts.forEach(c => {
                        if (c.phone && !allPhones.includes(c.phone)) {
                            allPhones.push(c.phone);
                        }
                    });
                })
                .catch(err => {
                    console.error(`Failed to get contacts for group ${groupId}:`, err);
                })
        );

        await Promise.all(contactPromises);
        return allPhones;
    };

    // ─── Validation ───────────────────────────────────────────────────────────

    const isStepValid = (step: number) => {
        if (deviceStatus !== "connected") return false;

        if (step === 1) return true;

        if (step === 2) {
            if (recipientType === "single") {
                return singleUserPhone.length > 5;
            } else {
                return selectedGroupIds.length > 0;
            }
        }

        if (step === 3) {
            if (messageType === "text") {
                return messageContent.trim().length > 0;
            } else {
                return (filePath.trim().length > 0) || (file !== null);
            }
        }

        return true;
    };

    const handleNext = () => {
        if (currentStep < 4 && isStepValid(currentStep)) {
            setCurrentStep(curr => curr + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        }
    };

    // ─── Send Message — Full Integration ──────────────────────────────────────

    const handleSendMessage = async () => {
        if (!connectedDevice) {
            setStatus({ type: "error", text: "No connected device found. Please connect your device first." });
            return;
        }

        try {
            setSending(true);
            setStatus(null);
            setBulkResults(null);

            const { device_id, device_name } = connectedDevice;

            console.log("🔐 Device ID being used:", device_id);
            console.log("🔐 Device Name being used:", device_name);
            console.log("🔐 Full connectedDevice:", JSON.stringify(connectedDevice));

            // ── Re-verify device is still connected ──
            const verifyRes = await fetch(`${API_BASE_URL}/devices/unofficial/connected?user_id=${userId}`);
            const verifyData = await verifyRes.json();
            console.log("🔐 Verify response:", JSON.stringify(verifyData));
            const stillConnected = (verifyData.devices || []).find((d: any) =>
                d.session_status === "connected" && d.device_type === "web"
            );

            if (!stillConnected) {
                throw new Error("Device disconnected. Please reconnect and try again.");
            }

            console.log("🔐 Sending via device:", device_name, "ID:", device_id);

            // ═══════════════════════════════════════════════════════════════════
            // TEXT MESSAGE
            // ═══════════════════════════════════════════════════════════════════
            if (messageType === "text") {
                if (recipientType === "single") {
                    // ── Single user text → POST /send-message (JSON) ──
                    const result = await unofficialApiService.sendMessage(
                        device_id,
                        device_name,
                        singleUserPhone,
                        messageContent,
                        true, // wait for delivery
                        30
                    );
                    console.log("✅ Text message result:", result);
                    setStatus({ type: "success", text: "✅ Text message sent successfully!" });
                } else {
                    // ── Group text broadcast → POST /bulk-send-messages (FormData) ──
                    const recipients = await getGroupRecipients();
                    if (recipients.length === 0) {
                        throw new Error("No contacts found in selected groups.");
                    }

                    console.log(`📤 Bulk text to ${recipients.length} recipients`);
                    const result = await unofficialApiService.bulkSendMessages(
                        device_id,
                        device_name,
                        messageContent,
                        recipients,
                        true,
                        30
                    );

                    setBulkResults(result.results.map(r => ({
                        recipient: r.recipient,
                        status: r.status,
                        error: r.error
                    })));

                    setStatus({
                        type: result.error_count > 0 ? "error" : "success",
                        text: `📤 Sent to ${result.success_count}/${result.total_recipients} recipients. ${result.delivered_count} delivered.${result.error_count > 0 ? ` ${result.error_count} failed.` : ''}`
                    });
                }
            }

            // ═══════════════════════════════════════════════════════════════════
            // MEDIA MESSAGE (file upload or file_path approach)
            // ═══════════════════════════════════════════════════════════════════
            else {
                if (!filePath.trim() && !file) {
                    setStatus({ type: "error", text: "Please upload a file or enter a path/URL." });
                    return;
                }

                // Strip any literal quotes that the user might have copy-pasted (e.g., from Windows "Copy as path")
                const cleanFilePath = filePath.trim().replace(/^["']|["']$/g, '');

                if (recipientType === "single") {
                    // ── Single user media ──
                    let result: any;
                    if (caption.trim()) {
                        // File + Text → POST /send-file-text
                        console.log("📎 Sending file + text via /send-file-text");
                        result = await unofficialApiService.sendFileText(
                            device_id,
                            device_name,
                            singleUserPhone,
                            cleanFilePath,
                            caption,
                            file || undefined
                        );
                        console.log("📎 send-file-text result:", result);
                    } else {
                        // File only → POST /send-file
                        console.log("📎 Sending file via /send-file");
                        result = await unofficialApiService.sendFile(
                            device_id,
                            device_name,
                            singleUserPhone,
                            cleanFilePath,
                            file || undefined
                        );
                        console.log("📎 send-file result:", result);
                    }

                    // Check if backend returned success: false (engine error)
                    if (result && result.success === false) {
                        throw new Error(result.message || result.error || "File sending failed at engine level.");
                    }

                    setStatus({
                        type: "success",
                        text: `✅ Media sent successfully!${caption.trim() ? " (with caption)" : ""}`
                    });
                } else {
                    // ── Group media broadcast ──
                    const recipients = await getGroupRecipients();
                    if (recipients.length === 0) {
                        throw new Error("No contacts found in selected groups.");
                    }

                    console.log(`📤 Bulk media to ${recipients.length} recipients`);

                    let bulkResponse: any;

                    if (caption.trim()) {
                        // File + Text → POST /bulk-send-files-with-text
                        console.log("📤 Using /bulk-send-files-with-text");
                        bulkResponse = await unofficialApiService.bulkSendFilesWithText(
                            device_id,
                            device_name,
                            caption,
                            recipients,
                            cleanFilePath,
                            true,
                            30,
                            file || undefined
                        );
                    } else {
                        // File only → POST /bulk-send-files
                        console.log("📤 Using /bulk-send-files");
                        bulkResponse = await unofficialApiService.bulkSendFiles(
                            device_id,
                            device_name,
                            cleanFilePath,
                            recipients,
                            true,
                            30,
                            file || undefined
                        );
                    }

                    // Display REAL backend response
                    const successCount = bulkResponse.success_count || 0;
                    const errorCount = bulkResponse.error_count || 0;
                    const totalRecipients = bulkResponse.total_recipients || recipients.length;
                    const failedNumbers = (bulkResponse.results || [])
                        .filter((r: any) => r.status === "error")
                        .map((r: any) => r.recipient);

                    setBulkResults((bulkResponse.results || []).map((r: any) => ({
                        recipient: r.recipient,
                        status: r.status,
                        error: r.error
                    })));

                    setStatus({
                        type: errorCount > 0 ? "error" : "success",
                        text: `📤 Media sent to ${successCount}/${totalRecipients} recipients.${errorCount > 0 ? ` ${errorCount} failed.` : ''}${caption.trim() ? " (with caption)" : ""}`
                    });
                }
            }

            // Reset form on success
            setCurrentStep(1);
            setMessageContent("");
            setSingleUserPhone("");
            setSelectedGroupIds([]);
            setFilePath("");
            setFile(null);
            setCaption("");

        } catch (error: any) {
            console.error("❌ Message sending failed:", error);
            setStatus({
                type: "error",
                text: error.message || "Failed to send message. Please try again."
            });
        } finally {
            setSending(false);
        }
    };


    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Send Unofficial Message</h1>
                        <p className="text-gray-500 mt-1">Send messages via your connected WhatsApp device.</p>
                    </div>
                    {/* Device Status Badge */}
                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border ${deviceStatus === "connected"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                        <Smartphone size={16} />
                        {loading ? "Checking device..." :
                            deviceStatus === "connected" ? `Connected: ${deviceName}` : "No Device Connected"}
                        {engineStatus && deviceStatus === "connected" && (
                            <span className="ml-1 text-xs opacity-70">({engineStatus})</span>
                        )}
                        <button
                            onClick={refreshDeviceStatus}
                            disabled={loading}
                            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                            title="Refresh device status"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Device Warning */}
                {!loading && deviceStatus !== "connected" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 text-amber-800">
                        <AlertCircle className="shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold">Device Disconnected</h3>
                            <p className="text-sm">You simply need to connect your WhatsApp account to start sending messages.</p>
                        </div>
                        <Link href="/dashboard/user/devices" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors">
                            Connect Device
                        </Link>
                    </div>
                )}

                {/* Progress Stepper */}
                <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center px-8 md:px-16 relative overflow-hidden transition-opacity ${deviceStatus !== 'connected' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 z-0"></div>
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: step <= currentStep ? "#10b981" : "#f3f4f6",
                                    color: step <= currentStep ? "#ffffff" : "#6b7280",
                                    scale: step === currentStep ? 1.1 : 1
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 border-2 border-white"
                            >
                                {step < currentStep ? <Check size={18} /> : step}
                            </motion.div>
                            <span className={`text-xs font-medium ${step <= currentStep ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {step === 1 ? "Type" : step === 2 ? "Audience" : step === 3 ? "Compose" : "Review"}
                            </span>
                        </div>
                    ))}
                    <motion.div
                        className="absolute top-1/2 left-0 h-1 bg-emerald-500 z-0 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: (currentStep - 1) / 3 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        style={{ width: "100%" }}
                    />
                </div>

                {/* Content Card */}
                <AnimatePresence mode="wait">
                    {deviceStatus === "connected" && (
                        <motion.div
                            key={currentStep}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px] flex flex-col"
                        >
                            {/* Step 1: Message Type */}
                            {currentStep === 1 && (
                                <div className="p-8 md:p-12 flex-1 flex flex-col justify-center">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">What kind of message are you sending?</h2>
                                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
                                        <button
                                            onClick={() => setMessageType("text")}
                                            className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-lg ${messageType === 'text'
                                                ? 'border-emerald-500 bg-emerald-50/50'
                                                : 'border-gray-100 hover:border-emerald-200 hover:bg-white'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${messageType === 'text' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                                                }`}>
                                                <MessageSquare size={24} />
                                            </div>
                                            <h3 className={`text-lg font-bold mb-2 ${messageType === 'text' ? 'text-emerald-900' : 'text-gray-800'}`}>Text Message</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Send standard text messages to your customers. Supports simple formatting.
                                            </p>
                                            {messageType === 'text' && (
                                                <div className="absolute top-4 right-4 text-emerald-500">
                                                    <CheckCircle size={24} />
                                                </div>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setMessageType("media")}
                                            className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-lg ${messageType === 'media'
                                                ? 'border-emerald-500 bg-emerald-50/50'
                                                : 'border-gray-100 hover:border-emerald-200 hover:bg-white'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${messageType === 'media' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                                                }`}>
                                                <ImageIcon size={24} />
                                            </div>
                                            <h3 className={`text-lg font-bold mb-2 ${messageType === 'media' ? 'text-emerald-900' : 'text-gray-800'}`}>Media Message</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Send images, videos, and documents with optional captions.
                                            </p>
                                            {messageType === 'media' && (
                                                <div className="absolute top-4 right-4 text-emerald-500">
                                                    <CheckCircle size={24} />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Recipient */}
                            {currentStep === 2 && (
                                <div className="p-8 md:p-12 flex-1">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Choose your audience</h2>

                                    {/* Tabs */}
                                    <div className="flex p-1 bg-gray-100 rounded-xl w-fit mb-8">
                                        <button
                                            onClick={() => setRecipientType("single")}
                                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${recipientType === "single"
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Single User
                                        </button>
                                        <button
                                            onClick={() => setRecipientType("group")}
                                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${recipientType === "group"
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Group Broadcast
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 min-h-[300px]">
                                        {recipientType === "single" ? (
                                            <div className="max-w-md">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Phone Number</label>
                                                <div className="relative z-0">
                                                    <Smartphone className="absolute left-3 top-3 text-gray-400" size={20} />
                                                    <input
                                                        type="text"
                                                        value={singleUserPhone}
                                                        onChange={(e) => setSingleUserPhone(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                        placeholder="e.g. 919876543210"
                                                    />
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500">Enter the full phone number with country code (digits only).</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Select Groups</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
                                                    {groups.map(group => (
                                                        <label
                                                            key={group.group_id}
                                                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedGroupIds.includes(group.group_id)
                                                                ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                                                : 'bg-white border-gray-200 hover:border-emerald-200'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedGroupIds.includes(group.group_id)}
                                                                onChange={() => toggleGroup(group.group_id)}
                                                                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                                            />
                                                            <div>
                                                                <span className={`font-medium ${selectedGroupIds.includes(group.group_id) ? 'text-emerald-900' : 'text-gray-700'}`}>
                                                                    {group.name}
                                                                </span>
                                                                {group.contact_count > 0 && (
                                                                    <span className="block text-xs text-gray-400">{group.contact_count} contacts</span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                                    {groups.length === 0 && (
                                                        <div className="col-span-full text-center py-10 text-gray-400">
                                                            No groups found. Please create a group first.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Compose */}
                            {currentStep === 3 && (
                                <div className="p-8 md:p-12 flex-1">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {messageType === 'text' ? 'Compose Message' : 'Compose Media'}
                                        </h2>
                                    </div>

                                    <div className="grid lg:grid-cols-3 gap-8 h-full">
                                        <div className="lg:col-span-2 space-y-6">
                                            {messageType === "text" ? (
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message Content</label>
                                                    <textarea
                                                        value={messageContent}
                                                        onChange={(e) => setMessageContent(e.target.value)}
                                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-64 resize-none shadow-sm"
                                                        placeholder="Type your message here..."
                                                    />
                                                    <div className="text-right mt-2 text-xs text-gray-400">
                                                        {messageContent.length} characters
                                                    </div>
                                                </div>
                                            ) : (
                                                <MediaMessageComposer
                                                    mediaType={mediaType}
                                                    setMediaType={setMediaType}
                                                    filePath={filePath}
                                                    setFilePath={setFilePath}
                                                    file={file}
                                                    setFile={setFile}
                                                    caption={caption}
                                                    setCaption={setCaption}
                                                />
                                            )}
                                        </div>

                                        {/* Tips Column */}
                                        <div className="bg-emerald-900/5 rounded-2xl p-6 h-fit border border-emerald-900/10 hidden lg:block">
                                            <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                                                <Zap size={18} /> Best Practices
                                            </h3>
                                            <ul className="space-y-4 text-sm text-emerald-800/80">
                                                <li className="flex gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                    <span>Ensure your device is connected and has an active internet connection.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                    <span>Avoid sending marketing spam to prevent number banning.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                    <span>{messageType === 'media' ? 'Supported: JPG, PNG, MP4, PDF, DOC, CSV, XLS. Captions sent as follow-up text.' : 'Messages are sent through your device\'s connection.'}</span>
                                                </li>
                                                {recipientType === "group" && (
                                                    <li className="flex gap-3">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                        <span>Group broadcasts use parallel sending (Promise.allSettled) for speed.</span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Review */}
                            {currentStep === 4 && (
                                <div className="p-8 md:p-12 flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                                        <Check size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Send?</h2>
                                    <p className="text-gray-500 mb-10 max-w-md">
                                        Please review the details below. Messages will be sent from your connected device: <b>{deviceName}</b>.
                                    </p>

                                    <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-2xl border border-gray-200 text-left grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message Type</label>
                                            <p className="font-semibold text-gray-800 capitalize mt-1">Unofficial {messageType}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient Type</label>
                                            <p className="font-semibold text-gray-800 capitalize mt-1">{recipientType}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                {recipientType === 'single' ? 'Recipient' : 'Recipients'}
                                            </label>
                                            <p className="font-semibold text-gray-800 mt-1 truncate">
                                                {recipientType === 'single'
                                                    ? singleUserPhone
                                                    : `${selectedGroupIds.length} Groups Selected`}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">API Endpoint</label>
                                            <p className="font-mono text-xs text-emerald-700 mt-1">
                                                {messageType === "text"
                                                    ? recipientType === "single"
                                                        ? "POST /send-message"
                                                        : "POST /bulk-send-messages"
                                                    : recipientType === "single"
                                                        ? caption.trim()
                                                            ? "POST /send-file-text"
                                                            : "POST /send-file"
                                                        : caption.trim()
                                                            ? "POST /bulk-send-files-with-text"
                                                            : "POST /bulk-send-files"
                                                }
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content Preview</label>
                                            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                                {messageType === 'text' ? messageContent : (
                                                    <>
                                                        <span className="block font-medium text-gray-800 mb-1">Media Type: <span className="capitalize">{mediaType}</span></span>
                                                        <span className="block text-xs text-gray-500">File Path: {filePath || "No file path set"}</span>
                                                        {caption && <span className="block text-xs text-gray-500 mt-1">Caption: {caption}</span>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Navigation */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 1 || sending}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 1
                                        ? "opacity-0 pointer-events-none"
                                        : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>

                                {currentStep < 4 ? (
                                    <button
                                        onClick={handleNext}
                                        disabled={!isStepValid(currentStep)}
                                        className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200"
                                    >
                                        Next Step <ChevronRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sending}
                                        className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-70 transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                        {sending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                                        {sending ? "Sending..." : "Send Message"}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Bulk Results Panel ──────────────────────────────────────── */}
                <AnimatePresence>
                    {bulkResults && bulkResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Activity size={20} /> Broadcast Results
                                </h3>
                                <button
                                    onClick={() => setBulkResults(null)}
                                    className="text-gray-400 hover:text-gray-600 text-sm"
                                >
                                    Dismiss
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {bulkResults.map((r, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg text-sm ${r.status === "success" ? "bg-green-50" : "bg-red-50"}`}>
                                        <span className="font-mono text-gray-700">{r.recipient}</span>
                                        <span className={`flex items-center gap-1 font-medium ${r.status === "success" ? "text-green-700" : "text-red-600"}`}>
                                            {r.status === "success" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {r.status === "success" ? "Sent" : r.error || "Failed"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* Feedback Toast */}
                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className={`fixed bottom-8 right-8 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 max-w-lg ${status.type === 'success' ? 'bg-emerald-900 text-white' : 'bg-red-500 text-white'
                                }`}
                        >
                            {status.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                            <div>
                                <h4 className="font-bold">{status.type === 'success' ? 'Success' : 'Error'}</h4>
                                <p className="text-sm opacity-90">{status.text}</p>
                            </div>
                            <button onClick={() => setStatus(null)} className="ml-2 hover:opacity-70"><Check size={16} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
