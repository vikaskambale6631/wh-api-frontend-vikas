"use client";

import {
    Megaphone,
    Filter,
    Download,
    Plus,
    Calendar,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export default function BroadcastPage() {
    const broadcasts = [
        { id: "BRD_001", name: "Diwali Offer Blast", group: "VIP Customers", sent: 154, delivered: 150, read: 120, status: "Completed", date: "01-11-2025" },
        { id: "BRD_002", name: "Product Launch Alert", group: "New Leads", sent: 890, delivered: 880, read: 450, status: "Running", date: "05-01-2026" },
        { id: "BRD_003", name: "Webinar Invite", group: "Beta Testers", sent: 23, delivered: 23, read: 20, status: "Completed", date: "28-12-2025" },
        { id: "BRD_004", name: "Monthly Update", group: "All Users", sent: 0, delivered: 0, read: 0, status: "Scheduled", date: "10-01-2026" },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Broadcast Campaigns</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and track your marketing broadcasts</p>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <Plus className="w-4 h-4" />
                    <span>New Campaign</span>
                </button>
            </div>

            {/* Overview Cards/Stats could go here */}

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-100 gap-4">
                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            className="w-full pl-4 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-800 text-xs font-semibold tracking-wider uppercase border-b border-indigo-100">
                            <tr>
                                <th className="p-4 w-10">
                                    <input type="checkbox" className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                                </th>
                                <th className="p-4 font-semibold min-w-[200px]">Campaign Name</th>
                                <th className="p-4 font-semibold min-w-[150px]">Target Group</th>
                                <th className="p-4 font-semibold min-w-[120px]">Stats (S/D/R)</th>
                                <th className="p-4 font-semibold min-w-[120px]">Date</th>
                                <th className="p-4 font-semibold min-w-[100px]">Status</th>
                                <th className="p-4 font-semibold w-16 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600 divide-y divide-indigo-50">
                            {broadcasts.map((item, index) => (
                                <tr key={index} className="hover:bg-indigo-50/40 transition-colors duration-150 group">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                                    </td>
                                    <td className="p-4 border-l border-transparent group-hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-100/50 p-2 rounded-lg text-indigo-600">
                                                <Megaphone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-400 font-normal mt-0.5">{item.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">{item.group}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-xs font-mono">
                                            <span className="text-blue-600 font-bold" title="Sent">{item.sent}</span>
                                            <span className="text-gray-300">/</span>
                                            <span className="text-emerald-600 font-bold" title="Delivered">{item.delivered}</span>
                                            <span className="text-gray-300">/</span>
                                            <span className="text-indigo-600 font-bold" title="Read">{item.read}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span>{item.date}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${item.status === 'Completed'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : item.status === 'Running'
                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}>
                                            {item.status === 'Running' && <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                            </span>}
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                    <div className="text-xs text-gray-500">
                        Showing <span className="font-medium text-gray-900">1</span> to <span className="font-medium text-gray-900">4</span> of <span className="font-medium text-gray-900">4</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled className="p-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed bg-white">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button disabled className="p-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed bg-white">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
