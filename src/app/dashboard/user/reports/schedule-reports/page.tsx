"use client";

import { useEffect, useState } from 'react';
import {
    Columns,
    Filter,
    ArrowDownUp,
    Download,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import { googleSheetService, TriggerHistory } from "@/services/googleSheetService";

export default function ScheduleReportsPage() {
    const [reports, setReports] = useState<TriggerHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterText, setFilterText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showDateFilter, setShowDateFilter] = useState(false);
    
    // Column visibility and Density
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["Date Time", "Message", "Phones", "Status", "Official ID"]);
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const [density, setDensity] = useState<'standard' | 'compact' | 'comfortable'>('standard');
    const [showDensityToggle, setShowDensityToggle] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await googleSheetService.getAllTriggerHistory();
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            setError("Failed to load schedule reports");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const dataToExport = selectedRows.length > 0 
            ? filteredReports.filter((r) => selectedRows.includes(r.id))
            : filteredReports;

        if (dataToExport.length === 0) return;
        
        // Create CSV headers
        const headers = ['Date Time', 'Message', 'Phones', 'Status', 'Official Message ID'];
        
        // Convert data to CSV format
        const csvRows = dataToExport.map((row: TriggerHistory) => {
            return [
                `"${formatDate(row.triggered_at).replace(/,/g, '')}"`,
                `"${(row.message_content || '').replace(/"/g, '""')}"`,
                `"${row.phone_number}"`,
                `"${row.status}"`,
                `"${row.official_message_id || ''}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        
        // Create Blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `schedule_reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredReports = reports.filter((r: TriggerHistory) => {
        const matchesText = 
            !filterText ||
            r.message_content?.toLowerCase().includes(filterText.toLowerCase()) ||
            r.phone_number?.toLowerCase().includes(filterText.toLowerCase()) ||
            r.status?.toLowerCase().includes(filterText.toLowerCase());

        let matchesDate = true;
        if ((startDate || endDate) && r.triggered_at) {
            const reportDate = new Date(r.triggered_at);
            const reportTime = reportDate.getTime();
            
            if (startDate) {
                const [y, m, d] = startDate.split('-').map(Number);
                const start = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
                if (reportTime < start) matchesDate = false;
            }
            if (endDate) {
                const [y, m, d] = endDate.split('-').map(Number);
                const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
                if (reportTime > end) matchesDate = false;
            }
        }
        return matchesText && matchesDate;
    });

    const toggleColumn = (col: string) => {
        setVisibleColumns((prev: string[]) => prev.includes(col) ? prev.filter((c: string) => c !== col) : [...prev, col]);
    };

    const toggleRow = (id: string) => {
        setSelectedRows((prev: string[]) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    };

    const toggleAllSelected = () => {
        if (selectedRows.length === filteredReports.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredReports.map((r) => r.id));
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const getPadding = () => {
        if (density === 'compact') return 'p-1';
        if (density === 'comfortable') return 'p-6';
        return 'p-4';
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
                <h1 className="text-gray-500 font-medium text-lg uppercase tracking-wide">SCHEDULE DELIVERY REPORTS</h1>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                {/* Toolbar */}
                <div className="flex flex-col border-b border-gray-100">
                    <div className="flex items-center gap-4 p-4 text-blue-500 text-xs font-semibold tracking-wide uppercase relative">
                        <button 
                            className={`flex items-center gap-1 hover:text-blue-600 ${showColumnToggle ? 'text-blue-700 font-bold' : ''}`} 
                            onClick={() => { setShowColumnToggle(!showColumnToggle); setShowDensityToggle(false); setShowDateFilter(false); }}
                        >
                            <Columns className="w-4 h-4" />
                            <span>Columns</span>
                        </button>
                        
                        <button 
                            className={`flex items-center gap-1 hover:text-blue-600 ${showDateFilter ? 'text-blue-700 font-bold' : ''}`} 
                            onClick={() => { setShowDateFilter(!showDateFilter); setShowColumnToggle(false); setShowDensityToggle(false); }}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </button>

                        <button 
                            className={`flex items-center gap-1 hover:text-blue-600 ${showDensityToggle ? 'text-blue-700 font-bold' : ''}`} 
                            onClick={() => { setShowDensityToggle(!showDensityToggle); setShowColumnToggle(false); setShowDateFilter(false); }}
                        >
                            <ArrowDownUp className="w-4 h-4" />
                            <span>Density</span>
                        </button>

                        <button className="flex items-center gap-1 hover:text-blue-600" onClick={handleExport}>
                            <Download className="w-4 h-4" />
                            <span>Export {selectedRows.length > 0 ? `(${selectedRows.length})` : '(CSV)'}</span>
                        </button>

                        <button className="ml-auto text-blue-500 hover:text-blue-600 flex items-center gap-1" onClick={fetchReports}>
                            <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        {/* Column Toggle Popup */}
                        {showColumnToggle && (
                            <div className="absolute top-12 left-4 z-50 bg-white shadow-xl border border-gray-100 rounded-lg p-3 min-w-[150px] flex flex-col gap-2 normal-case tracking-normal">
                                {["Date Time", "Message", "Phones", "Status", "Official ID"].map(col => (
                                    <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input type="checkbox" checked={visibleColumns.includes(col)} onChange={() => toggleColumn(col)} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                                        <span className="text-gray-700">{col}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Density Toggle Popup */}
                        {showDensityToggle && (
                            <div className="absolute top-12 left-40 z-50 bg-white shadow-xl border border-gray-100 rounded-lg p-2 min-w-[120px] flex flex-col normal-case tracking-normal">
                                {(['compact', 'standard', 'comfortable'] as const).map(d => (
                                    <button key={d} className={`p-2 text-left hover:bg-gray-50 rounded capitalize ${density === d ? 'text-blue-600 font-bold' : 'text-gray-600'}`} onClick={() => { setDensity(d); setShowDensityToggle(false); }}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {showDateFilter && (
                        <div className="px-5 pb-5 flex flex-wrap items-end gap-5 bg-blue-50/20 border-t border-blue-50">
                            <div className="flex flex-col gap-1.5 min-w-[180px]">
                                <label className="text-[10px] font-bold text-gray-400 ml-1">START DATE</label>
                                <input 
                                    type="date"
                                    className="p-2 border border-blue-100 rounded-md bg-white text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-[180px]">
                                <label className="text-[10px] font-bold text-gray-400 ml-1">END DATE</label>
                                <input 
                                    type="date"
                                    className="p-2 border border-blue-100 rounded-md bg-white text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1 min-w-[250px]">
                                <label className="text-[10px] font-bold text-gray-400 ml-1">SEARCH TEXT</label>
                                <input 
                                    type="text"
                                    placeholder="Search message, number or status..."
                                    className="p-2 border border-blue-100 rounded-md bg-white text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />
                            </div>
                            {(startDate || endDate || filterText) && (
                                <button 
                                    className="p-2 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors uppercase self-end mb-1"
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                        setFilterText("");
                                    }}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Table Header */}
                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="flex h-64 items-center justify-center text-red-500">
                            {error}
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex h-64 items-center justify-center text-gray-400 italic">
                            {filterText ? `No matches for "${filterText}"` : "No schedule reports found"}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-xs font-medium border-b border-gray-100">
                                <tr>
                                    <th className="p-4 w-10 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                                            checked={selectedRows.length === filteredReports.length && filteredReports.length > 0}
                                            onChange={toggleAllSelected}
                                        />
                                    </th>
                                    {visibleColumns.includes("Date Time") && <th className="p-4 font-normal min-w-[150px] border-l border-gray-100">Date Time</th>}
                                    {visibleColumns.includes("Message") && <th className="p-4 font-normal min-w-[200px] border-l border-gray-100">Message</th>}
                                    {visibleColumns.includes("Phones") && <th className="p-4 font-normal min-w-[120px] border-l border-gray-100">Phones</th>}
                                    {visibleColumns.includes("Status") && <th className="p-4 font-normal min-w-[100px] border-l border-gray-100">Status</th>}
                                    {visibleColumns.includes("Official ID") && <th className="p-4 font-normal min-w-[150px] border-l border-gray-100">Official ID</th>}
                                </tr>
                            </thead>
                            <tbody className="text-xs text-gray-500">
                                {filteredReports.map((row) => (
                                    <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${selectedRows.includes(row.id) ? 'bg-blue-50' : ''}`}>
                                        <td className={`${getPadding()} text-center`}>
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                                                checked={selectedRows.includes(row.id)}
                                                onChange={() => toggleRow(row.id)}
                                            />
                                        </td>
                                        {visibleColumns.includes("Date Time") && <td className={`${getPadding()} border-l border-gray-100 whitespace-nowrap`}>{formatDate(row.triggered_at)}</td>}
                                        {visibleColumns.includes("Message") && <td className={`${getPadding()} border-l border-gray-100`}>{row.message_content}</td>}
                                        {visibleColumns.includes("Phones") && <td className={`${getPadding()} border-l border-gray-100`}>{row.phone_number}</td>}
                                        {visibleColumns.includes("Status") && (
                                            <td className={`${getPadding()} border-l border-gray-100`}>
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                                                    row.status === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                                                    row.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                                                    'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.includes("Official ID") && <td className={`${getPadding()} border-l border-gray-100 text-gray-400 italic`}>{row.official_message_id || '-'}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="mt-auto flex items-center justify-end p-4 text-xs text-gray-500 gap-6 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <div className="flex items-center gap-1 cursor-pointer">
                            <span>100</span>
                            <ArrowDownUp className="w-3 h-3" />
                        </div>
                    </div>
                    <div>{filteredReports.length > 0 ? `1–${filteredReports.length} of ${filteredReports.length}` : '0–0 of 0'}</div>
                    <div className="flex items-center gap-4">
                        <button disabled className="text-gray-300"><ChevronLeft className="w-4 h-4" /></button>
                        <button disabled className="text-gray-300"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
