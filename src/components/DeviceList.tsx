"use client";

import React, { useEffect, useState } from 'react';
import { deviceService, Device } from '@/services/deviceService';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { getErrorMessage } from '@/utils/error';

export default function DeviceList({ userId }: { userId: string }) {
    const [unofficialDevices, setUnofficialDevices] = useState<Device[]>([]);
    const [officialDevices, setOfficialDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [showQR, setShowQR] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeActionDeviceId, setActiveActionDeviceId] = useState<string | null>(null);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState("");

    const fetchDevices = async () => {
        try {
            setLoading(true);

            // 🔥 FIXED: Use separate endpoints for strict device type filtering
            const [unofficial, official] = await Promise.all([
                deviceService.getUnofficialDevices(userId),
                deviceService.getOfficialDevices(userId)
            ]);

            setUnofficialDevices(unofficial);
            setOfficialDevices(official);
        } catch (error) {
            console.error("Failed to fetch devices", getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchDevices();
        }
    }, [userId]);

    // No periodic polling or timers: trust backend DB state as single source of truth

    const handleAddDevice = () => {
        setNewDeviceName("");
        setShowAddModal(true);
    };

    const submitAddDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeviceName.trim()) return;

        try {
            setActionLoading(true);
            console.log("🔧 Creating new device:", { userId, deviceName: newDeviceName });
            
            await deviceService.addDevice(userId, newDeviceName);
            console.log("✅ Device created successfully");
            
            setShowAddModal(false);
            // Force refetch to ensure UI reflects DB state immediately
            await fetchDevices();
        } catch (error) {
            console.error("❌ Failed to add device:", error);
            alert(`Failed to add device: ${getErrorMessage(error)}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = async (deviceId: string, deviceName: string) => {
        // 🔥 REQUIREMENT: "Logout = Remove" (Hard Rule)
        // eslint-disable-next-line no-restricted-globals
        if (confirm(`Are you sure you want to disconnect "${deviceName}"? The device will be removed permanently.`)) {
            try {
                setActiveActionDeviceId(deviceId);
                console.log("🗑️ Logging out device:", { deviceId, deviceName });
                
                await deviceService.logoutDevice(deviceId);
                console.log("✅ Device logged out successfully");

                // Regardless of backend response details, we treat it as removed
                alert("Device logged out and removed successfully.");

                // Force refetch to ensure UI reflects DB state immediately
                await fetchDevices();
            } catch (error: any) {
                console.error("❌ Logout failed:", error);
                // Even if it fails (e.g. 404), refresh the list as it might be gone
                await fetchDevices();
                if (error.response?.status !== 404) {
                    alert(`Failed to logout device: ${error.response?.data?.error || 'Unknown error'}`);
                }
            } finally {
                setActiveActionDeviceId(null);
            }
        }
    };

    const handleHealDevices = async () => {
        try {
            setActionLoading(true);
            const result = await deviceService.healOrphanedDevices();
            alert(result.message);
            await fetchDevices();
        } catch (error) {
            console.error("Heal failed:", error);
            alert(`Failed to heal devices: ${getErrorMessage(error)}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReconnect = async (device: Device) => {
        try {
            setActiveActionDeviceId(device.device_id);
            await deviceService.reconnectDevice(device.device_id);
            await fetchDevices();
            alert("Reconnection initiated successfully!");
        } catch (error) {
            console.error("Reconnect failed:", error);
            alert(`Failed to reconnect: ${getErrorMessage(error)}`);
        } finally {
            setActiveActionDeviceId(null);
        }
    };

    const handleConnect = (device: Device) => {
        setActiveActionDeviceId(device.device_id);
        setSelectedDevice(device);
        console.log("📷 Initiating QR connection for device:", { 
            deviceId: device.device_id, 
            deviceName: device.device_name,
            currentStatus: device.session_status 
        });
        setShowQR(true);
    };

    const handleScanSuccess = async (token: string) => {
        console.log("✅ QR scan successful for device:", selectedDevice?.device_name);
        setShowQR(false);
        setActiveActionDeviceId(null);
        // Force refetch to ensure UI reflects DB state immediately
        await fetchDevices();
        alert("Device Connected Successfully!");
    };

    const renderDeviceCard = (device: Device) => {
        const isOfficial = device.device_type === 'official';
        // 🔥 SIMPLIFIED STATUS LOGIC - Backend is source of truth
        const isConnected = device.session_status === 'connected';
        const isCreated = device.session_status === 'created' || device.session_status === 'pending';
        const isQRReady = device.session_status === 'qr_ready' || device.session_status === 'qr_generated';

        return (
            <div key={device.device_id} className="bg-white p-5 rounded-xl shadow border border-gray-100 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-semibold text-lg">{device.device_name}</h3>
                            {!isOfficial && (
                                <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-medium ${
                                    isConnected ? 'bg-green-100 text-green-700' : 
                                    isQRReady ? 'bg-blue-100 text-blue-700' :
                                    isCreated ? 'bg-gray-100 text-gray-600' :
                                    'bg-red-50 text-red-600'
                                }`}>
                                    {isConnected ? '✅ Connected Device' : 
                                     isQRReady ? '� QR Ready' :
                                     isCreated ? '📱 Device Created' :
                                     '❌ Disconnected'}
                                </span>
                            )}
                            {isOfficial && (
                                <span className="inline-block mt-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                                    ☁️ Official WhatsApp API
                                </span>
                            )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isConnected ? 'bg-green-100 text-green-800' :
                            isQRReady ? 'bg-blue-100 text-blue-800' :
                            isCreated ? 'bg-gray-100 text-gray-800' :
                            'bg-red-50 text-red-600'
                        }`}>
                            {isConnected ? 'Connected' :
                             isQRReady ? 'QR Ready' :
                             isCreated ? 'Created' :
                             'Disconnected'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{device.device_type}</p>
                    {device.last_active && (
                        <p className="text-xs text-gray-400">
                            Last active: {new Date(device.last_active).toLocaleString()}
                        </p>
                    )}
                </div>

                <div className="flex gap-2 mt-4 text-sm">
                    {/* 🔥 OFFICIAL DEVICES: Just Logout */}
                    {isOfficial ? (
                        <>
                            <div className="flex-1 flex items-center justify-center text-xs text-blue-600 bg-blue-50 rounded border border-blue-100">
                                ☁️ Cloud API Active
                            </div>
                            <button
                                onClick={() => handleLogout(device.device_id, device.device_name)}
                                disabled={activeActionDeviceId === device.device_id}
                                className="px-3 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded transition-colors disabled:opacity-60"
                            >
                                Delete
                            </button>
                        </>
                    ) : (
                        /* 🔥 UNOFFICIAL DEVICES - Proper lifecycle flow */
                        <>
                            {isConnected ? (
                                /* CONNECTED STATE - Show connected status */
                                <>
                                    <button
                                        onClick={() => alert("Use Device feature coming soon!")}
                                        disabled={activeActionDeviceId === device.device_id}
                                        className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded transition-colors disabled:opacity-60 font-medium"
                                    >
                                        ✅ Connected
                                    </button>
                                </>
                            ) : (
                                /* DISCONNECTED/CREATED/QR_READY STATE - Always show Connect Device */
                                <>
                                    <button
                                        onClick={() => handleConnect(device)}
                                        disabled={activeActionDeviceId === device.device_id}
                                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-2 rounded transition-colors disabled:opacity-60 shadow-sm font-medium"
                                    >
                                        📷 Connect Device
                                    </button>
                                </>
                            )}

                            {/* ALWAYS ALLOW LOGOUT/DELETE */}
                            <button
                                onClick={() => handleLogout(device.device_id, device.device_name)}
                                disabled={activeActionDeviceId === device.device_id}
                                className="px-3 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded transition-colors disabled:opacity-60"
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Linked Devices</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleHealDevices}
                        disabled={actionLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                        🔄 Heal Orphaned
                    </button>
                    <button
                        onClick={handleAddDevice}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? 'Adding...' : '+ Add Device'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading devices...</div>
            ) : (
                // 🔥 FIXED: 2-column layout for official and unofficial devices
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Unofficial Devices Column */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">📱 Unofficial Devices (Web / QR)</h3>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {unofficialDevices.length} device{unofficialDevices.length === 1 ? '' : 's'}
                            </span>
                        </div>
                        {unofficialDevices.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                                <div className="text-gray-500 mb-2">📱</div>
                                <div className="text-sm text-gray-500">No unofficial devices connected.</div>
                                <button
                                    onClick={handleAddDevice}
                                    className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    + Add Unofficial Device
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {unofficialDevices.map(renderDeviceCard)}
                            </div>
                        )}
                    </section>

                    {/* Official Devices Column */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">☁️ Official WhatsApp Device</h3>
                            <span className="text-sm text-gray-500 bg-green-100 px-2 py-1 rounded-full">
                                {officialDevices.length} device{officialDevices.length === 1 ? '' : 's'}
                            </span>
                        </div>
                        {officialDevices.length === 0 ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                                <div className="text-green-500 mb-2">☁️</div>
                                <div className="text-sm text-gray-600">No official WhatsApp device linked.</div>
                                <div className="text-xs text-gray-500 mt-2">Connect your Official WhatsApp Cloud API device</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {officialDevices.map(renderDeviceCard)}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {showQR && selectedDevice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-center">Scan QR Code</h3>
                        <QRCodeDisplay
                            deviceId={selectedDevice.device_id}
                            userId={userId}
                            onScanSuccess={handleScanSuccess}
                        />
                    </div>
                </div>
            )}

            {/* 🔥 ADD DEVICE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">New Web / QR Device</h3>
                        <form onSubmit={submitAddDevice}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
                                <input
                                    type="text"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    placeholder="e.g. Work MacBook"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Each device operates independently. Multiple devices allowed based on your plan.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !newDeviceName.trim()}
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                >
                                    {actionLoading ? 'Creating...' : 'Create Device'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
