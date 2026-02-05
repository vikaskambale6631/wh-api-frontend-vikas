"use client";

import { useEffect, useState } from "react";
import {
    Plus, Search, FileSpreadsheet, ExternalLink, RefreshCw, Send,
    MessageSquare, CheckCircle, XCircle
} from "lucide-react";
import { googleSheetService, GoogleSheet } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import ConnectSheetModal from "@/components/ConnectSheetModal";

interface Template {
    id: string;
    template_name: string;
    category: string;
    language: string;
    status: string;
}

export default function GoogleSheetMessagingPage() {
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [fetchedRows, setFetchedRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [sendConfig, setSendConfig] = useState({
        mode: "template" as "text" | "template",
        text_message: "",
        template_name: "",
        language_code: "en_US",
        phone_column: "",
        header_param_columns: [] as string[],
        body_param_columns: [] as string[],
        send_all: false
    });
    const [syncing, setSyncing] = useState(false);
    const [sending, setSending] = useState(false);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [sessionValidation, setSessionValidation] = useState<any>(null);
    const [validatingSession, setValidatingSession] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);

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

    const openSendModal = async (sheet: GoogleSheet) => {
        setSelectedSheet(sheet);
        setShowSendModal(true);
        setFetchedRows([]);
        setColumns([]);
        setSendConfig({
            mode: "template",
            text_message: "",
            template_name: "",
            language_code: "en_US",
            phone_column: "",
            header_param_columns: [],
            body_param_columns: [],
            send_all: false
        });

        // Fetch templates
        await loadTemplates(sheet.id);
    };

    const loadTemplates = async (sheetId: string) => {
        setTemplatesLoading(true);
        try {
            const data = await googleSheetService.getTemplates(sheetId);
            if (data.success) {
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error("Failed to load templates", error);
        } finally {
            setTemplatesLoading(false);
        }
    };

    const handleFetchRows = async () => {
        if (!selectedSheet) return;
        setSyncing(true);
        try {
            const res = await googleSheetService.fetchRows(selectedSheet.id);
            if (res.headers && res.rows) {
                setFetchedRows(res.rows);
                setColumns(res.headers);
                const phone = res.headers.find((c: string) => c.toLowerCase().includes('phone') || c.toLowerCase().includes('mobile'));
                if (phone) setSendConfig(prev => ({ ...prev, phone_column: phone }));
            }
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to fetch rows");
        } finally {
            setSyncing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedSheet || !sendConfig.phone_column) {
            alert("Please fill all required fields and fetch rows");
            return;
        }

        // Validate mode-specific fields
        if (sendConfig.mode === "template" && !sendConfig.template_name) {
            alert("Please select a template");
            return;
        }
        if (sendConfig.mode === "text" && !sendConfig.text_message) {
            alert("Please enter a text message");
            return;
        }

        // 🔥 CRITICAL: Validate 24-hour session for text messages
        if (sendConfig.mode === "text") {
            await validateTextMessageSession();
            
            if (sessionValidation && !sessionValidation.can_send_all) {
                const confirmSend = confirm(
                    `⚠️ SESSION VALIDATION WARNING\n\n${sessionValidation.summary}\n\n` +
                    `Text messages may not be delivered to recipients without active customer sessions.\n\n` +
                    `Do you want to proceed anyway? (Recommended: Use Template Messages)`
                );
                if (!confirmSend) {
                    return;
                }
            }
        }

        setSending(true);
        try {
            const payload = {
                mode: sendConfig.mode,
                phone_column: sendConfig.phone_column,
                selected_rows: sendConfig.send_all ? [] : fetchedRows,
                send_all: sendConfig.send_all,
                // Text message fields
                text_message: sendConfig.mode === "text" ? sendConfig.text_message : undefined,
                // Template fields
                template_name: sendConfig.mode === "template" ? sendConfig.template_name : undefined,
                language_code: sendConfig.language_code,
                header_param_columns: sendConfig.header_param_columns,
                body_param_columns: sendConfig.body_param_columns,
            };

            const result = await googleSheetService.sendGoogleSheetMessage(selectedSheet.id, payload);
            
            if (result.sent > 0) {
                alert(`✅ ${sendConfig.mode === "text" ? "Text" : "Template"} messages sent! Sent: ${result.sent}, Failed: ${result.failed}`);
                console.log("Message IDs (wamid):", result.message_ids);
            } else {
                alert(`❌ Failed to send messages. Errors: ${result.errors.join(', ')}`);
            }
            
            setShowSendModal(false);
        } catch (error: any) {
            alert(`❌ ${error.response?.data?.detail || error.message || "Failed to send messages"}`);
        } finally {
            setSending(false);
        }
    };

    const validateTextMessageSession = async () => {
        if (!sendConfig.phone_column || fetchedRows.length === 0) return;

        setValidatingSession(true);
        try {
            // Extract phone numbers from rows
            const phoneNumbers = fetchedRows
                .map(row => row[sendConfig.phone_column])
                .filter(phone => phone && phone.trim() !== "")
                .map(phone => phone.trim());

            if (phoneNumbers.length === 0) {
                alert("No phone numbers found in the selected column");
                return;
            }

            const validation = await googleSheetService.validateTextSession(phoneNumbers);
            setSessionValidation(validation);
            
            console.log("Session validation result:", validation);
        } catch (error: any) {
            console.error("Session validation failed:", error);
            alert(`Failed to validate sessions: ${error.response?.data?.detail || error.message}`);
        } finally {
            setValidatingSession(false);
        }
    };

    const toggleParamColumn = (column: string, type: 'header' | 'body') => {
        setSendConfig(prev => {
            const key = type === 'header' ? 'header_param_columns' : 'body_param_columns';
            const current = prev[key] as string[];
            const updated = current.includes(column)
                ? current.filter(col => col !== column)
                : [...current, column];
            return { ...prev, [key]: updated };
        });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Google Sheet Messaging</h1>
                    <p className="text-gray-500 text-sm mt-1">Send official WhatsApp text and template messages via Google Sheets</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Official Meta API
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Text + Template
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => setShowConnectModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                >
                    <Plus className="w-4 h-4" />
                    <span>Connect New Sheet</span>
                </button>
            </div>

            {/* Sheets Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase border-b">
                            <tr>
                                <th className="p-4 text-left">Sheet Name</th>
                                <th className="p-4 text-left">Spreadsheet ID</th>
                                <th className="p-4 text-left">Connected On</th>
                                <th className="p-4 text-left">Rows</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Loading sheets...</td></tr>
                            ) : sheets.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center">No sheets connected</td></tr>
                            ) : sheets.map((sheet, index) => (
                                <tr key={index} className="hover:bg-gray-50 border-b">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            <span className="font-medium">{sheet.sheet_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{sheet.spreadsheet_id}</code>
                                            <button
                                                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${sheet.spreadsheet_id}`, '_blank')}
                                                className="text-emerald-600 hover:text-emerald-700"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4">{new Date(sheet.connected_at).toLocaleDateString()}</td>
                                    <td className="p-4">{sheet.total_rows.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            sheet.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            sheet.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {sheet.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => openSendModal(sheet)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 mx-auto"
                                        >
                                            <Send className="w-3 h-3" />
                                            Send
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Send Modal */}
            {showSendModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                                <h2 className="text-xl font-semibold">Send Official WhatsApp Messages</h2>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Official API Badge */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-800">Official API Active</span>
                                    </div>
                                    <p className="text-xs text-emerald-600 mt-1">Using Meta Official WhatsApp API</p>
                                </div>

                                {/* Message Mode Toggle */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                                    <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                                        <button
                                            onClick={() => setSendConfig(prev => ({ ...prev, mode: 'text' }))}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                                sendConfig.mode === "text"
                                                    ? "bg-white text-gray-900 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            Text Message
                                        </button>
                                        <button
                                            onClick={() => setSendConfig(prev => ({ ...prev, mode: 'template' }))}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                                sendConfig.mode === "template"
                                                    ? "bg-white text-gray-900 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            Template Message
                                        </button>
                                    </div>
                                    {sendConfig.mode === "text" && (
                                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                            <p className="font-semibold">24-Hour Session Rule</p>
                                            <p>Text messages can only be sent within 24 hours of customer interaction.</p>
                                            
                                            {/* Session Validation Results */}
                                            {sessionValidation && (
                                                <div className="mt-3 p-3 bg-white rounded border border-amber-300">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">Session Validation Results:</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                            sessionValidation.can_send_all 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {sessionValidation.can_send_all ? '✅ All Valid' : '⚠️ Issues Found'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="text-xs text-gray-600 mb-2">
                                                        {sessionValidation.summary}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div className="text-center">
                                                            <div className="font-semibold text-green-600">{sessionValidation.valid_sessions}</div>
                                                            <div>Valid Sessions</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-semibold text-red-600">{sessionValidation.invalid_sessions}</div>
                                                            <div>Invalid Sessions</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-semibold text-gray-600">{sessionValidation.total_numbers}</div>
                                                            <div>Total Recipients</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {!sessionValidation.can_send_all && (
                                                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                                                            <strong>Recommendation:</strong> Use Template Messages for recipients without active sessions.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Validate Session Button */}
                                            {fetchedRows.length > 0 && sendConfig.phone_column && (
                                                <button 
                                                    onClick={validateTextMessageSession}
                                                    disabled={validatingSession}
                                                    className="mt-3 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {validatingSession ? (
                                                        <>
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                            Validating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-3 h-3" />
                                                            Validate Sessions
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Text Message Input */}
                                {sendConfig.mode === "text" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Text Message</label>
                                        <textarea
                                            value={sendConfig.text_message}
                                            onChange={(e) => setSendConfig(prev => ({ ...prev, text_message: e.target.value }))}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                            rows={4}
                                            placeholder="Enter your message here. Use {{ColumnName}} to insert sheet data."
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Example: Hello {"{{Name}}"}, your order {"{{OrderID}}"} is ready for pickup.
                                        </p>
                                    </div>
                                )}

                                {/* Template Selection */}
                                {sendConfig.mode === "template" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Template</label>
                                        {templatesLoading ? (
                                            <div className="text-center py-4 text-gray-500">Loading templates...</div>
                                        ) : templates.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">No approved templates found</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {templates.filter(t => t.status && t.status.toLowerCase() === 'approved').map((template) => (
                                                    <div
                                                        key={template.id}
                                                        className={`border rounded-lg p-3 cursor-pointer ${
                                                            sendConfig.template_name === template.template_name
                                                                ? 'border-emerald-500 bg-emerald-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                        onClick={() => setSendConfig(prev => ({ ...prev, template_name: template.template_name }))}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium">{template.template_name}</div>
                                                                <div className="text-sm text-gray-500">{template.category} • {template.language}</div>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                template.status && template.status.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {template.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Language Selection (template mode only) */}
                                {sendConfig.mode === "template" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                        <select 
                                            value={sendConfig.language_code} 
                                            onChange={(e) => setSendConfig(prev => ({ ...prev, language_code: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="en_US">English (US)</option>
                                            <option value="en_GB">English (UK)</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                            <option value="pt">Portuguese</option>
                                            <option value="hi">Hindi</option>
                                        </select>
                                    </div>
                                )}

                                {/* Fetch Rows */}
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={handleFetchRows} 
                                        disabled={syncing}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                        {syncing ? 'Fetching...' : 'Fetch Sheet Rows'}
                                    </button>
                                    {fetchedRows.length > 0 && (
                                        <span className="text-sm text-gray-500">Found {fetchedRows.length} rows</span>
                                    )}
                                </div>

                                {/* Phone Column */}
                                {columns.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Column</label>
                                        <select 
                                            value={sendConfig.phone_column} 
                                            onChange={(e) => setSendConfig(prev => ({ ...prev, phone_column: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Select phone column</option>
                                            {columns.map((column) => (
                                                <option key={column} value={column}>{column}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Parameter Mapping (template mode only) */}
                                {columns.length > 0 && sendConfig.mode === "template" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Header Parameters</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {columns.map((column) => (
                                                    <label key={column} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={sendConfig.header_param_columns.includes(column)}
                                                            onChange={() => toggleParamColumn(column, 'header')}
                                                        />
                                                        <span className="text-sm">{column}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Body Parameters</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {columns.map((column) => (
                                                    <label key={column} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={sendConfig.body_param_columns.includes(column)}
                                                            onChange={() => toggleParamColumn(column, 'body')}
                                                        />
                                                        <span className="text-sm">{column}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Send Options */}
                                {fetchedRows.length > 0 && (
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={sendConfig.send_all}
                                                onChange={(e) => setSendConfig(prev => ({ ...prev, send_all: e.target.checked }))}
                                            />
                                            <span className="text-sm">Send to all rows ({fetchedRows.length} recipients)</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button 
                                    onClick={() => setShowSendModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSendMessage} 
                                    disabled={sending || !sendConfig.phone_column || fetchedRows.length === 0 || 
                                        (sendConfig.mode === "template" && !sendConfig.template_name) ||
                                        (sendConfig.mode === "text" && !sendConfig.text_message)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {sending ? 'Sending...' : `Send ${sendConfig.mode === "text" ? "Text" : "Template"} Message`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Connect Sheet Modal */}
            <ConnectSheetModal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                onSheetConnected={() => {
                    loadSheets(); // Refresh the sheets list
                    setShowConnectModal(false);
                }}
            />
        </div>
    );
}
