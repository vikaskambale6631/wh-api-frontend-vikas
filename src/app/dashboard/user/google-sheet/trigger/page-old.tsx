"use client";

import { useEffect, useState } from "react";
import {
    Columns, Filter, ArrowDownUp, Download, Info, CheckCircle, RefreshCcw, Save
} from "lucide-react";
import { googleSheetService, GoogleSheet, TriggerHistory } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TriggerPage() {
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [history, setHistory] = useState<TriggerHistory[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedSheetId, setSelectedSheetId] = useState("");
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [template, setTemplate] = useState("Hello {{Name}}, this is an automated message.");
    const [phoneCol, setPhoneCol] = useState("Phone");
    const [scheduleCol, setScheduleCol] = useState("ScheduleTime");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
        // Initial history load
        fetchHistory();

        // Auto refresh history every 10 seconds
        const interval = setInterval(() => {
            fetchHistory();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setLoading(true);

        // 1. Load Sheets
        try {
            const sheetsData = await googleSheetService.listSheets();
            setSheets(sheetsData);
        } catch (error) {
            console.error("Failed to load sheets", error);
        }

        // 2. Load Devices
        try {
            const userId = localStorage.getItem('user_id')
                || JSON.parse(localStorage.getItem('user') || '{}').user_id;

            if (userId) {
                const devs = await deviceService.getDevices(userId, 'connected');
                setDevices(devs);
            } else {
                console.warn("No user_id found in localStorage");
            }
        } catch (error) {
            console.error("Failed to load devices", error);
        }

        // 3. History is loaded via effect when sheet selected or if user asks?
        // User request says: "Trigger history API should be called ONLY if sheet_id exists"
        // So we do NOT call it here for "all" unless we have an endpoint.
        // For now, we skip loading history on mount to avoid /undefined/ request.
        setLoading(false);
    };

    // Load history global
    const fetchHistory = async (id?: string) => {
        // We ignore ID now as we fetch global history per requirements
        try {
            const hist = await googleSheetService.getAllTriggerHistory();
            setHistory(Array.isArray(hist) ? hist : []);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    // When sheet is selected, try to pre-fill existing config if any (This logic would require fetching single sheet detail, but we have list. Let's rely on list)
    useEffect(() => {
        if (selectedSheetId) {
            const sheet = sheets.find(s => s.id === selectedSheetId);
            if (sheet && sheet.trigger_config) {
                if (sheet.device_id) setSelectedDeviceId(sheet.device_id);
                // Note: The new backend stores config on the TRIGGER, not the SHEET.
                // But simplified for now:
                if (sheet.message_template) setTemplate(sheet.message_template);
            }
        }
    }, [selectedSheetId, sheets]);

    const handleSaveTrigger = async () => {
        if (!selectedSheetId || !selectedDeviceId) {
            alert("Please select a sheet and a device.");
            return;
        }

        setSaving(true);
        try {
            // New Payload matching TriggerCreateRequest
            await googleSheetService.setTrigger(selectedSheetId, {
                device_id: selectedDeviceId,
                trigger_type: "time", // Changed to time for schedule logic
                is_enabled: true,
                message_template: template,
                phone_column: phoneCol,
                trigger_column: "Status", // This is the column to Watch 
                status_column: "Status", // Explicitly mapping for backend
                trigger_value: "Scheduled", // Changed to Scheduled per requirements
                schedule_column: scheduleCol, // New field
            });
            alert("Trigger saved successfully! Add columns 'Status' (set to 'Scheduled') and '" + scheduleCol + "' (YYYY-MM-DD HH:mm).");
            fetchHistory();
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Failed to save trigger.";
            alert(msg);
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header 1 */}
            <div className="flex justify-center mb-8">
                <h1 className="text-emerald-500 font-bold text-lg">SET TRIGGER</h1>
            </div>

            {/* Config Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-2">SELECT SHEET</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                value={selectedSheetId}
                                onChange={(e) => setSelectedSheetId(e.target.value)}
                            >
                                <option value="">Select a connected sheet...</option>
                                {sheets.map(s => <option key={s.id} value={s.id}>{s.sheet_name} ({s.worksheet_name})</option>)}
                            </select>
                            {sheets.length === 0 && <p className="text-[10px] text-red-500 mt-1">No sheets found. Go to Messaging to connect one.</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-2">CONNECTED DEVICE</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                value={selectedDeviceId}
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                            >
                                <option value="">Select device...</option>
                                {devices.map(d => <option key={d.device_id} value={d.device_id}>{d.device_name} ({d.session_status})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-2">PHONE COLUMN NAME</label>
                            <Input
                                value={phoneCol}
                                onChange={(e) => setPhoneCol(e.target.value)}
                                placeholder="e.g. Phone"
                                className="bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-2">SCHEDULE COLUMN NAME</label>
                            <Input
                                value={scheduleCol}
                                onChange={(e) => setScheduleCol(e.target.value)}
                                placeholder="e.g. ScheduleTime"
                                className="bg-gray-50"
                            />
                        </div>
                        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                            <strong>Note:</strong> We will check every 30 seconds.
                            Set Status to <b>"Scheduled"</b> and ensure <b>{scheduleCol || "ScheduleTime"}</b> has a past or current time.
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-2">MESSAGE TEMPLATE</label>
                            <textarea
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded text-sm h-32 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                placeholder="Hi {{Name}}, thanks for contacting us!"
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveTrigger} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto">
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? "Saving..." : "Save Trigger"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header 2 */}
            <div className="flex justify-center mb-6">
                <h1 className="text-emerald-500 font-bold text-lg">TRIGGER HISTORY</h1>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-4 p-4 border-b border-gray-100 text-blue-500 text-xs font-semibold tracking-wide uppercase">
                    <button className="flex items-center gap-1 hover:text-blue-600" onClick={loadData}>
                        <RefreshCcw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </div>

                {/* Table Header */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                            <tr>
                                <th className="p-4 w-10">
                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                </th>
                                <th className="p-4 font-normal">Date Time</th>
                                <th className="p-4 font-normal border-l border-gray-100">Sheet ID</th>
                                <th className="p-4 font-normal border-l border-gray-100">Phone</th>
                                <th className="p-4 font-normal border-l border-gray-100">Message</th>
                                <th className="p-4 font-normal border-l border-gray-100">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-500">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center">Loading history...</td></tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center h-64 align-middle">
                                        No trigger history found.
                                    </td>
                                </tr>
                            ) : Array.isArray(history) && history.map((h, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    </td>
                                    <td className="p-4">{new Date(h.triggered_at).toLocaleString()}</td>
                                    <td className="p-4 border-l border-gray-50 font-mono text-xs">
                                        {h.sheet_id ? `${h.sheet_id.slice(0, 8)}...` : 'Manual Send'}
                                    </td>
                                    <td className="p-4 border-l border-gray-50">{h.phone_number}</td>
                                    <td className="p-4 border-l border-gray-50 truncate max-w-xs" title={h.message_content}>{h.message_content}</td>
                                    <td className="p-4 border-l border-gray-50">
                                        <span className={`px-2 py-1 rounded-full text-xs ${h.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {h.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
