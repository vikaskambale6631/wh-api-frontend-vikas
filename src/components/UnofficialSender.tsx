"use client";

import React, { useState } from 'react';
import { deviceService } from '@/services/deviceService';
import { getErrorMessage } from '@/utils/error';

export default function UnofficialSender({ userId }: { userId: string }) {
    const [receiver, setReceiver] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            // Attempt to send message
            await deviceService.sendMessage(userId, receiver, message);
            setStatus({ type: 'success', text: 'Message sent successfully!' });
            setMessage('');
        } catch (error: any) {
            const errorDetail = getErrorMessage(error);

            // Check if error is due to missing device
            if (errorDetail.includes("No active device")) {
                setStatus({ type: 'error', text: "No active device. Attempting auto-connection..." });

                try {
                    // 1. Fetch existing devices
                    const devices = await deviceService.getDevices(userId);
                    let targetDeviceId: string;

                    if (devices.length === 0) {
                        // 2. Create new device if none exist
                        const newDeviceResponse = await deviceService.addDevice(userId, "Auto-Created Web Client", "web");
                        targetDeviceId = newDeviceResponse.device_id;
                    } else {
                        // Use the first available device
                        targetDeviceId = devices[0].device_id;
                    }

                    // 3. Simulate Connection (since we are in test mode)
                    await deviceService.simulateConnection(targetDeviceId, userId);

                    // 4. Retry Sending Message
                    await deviceService.sendMessage(userId, receiver, message);

                    setStatus({ type: 'success', text: 'Device connected & Message sent!' });
                    setMessage('');

                    // Refresh devices list if possible (optional here as this component doesn't own the list)
                } catch (retryError: any) {
                    const retryMsg = getErrorMessage(retryError);
                    setStatus({ type: 'error', text: `Auto-connect failed: ${retryMsg}` });
                }
            } else {
                // Ensure we show the specific backend error (e.g., "Insufficient credits. Please top up your message credits.")
                setStatus({ type: 'error', text: errorDetail });
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-2xl bg-white rounded-xl shadow border border-gray-100 p-6">
            <h3 className="text-lg font-medium mb-4">Send Message (Unofficial)</h3>

            <form onSubmit={handleSend} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Number</label>
                    <input
                        type="text"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="e.g. 919876543210"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                        required
                    />
                </div>

                {status && (
                    <div className={`p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {status.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {sending ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Sending...
                        </>
                    ) : (
                        "Send Message"
                    )}
                </button>
            </form>
        </div>
    );
};
