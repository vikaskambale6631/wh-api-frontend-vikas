"use client";

import { useEffect, useState } from "react";
import {
    Settings, Clock, CheckCircle, RefreshCcw, Save, MessageSquare, AlertCircle
} from "lucide-react";
import { googleSheetService, GoogleSheet, TriggerHistory } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import { googleSheetUnofficialService } from "@/services/googleSheetUnofficialService";

export default function OfficialTriggerPage() {
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [history, setHistory] = useState<TriggerHistory[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedSheetId, setSelectedSheetId] = useState("");
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [columns, setColumns] = useState<string[]>([]);

    // Unofficial API Requirements
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");

    // Using string config instead of official template
    const [triggerConfig, setTriggerConfig] = useState({
        trigger_type: "update_row",
        is_enabled: true,
        text_message: "",
        phone_column: "",
        trigger_column: "",
        trigger_value: "",
        status_column: "Status"
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
        loadDevices();
        fetchHistory();

        const interval = setInterval(() => {
            fetchHistory();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadDevices = async () => {
        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                console.error("No user ID found in localStorage");
                return;
            }
            const data = await deviceService.getDevices(userId);
            setDevices(data);
        } catch (error) {
            console.error("Failed to load devices", error);
        }
    };

    useEffect(() => {
        if (selectedSheetId) {
            const sheet = sheets.find(s => s.id === selectedSheetId);
            setSelectedSheet(sheet || null);
            if (sheet) {
                loadSheetColumns(sheet.id);
            }
        } else {
            setSelectedSheet(null);
            setColumns([]);
        }
    }, [selectedSheetId, sheets]);

    const loadData = async () => {
        setLoading(true);

        try {
            const sheetsData = await googleSheetService.listSheets();
            setSheets(sheetsData);
        } catch (error) {
            console.error("Failed to load sheets", error);
        }

        setLoading(false);
    };

    const loadSheetColumns = async (sheetId: string) => {
        try {
            const res = await googleSheetService.fetchRows(sheetId);
            if (res.headers) {
                setColumns(res.headers);

                const phoneCol = res.headers.find((c: string) =>
                    c.toLowerCase().includes('phone') || c.toLowerCase().includes('mobile')
                );
                const statusCol = res.headers.find((c: string) =>
                    c.toLowerCase().includes('status') || c.toLowerCase().includes('state')
                );

                setTriggerConfig(prev => ({
                    ...prev,
                    phone_column: phoneCol || "",
                    status_column: statusCol || "Status"
                }));
            }
        } catch (error) {
            console.error("Failed to load sheet columns", error);
        }
    };



    const fetchHistory = async () => {
        try {
            const historyData = await googleSheetService.getAllTriggerHistory();
            setHistory(historyData);
        } catch (error: any) {
            console.error("Failed to fetch trigger history", error);

            // Defensive error handling - don't retry on server errors
            if (!error.response) {
                console.error("Backend not reachable. Please try again later.");
            } else if (error.response.status >= 500) {
                console.error("Server error - not retrying automatically");
            } else {
                // Only retry on client errors (4xx) if needed
                console.error("Client error occurred");
            }
        }
    };

    const handleSaveTrigger = async () => {
        if (!selectedSheetId || !triggerConfig.text_message || !selectedDeviceId) {
            alert("Please fill all required fields, including text message and device");
            return;
        }

        setSaving(true);
        try {
            const device = devices.find(d => d.device_id === selectedDeviceId);

            // Unofficial triggers generally need a webhook to run logic dynamically, 
            // but the system may still utilize `setTrigger` endpoint with Unofficial info
            // For now we map it directly:
            const triggerPayload = {
                trigger_type: triggerConfig.trigger_type,
                is_enabled: triggerConfig.is_enabled,
                phone_column: triggerConfig.phone_column,
                message_template: triggerConfig.text_message, // using unofficial raw string template
                trigger_column: triggerConfig.trigger_column,
                trigger_value: triggerConfig.trigger_value,
                status_column: triggerConfig.status_column,
                // Extra fields stored in DB dynamically or parsed depending on your API
                device_id: device?.device_id || selectedDeviceId
            };

            await googleSheetService.setTrigger(selectedSheetId, triggerPayload);
            alert("✅ Unofficial template trigger created successfully!");

            setTriggerConfig({
                trigger_type: "update_row",
                is_enabled: true,
                text_message: "",
                phone_column: "",
                trigger_column: "",
                trigger_value: "",
                status_column: "Status"
            });
            setSelectedSheetId("");
            setSelectedDeviceId("");
        } catch (error: any) {
            console.error("Trigger creation error:", error);

            let errorMessage = "Failed to create trigger";

            if (!error.response) {
                errorMessage = "Backend not reachable. Please try again.";
            } else if (error.response.status >= 500) {
                errorMessage = "Server error. Please try again later.";
            } else if (error.response.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(`❌ ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };



    const getHistoryStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'sent': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Bulk Notification Triggers</h1>
                    <p className="text-gray-500 text-sm mt-1">Automate bulk WhatsApp messages based on Google Sheet changes (Unofficial API)</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Unofficial API Context
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Automated
                        </span>
                    </div>
                </div>
                <button onClick={fetchHistory} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <RefreshCcw className="w-4 h-4" />
                    Refresh History
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trigger Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-emerald-600" />
                            Trigger Configuration
                        </h2>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            Unofficial API
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Sheet Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet</label>
                            <select value={selectedSheetId} onChange={(e) => setSelectedSheetId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="">Select sheet</option>
                                {sheets.map((sheet) => (
                                    <option key={sheet.id} value={sheet.id}>
                                        {sheet.sheet_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Unofficial API Badge */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-800">Unofficial API Active</span>
                            </div>
                            <p className="text-xs text-purple-600 mt-1">Using Connected WhatsApp Device</p>
                        </div>

                        {/* Device Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Device</label>
                            <select
                                value={selectedDeviceId}
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            >
                                <option value="">Select a connected device...</option>
                                {devices.map(device => (
                                    <option key={device.device_id} value={device.device_id}>
                                        {device.device_name} ({device.device_type || 'Unknown Type'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Text Message Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Text Message / Caption</label>
                            <textarea
                                value={triggerConfig.text_message}
                                onChange={(e) => setTriggerConfig(prev => ({ ...prev, text_message: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                rows={4}
                                placeholder="Enter your message here. Use {{ColumnName}} to insert sheet data."
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Example: Hello {"{{Name}}"}, your document is attached!
                            </p>
                        </div>

                        {/* Trigger Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                            <select value={triggerConfig.trigger_type} onChange={(e) => setTriggerConfig(prev => ({ ...prev, trigger_type: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="update_row">Row Update</option>
                                <option value="new_row">New Row</option>
                                <option value="time">Time-based</option>
                            </select>
                        </div>

                        {/* Phone Column */}
                        {columns.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Column</label>
                                <select value={triggerConfig.phone_column} onChange={(e) => setTriggerConfig(prev => ({ ...prev, phone_column: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md">
                                    <option value="">Select phone column</option>
                                    {columns.map((column) => (
                                        <option key={column} value={column}>
                                            {column}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Trigger Conditions */}
                        {triggerConfig.trigger_type !== 'time' && columns.length > 0 && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Column</label>
                                    <select value={triggerConfig.trigger_column} onChange={(e) => setTriggerConfig(prev => ({ ...prev, trigger_column: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md">
                                        <option value="">Select trigger column</option>
                                        {columns.map((column) => (
                                            <option key={column} value={column}>
                                                {column}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Value</label>
                                    <input
                                        type="text"
                                        value={triggerConfig.trigger_value}
                                        onChange={(e) => setTriggerConfig(prev => ({ ...prev, trigger_value: e.target.value }))}
                                        placeholder="e.g., Send, Active, Yes"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Column</label>
                                    <select value={triggerConfig.status_column} onChange={(e) => setTriggerConfig(prev => ({ ...prev, status_column: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md">
                                        <option value="">Select status column</option>
                                        {columns.map((column) => (
                                            <option key={column} value={column}>
                                                {column}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}



                        {/* Enable Trigger */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is-enabled"
                                checked={triggerConfig.is_enabled}
                                onChange={(e) => setTriggerConfig(prev => ({ ...prev, is_enabled: e.target.checked }))}
                            />
                            <label htmlFor="is-enabled" className="text-sm font-medium text-gray-700">Enable trigger</label>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveTrigger}
                            disabled={saving || !selectedSheetId || !triggerConfig.text_message || !selectedDeviceId}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Create Trigger'}
                        </button>
                    </div>
                </div>

                {/* Trigger History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            Trigger History
                        </h2>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {history.length} records
                        </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                No trigger history yet
                            </div>
                        ) : (
                            history.map((item, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs ${getHistoryStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(item.triggered_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="text-gray-900 font-medium">{item.phone_number}</div>
                                        {item.message_content && (
                                            <div className="text-gray-600 mt-1 truncate">{item.message_content}</div>
                                        )}
                                        {item.error_message && (
                                            <div className="text-red-600 text-xs mt-1">{item.error_message}</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
