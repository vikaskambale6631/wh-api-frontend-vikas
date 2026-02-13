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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("No authentication token found");
                setLoading(false);
                return;
            }
            const data = await userDashboardService.getDeliveryReports(token);
            setReports(data);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            setError("Failed to load delivery reports");
        } finally {
            setLoading(false);
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
                <div className="flex items-center gap-4 p-4 text-blue-500 text-xs font-semibold tracking-wide uppercase">
                    <button className="flex items-center gap-1 hover:text-blue-600">
                        <Columns className="w-4 h-4" />
                        <span>Columns</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                        <ArrowDownUp className="w-4 h-4" />
                        <span>Density</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                    <button className="ml-auto text-blue-500 hover:text-blue-600" onClick={fetchReports}>
                        Refresh
                    </button>
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
                    ) : reports.length === 0 ? (
                        <div className="flex h-64 items-center justify-center text-gray-400 italic">
                            No delivery reports found
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-linear-to-r from-blue-50 to-indigo-50 text-blue-800 text-xs font-semibold tracking-wider uppercase border-b border-indigo-100">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input type="checkbox" className="rounded border-indigo-200 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                    </th>
                                    <th className="p-4 font-semibold min-w-[200px] border-l border-indigo-100/50">Date Time</th>
                                    <th className="p-4 font-semibold min-w-[200px] border-l border-indigo-100/50">Message</th>
                                    <th className="p-4 font-semibold min-w-[150px] border-l border-indigo-100/50">From</th>
                                    <th className="p-4 font-semibold min-w-[150px] border-l border-indigo-100/50">To</th>
                                    <th className="p-4 font-semibold min-w-[250px] border-l border-indigo-100/50">Attachment</th>
                                    <th className="p-4 font-semibold min-w-[100px] border-l border-indigo-100/50">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs text-gray-600 divide-y divide-indigo-50">
                                {reports.map((row, index) => (
                                    <tr key={index} className="hover:bg-blue-50/40 transition-colors duration-150">
                                        <td className="p-4">
                                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                        </td>
                                        <td className="p-4 font-medium text-gray-700">{formatDate(row.sent_at)}</td>
                                        <td className="p-4">{row.message}</td>
                                        <td className="p-4 text-gray-500">{row.from}</td>
                                        <td className="p-4 text-gray-500">{row.to}</td>
                                        <td className="p-4 text-blue-500 truncate max-w-xs">
                                            {row.attachment_url ? (
                                                <a href={row.attachment_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    View Attachment
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${row.status === 'DELIVERED' || row.status === 'READ' || row.status === 'SENT' || row.status === 'SUCCESS' // Handling various success-like statuses
                                                ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                                : row.status === 'FAILED'
                                                    ? 'bg-red-100 text-red-600 border border-red-200'
                                                    : 'bg-yellow-100 text-yellow-600 border border-yellow-200' // Pending or others
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
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
