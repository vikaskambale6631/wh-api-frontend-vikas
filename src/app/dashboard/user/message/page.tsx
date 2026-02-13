"use client";

import { useState, useEffect } from "react";
import {
    Send, Users, MessageSquare, CheckCircle, AlertCircle,
    RefreshCw, Smartphone, ChevronRight, ChevronLeft,
    Check, Zap, XCircle
} from "lucide-react";
import { userDashboardService } from "@/services/userDashboardService";
import groupService, { Group } from "@/services/groupService";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { API_BASE_URL } from "@/config/api";

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

export default function UnofficialMessagePage() {
    // Steps: 1=Type, 2=Recipient, 3=Compose, 4=Review
    const [currentStep, setCurrentStep] = useState(1);
    
    // 🔥 FIXED: Get userId from localStorage
    const [userId, setUserId] = useState<string | null>(null);

    // Device Status
    const [deviceStatus, setDeviceStatus] = useState<"loading" | "connected" | "disconnected">("loading");
    const [deviceName, setDeviceName] = useState<string>("");

    // Form states
    const [messageType, setMessageType] = useState<"text">("text"); // Only text supported officially for now in this wizard
    const [recipientType, setRecipientType] = useState<"single" | "group">("single");

    // Single user messaging states
    const [singleUserPhone, setSingleUserPhone] = useState("");

    // Group messaging states
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    // Content state
    const [messageContent, setMessageContent] = useState("");

    // Status states
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        // 🔥 FIXED: Get userId from localStorage
        const storedUserId = localStorage.getItem("user_id");
        if (storedUserId) {
            setUserId(storedUserId);
            checkDeviceAndLoadGroups(storedUserId);
        }
    }, []);

    const checkDeviceAndLoadGroups = async (currentUserId: string) => {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // 1. Check Device Status - 🔥 FIXED: Use unofficial/connected endpoint for STRICT filtering
            const response = await fetch(`${API_BASE_URL}/devices/unofficial/connected?user_id=${currentUserId}`);
            const data = await response.json();
            
            // 🔥 STRICT FILTER: Only show devices that backend confirms are CONNECTED
            const connectedDevices = data.devices || [];
            const connectedDevice = connectedDevices.find((d: any) =>
                d.session_status === "connected" &&
                d.device_type === "web"
            );

            if (connectedDevice) {
                setDeviceStatus("connected");
                setDeviceName(connectedDevice.device_name);
                console.log("✅ Found connected device:", connectedDevice.device_name);
            } else {
                setDeviceStatus("disconnected");
                console.log("❌ No connected unofficial devices found");
            }

            // 2. Load Groups
            const groupsData = await groupService.getGroups(token);
            setGroups(groupsData);

        } catch (error) {
            console.error("Failed to load initial data:", error);
            setDeviceStatus("disconnected"); // Assume disconnected on error
        } finally {
            setLoading(false);
        }
    };

    const refreshDeviceStatus = async () => {
        if (!userId) return;
        
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // Force refresh by calling the sync endpoint directly
            await fetch(`${API_BASE_URL.replace('/api', '')}/sync-devices/${userId}`);

            // Then check device status again
            await checkDeviceAndLoadGroups(userId);

        } catch (error) {
            console.error("Failed to refresh device status:", error);
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        if (selectedGroupIds.includes(groupId)) {
            setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
        } else {
            setSelectedGroupIds([...selectedGroupIds, groupId]);
        }
    };

    // Validation Logic for Steps
    const isStepValid = (step: number) => {
        if (deviceStatus !== "connected") return false; // Block everything if no device

        if (step === 1) return true; // Type selection (only Text for now)

        if (step === 2) {
            if (recipientType === "single") {
                return singleUserPhone.length > 5;
            } else {
                return selectedGroupIds.length > 0;
            }
        }

        if (step === 3) {
            return messageContent.trim().length > 0;
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

    const handleSendMessage = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setSending(true);
            setStatus(null);

            // 🔥 FIXED: Double-check device is still connected before sending
            if (!userId) {
                throw new Error("User ID not found. Please refresh the page.");
            }
            
            const response = await fetch(`${API_BASE_URL}/devices/unofficial/connected?user_id=${userId}`);
            const data = await response.json();
            const connectedDevices = data.devices || [];
            const connectedDevice = connectedDevices.find((d: any) =>
                d.session_status === "connected" &&
                d.device_type === "web"
            );

            if (!connectedDevice) {
                throw new Error("No connected device found. Please connect your device first.");
            }

            console.log("🔐 Sending message via device:", connectedDevice.device_name);

            if (recipientType === "single") {
                const response = await userDashboardService.sendUnofficialMessage(token, singleUserPhone, messageContent);
                if (!response.success) throw new Error(response.message || "Failed to send message");
            } else {
                // Unofficial Group Sending (Backend handles iteration natively or loop is done in backend)
                // Checking groupService: it calls /groups/send-message which iterates in backend.
                // So we just make one call.
                const response = await groupService.sendMessage(token, selectedGroupIds, messageContent);
                if (!response.success) throw new Error("Failed to send group messages");

                setStatus({
                    type: "success",
                    text: `Sent successfully to ${response.sent} contacts.`
                });
                // Return early to avoid overriding status if we want detailed "sent X" message
                // But the finally block handles cleanup? No, let's just let it flow.
            }

            if (recipientType === "single") {
                setStatus({ type: "success", text: "Message sent successfully!" });
            }

            setCurrentStep(1); // Reset
            setMessageContent("");
            setSingleUserPhone("");
            setSelectedGroupIds([]);

        } catch (error: any) {
            console.error("❌ Message sending failed:", error);
            setStatus({
                type: "error",
                text: error.response?.data?.detail || error.message || "Failed to send message."
            });
        } finally {
            setSending(false);
        }
    };

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
                                            disabled
                                            className="group relative p-8 rounded-2xl border-2 border-gray-50 bg-gray-50 text-left opacity-60 cursor-not-allowed"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gray-200 text-gray-400 flex items-center justify-center mb-4">
                                                <Zap size={24} />
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-lg font-bold text-gray-500">Media Message</h3>
                                                <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded-full">Coming Soon</span>
                                            </div>
                                            <p className="text-sm text-gray-400 leading-relaxed">
                                                Send images, videos, and documents. Feature currently in development.
                                            </p>
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
                                                        placeholder="e.g. 15551234567"
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
                                                            <span className={`font-medium ${selectedGroupIds.includes(group.group_id) ? 'text-emerald-900' : 'text-gray-700'}`}>
                                                                {group.name}
                                                            </span>
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
                                        <h2 className="text-2xl font-bold text-gray-800">Compose Message</h2>
                                    </div>

                                    <div className="grid lg:grid-cols-3 gap-8 h-full">
                                        <div className="lg:col-span-2 space-y-6">
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
                                        </div>

                                        {/* Preview / Tips Column */}
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
                                                    <span>Unofficial messages respect your device's sending limits.</span>
                                                </li>
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
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content</label>
                                            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                                {messageContent}
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

                {/* Feedback Toast */}
                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className={`fixed bottom-8 right-8 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 ${status.type === 'success' ? 'bg-emerald-900 text-white' : 'bg-red-500 text-white'
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
