"use client";

import { useEffect, useState } from "react";
import {
    Filter, Download, Plus, Search, ChevronLeft, ChevronRight,
    MoreHorizontal, FileSpreadsheet, Calendar, ExternalLink, RefreshCw, Send
} from "lucide-react";
import { googleSheetService, GoogleSheet } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GoogleSheetMessagingPage() {
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);

    // Connect Sheet State
    const [isConnectOpen, setIsConnectOpen] = useState(false);
    const [newSheetData, setNewSheetData] = useState({ sheet_name: "", spreadsheet_id: "", worksheet_name: "Sheet1" });

    // Send Message State
    const [isSendOpen, setIsSendOpen] = useState(false);
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [fetchedRows, setFetchedRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [sendConfig, setSendConfig] = useState({ device_id: "", message_template: "", phone_col: "" });
    const [syncing, setSyncing] = useState(false);
    const [sending, setSending] = useState(false);

    // Fetch Sheets
    useEffect(() => {
        loadSheets();
    }, []);

    const loadSheets = async () => {
        setLoading(true);
        try {
            const data = await googleSheetService.listSheets();
            setSheets(data);
        } catch (error) {
            console.error("Failed to load sheets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectSheet = async () => {
        try {
            await googleSheetService.connectSheet(newSheetData);
            setIsConnectOpen(false);
            setNewSheetData({ sheet_name: "", spreadsheet_id: "", worksheet_name: "Sheet1" });
            loadSheets();
        } catch (error: any) {
            console.error("Connect sheet error:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to connect sheet. Check ID.";
            alert(errorMessage);
        }
    };

    const handleDeleteSheet = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await googleSheetService.deleteSheet(id);
            loadSheets();
        } catch (error) {
            alert("Failed to delete sheet");
        }
    }

    // Handle Send Flow
    const openSendModal = async (sheet: GoogleSheet) => {
        setSelectedSheet(sheet);
        setIsSendOpen(true);
        setFetchedRows([]);
        setColumns([]);

        // Fetch devices
        // Ideally get user_id from auth context, but simplified: assume service handles current user or we fetch generic
        try {
            // We need user_id for deviceService, let's try to get it from localStorage or just assume backend filters by token if we adjust service
            // The existing deviceService.getDevices REQUIRES user_id.
            // Let's look at localStorage
            // Fix: Use correct user_id retrieval and filter by connected status
            const userId = localStorage.getItem('user_id')
                || JSON.parse(localStorage.getItem('user') || '{}').user_id;

            if (userId) {
                const deviceData = await deviceService.getDevices(userId, 'connected');
                setDevices(deviceData);
            } else {
                console.warn("No user_id found in localStorage");
            }
        } catch (error) {
            console.error("Failed to load devices", error);
        }
    };

    const handleFetchRows = async () => {
        if (!selectedSheet) return;
        setSyncing(true);
        try {
            const res = await googleSheetService.fetchRows(selectedSheet.id);
            // New format: { headers: [], rows: [] }
            if (res.headers && res.rows) {
                setFetchedRows(res.rows);
                setColumns(res.headers);

                // Auto-select phone column if found
                const phone = res.headers.find((c: string) => c.toLowerCase().includes('phone') || c.toLowerCase().includes('mobile'));
                if (phone) setSendConfig(prev => ({ ...prev, phone_col: phone }));
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || "Failed to fetch rows. Ensure the Google Sheet is 'Everyone with the link can view'.";
            alert(msg);
        } finally {
            setSyncing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedSheet || !sendConfig.device_id || !sendConfig.message_template || !sendConfig.phone_col) {
            alert("Please fill all fields and fetch rows");
            return;
        }

        setSending(true);
        try {
            const count = fetchedRows.length;
            await googleSheetService.manualSend({
                ...sendConfig,
                sheet_id: selectedSheet.id, // Add sheet_id
                selected_rows: fetchedRows
            });
            alert(`Message sending started for ${count} rows!`);
            setIsSendOpen(false);
        } catch (error) {
            alert("Failed to send messages");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Google Sheet Messaging</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your connected Google Sheets for messaging</p>
                </div>
                <Button onClick={() => setIsConnectOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4" />
                    <span>Connect New Sheet</span>
                </Button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Simplified Toolbar */}
                <div className="flex p-4 border-b border-gray-100 gap-4">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search sheets..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Table Header */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-linear-to-r from-emerald-50 to-teal-50 text-emerald-800 text-xs font-semibold tracking-wider uppercase border-b border-emerald-100">
                            <tr>
                                <th className="p-4 w-10">
                                    <input type="checkbox" className="rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                                </th>
                                <th className="p-4 font-semibold min-w-[200px]">Sheet Name</th>
                                <th className="p-4 font-semibold min-w-[150px]">Spreadsheet ID</th>
                                <th className="p-4 font-semibold min-w-[120px]">Connected On</th>
                                <th className="p-4 font-semibold min-w-[100px]">Rows</th>
                                <th className="p-4 font-semibold min-w-[100px]">Status</th>
                                <th className="p-4 font-semibold w-24 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600 divide-y divide-emerald-50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center">Loading sheets...</td></tr>
                            ) : sheets.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center">No sheets connected. Click 'Connect New Sheet' to start.</td></tr>
                            ) : sheets.map((sheet, index) => (
                                <tr key={index} className="hover:bg-emerald-50/40 transition-colors duration-150 group">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                                    </td>
                                    <td className="p-4 border-l border-transparent group-hover:border-emerald-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-100/50 p-2 rounded-lg text-emerald-600">
                                                <FileSpreadsheet className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{sheet.sheet_name}</div>
                                                <div className="text-xs text-gray-400 font-normal mt-0.5">{sheet.worksheet_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 group/id cursor-pointer">
                                            <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 text-gray-500 group-hover/id:border-emerald-200 group-hover/id:text-emerald-700 transition-colors truncate max-w-[120px] block">
                                                {sheet.spreadsheet_id}
                                            </span>
                                            <a href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheet_id}`} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover/id:opacity-100 hover:text-emerald-500 transition-all" />
                                            </a>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span>{new Date(sheet.connected_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 font-mono text-xs">{sheet.total_rows?.toLocaleString() || '-'}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${sheet.status === 'ACTIVE'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : sheet.status === 'PAUSED'
                                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                : 'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                            {sheet.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <Button size="sm" variant="outline" onClick={() => openSendModal(sheet)}>
                                                <Send className="w-3 h-3" />
                                            </Button>
                                            <button onClick={() => handleDeleteSheet(sheet.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Connect Modal */}
            <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect New Sheet</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Friendly Name</label>
                            <Input
                                placeholder="My Customer List"
                                value={newSheetData.sheet_name}
                                onChange={(e) => setNewSheetData({ ...newSheetData, sheet_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Spreadsheet ID</label>
                            <Input
                                placeholder="1BxiMvs0XRA5..."
                                value={newSheetData.spreadsheet_id}
                                onChange={(e) => setNewSheetData({ ...newSheetData, spreadsheet_id: e.target.value })}
                            />
                            <p className="text-xs text-gray-500">Found in your Google Sheet URL.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Worksheet Name</label>
                            <Input
                                placeholder="Sheet1"
                                value={newSheetData.worksheet_name}
                                onChange={(e) => setNewSheetData({ ...newSheetData, worksheet_name: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConnectOpen(false)}>Cancel</Button>
                        <Button onClick={handleConnectSheet} className="bg-emerald-600">Connect</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Message Modal */}
            <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Send Messages from {selectedSheet?.sheet_name} <span className="text-gray-400 text-sm font-normal ml-2">(Tab: {selectedSheet?.worksheet_name})</span></DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Left: Fetched Rows Preview */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold">Sheet Data</h3>
                                <Button size="sm" variant="outline" onClick={handleFetchRows} disabled={syncing}>
                                    <RefreshCw className={`w-3 h-3 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                    Fetch Rows
                                </Button>
                            </div>
                            <div className="h-48 overflow-auto border rounded text-xs">
                                {fetchedRows.length > 0 ? (
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {columns.map(k => <th key={k} className="p-2 border-b">{k}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fetchedRows.slice(0, 5).map((row, i) => (
                                                <tr key={i}>
                                                    {columns.map((col, j) => (
                                                        <td key={j} className="p-2 border-b">
                                                            {/* Row data is now a flat dict matching headers */}
                                                            {typeof row[col] === 'object'
                                                                ? JSON.stringify(row[col])
                                                                : row[col]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <p>Click 'Fetch Rows' to load data.</p>
                                        <p className="text-[10px]">Note: Sheet must be publicly viewable via link for this demo.</p>
                                    </div>
                                )}
                            </div>
                            {fetchedRows.length > 0 && (
                                <p className="text-xs text-emerald-600 font-medium">{fetchedRows.length} rows loaded.</p>
                            )}
                        </div>

                        {/* Right: Sending Config */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold">Configuration</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold">Select Device</label>
                                <select
                                    className="w-full text-sm border p-2 rounded"
                                    value={sendConfig.device_id}
                                    onChange={(e) => setSendConfig({ ...sendConfig, device_id: e.target.value })}
                                >
                                    <option value="">Select Device...</option>
                                    {devices.map(d => <option key={d.device_id} value={d.device_id}>{d.device_name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold">Phone Number Column</label>
                                <select
                                    className="w-full text-sm border p-2 rounded"
                                    value={sendConfig.phone_col}
                                    onChange={(e) => setSendConfig({ ...sendConfig, phone_col: e.target.value })}
                                >
                                    <option value="">Select Column...</option>
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold">Message Template</label>
                                <textarea
                                    className="w-full text-sm border p-2 rounded h-24"
                                    placeholder="Hello {{Name}}, your order {{Order ID}} is ready!"
                                    value={sendConfig.message_template}
                                    onChange={(e) => setSendConfig({ ...sendConfig, message_template: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-400">Use {"{{Column Name}}"} for variables.</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSendOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendMessage} className="bg-emerald-600" disabled={sending || fetchedRows.length === 0}>
                            {sending ? 'Sending...' : 'Send Messages'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
