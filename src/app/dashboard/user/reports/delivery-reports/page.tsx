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
import { userDashboardService } from "@/services/userDashboardService";

interface DeliveryReport {
    sent_at: string;
    message: string;
    from: string;
    to: string;
    attachment_url?: string;
    status: string;
    mode: string;
}

export default function DeliveryReportsPage() {
    const [reports, setReports] = useState<DeliveryReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showDateFilter, setShowDateFilter] = useState(false);
    
    // 🔥 NEW: Column visibility and Density
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["Date Time", "Message", "From", "To", "Attachment", "Status"]);
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const [density, setDensity] = useState<'standard' | 'compact' | 'comfortable'>('standard');
    const [showDensityToggle, setShowDensityToggle] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("No authentication token found");
                return;
            }
            const data = await userDashboardService.getDeliveryReports(token);
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            setError("Failed to load delivery reports");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const dataToExport = selectedRows.length > 0 
            ? reports.filter((_, i) => selectedRows.includes(i))
            : reports;

        if (dataToExport.length === 0) return;
        
        const headers = ["Date Time", "Message", "From", "To", "Status"];
        const csvContent = [
            headers.join(","),
            ...dataToExport.map(r => [
                `"${formatDate(r.sent_at)}"`,
                `"${r.message?.replace(/"/g, '""')}"`,
                `"${r.from}"`,
                `"${r.to}"`,
                `"${r.status}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `delivery_reports_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredReports = reports.filter(r => {
        const matchesText = 
            !filterText ||
            r.message?.toLowerCase().includes(filterText.toLowerCase()) ||
            r.to?.toLowerCase().includes(filterText.toLowerCase()) ||
            r.from?.toLowerCase().includes(filterText.toLowerCase()) ||
            r.status?.toLowerCase().includes(filterText.toLowerCase());

        let matchesDate = true;
        if ((startDate || endDate) && r.sent_at) {
            const reportDate = new Date(r.sent_at);
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
        setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    };

    const toggleRow = (index: number) => {
        setSelectedRows(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    };

    const toggleAllSelected = () => {
        if (selectedRows.length === filteredReports.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredReports.map((_, i) => i));
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
            <div className="flex flex-col items-center mb-6 space-y-2">
                <h1 className="text-gray-500 font-medium text-lg uppercase tracking-wide">DELIVERY REPORTS</h1>
                <p className="text-red-400 text-xs font-medium">Every saturday we remove all delivery reports, Please download</p>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col border-b border-gray-100"> 
                    <div className="flex items-center gap-4 p-4 text-blue-500 text-xs font-semibold tracking-wide uppercase relative">
                        <button className={`flex items-center gap-1 hover:text-blue-600 ${showColumnToggle ? 'text-blue-700 font-bold' : ''}`} onClick={() => { setShowColumnToggle(!showColumnToggle); setShowDensityToggle(false); setShowDateFilter(false); }}>
                            <Columns className="w-4 h-4" />
                            <span>Columns</span>
                        </button>
                        
                        <button className={`flex items-center gap-1 hover:text-blue-600 ${showDateFilter ? 'text-blue-700 font-bold' : ''}`} onClick={() => { setShowDateFilter(!showDateFilter); setShowColumnToggle(false); setShowDensityToggle(false); }}>
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </button>

                        <button className={`flex items-center gap-1 hover:text-blue-600 ${showDensityToggle ? 'text-blue-700 font-bold' : ''}`} onClick={() => { setShowDensityToggle(!showDensityToggle); setShowColumnToggle(false); setShowDateFilter(false); }}>
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
                                {["Date Time", "Message", "From", "To", "Attachment", "Status"].map(col => (
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
                            {filterText ? `No matches for "${filterText}"` : "No delivery reports found"}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-linear-to-r from-blue-50 to-indigo-50 text-blue-800 text-xs font-semibold tracking-wider uppercase border-b border-indigo-100">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-indigo-200 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                                            checked={selectedRows.length === filteredReports.length && filteredReports.length > 0}
                                            onChange={toggleAllSelected}
                                        />
                                    </th>
                                    {visibleColumns.includes("Date Time") && <th className="p-4 font-semibold min-w-[200px] border-l border-indigo-100/50">Date Time</th>}
                                    {visibleColumns.includes("Message") && <th className="p-4 font-semibold min-w-[200px] border-l border-indigo-100/50">Message</th>}
                                    {visibleColumns.includes("From") && <th className="p-4 font-semibold min-w-[150px] border-l border-indigo-100/50">From</th>}
                                    {visibleColumns.includes("To") && <th className="p-4 font-semibold min-w-[150px] border-l border-indigo-100/50">To</th>}
                                    {visibleColumns.includes("Attachment") && <th className="p-4 font-semibold min-w-[250px] border-l border-indigo-100/50">Attachment</th>}
                                    {visibleColumns.includes("Status") && <th className="p-4 font-semibold min-w-[100px] border-l border-indigo-100/50">Status</th>}
                                </tr>
                            </thead>
                            <tbody className="text-xs text-gray-600 divide-y divide-indigo-50">
                                {filteredReports.map((row, index) => (
                                    <tr key={index} className={`hover:bg-blue-50/40 transition-colors duration-150 ${selectedRows.includes(index) ? 'bg-blue-50/80' : ''}`}>
                                        <td className={getPadding()}>
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                                                checked={selectedRows.includes(index)}
                                                onChange={() => toggleRow(index)}
                                            />
                                        </td>
                                        {visibleColumns.includes("Date Time") && <td className={`${getPadding()} font-medium text-gray-700`}>{formatDate(row.sent_at)}</td>}
                                        {visibleColumns.includes("Message") && <td className={getPadding()}>{row.message}</td>}
                                        {visibleColumns.includes("From") && <td className={`${getPadding()} text-gray-400`}>{row.from}</td>}
                                        {visibleColumns.includes("To") && <td className={`${getPadding()} text-gray-500`}>{row.to}</td>}
                                        {visibleColumns.includes("Attachment") && (
                                            <td className={`${getPadding()} text-blue-500 truncate max-w-xs`}>
                                                {row.attachment_url ? (
                                                    <a href={row.attachment_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        View Attachment
                                                    </a>
                                                ) : '-'}
                                            </td>
                                        )}
                                        {visibleColumns.includes("Status") && (
                                            <td className={getPadding()}>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${row.status === 'DELIVERED' || row.status === 'READ' || row.status === 'SENT' || row.status === 'SUCCESS'
                                                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                                    : row.status === 'FAILED'
                                                        ? 'bg-red-100 text-red-600 border border-red-200'
                                                        : 'bg-yellow-100 text-yellow-600 border border-yellow-200'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-end p-4 text-xs text-gray-500 gap-6 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <div className="flex items-center gap-1 cursor-pointer">
                            <span>100</span>
                            <ArrowDownUp className="w-3 h-3" />
                        </div>
                    </div>
                    <div>{reports.length > 0 ? `1–${reports.length} of ${reports.length}` : '0-0 of 0'}</div>
                    <div className="flex items-center gap-4">
                        <button disabled className="text-gray-300"><ChevronLeft className="w-4 h-4" /></button>
                        <button disabled className="text-gray-300"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
