"use client"

import React, { useEffect, useState } from "react"
import { History, Search, Filter, Calendar, LayoutGrid, User, Code, ShoppingCart, CreditCard, Users, LogOut, ChevronLeft, ChevronRight, X, RefreshCw, Download, ShieldCheck, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { auditLogService, AuditLog, AuditLogResponse, FieldUpdate } from "@/services/auditLogService"

export default function AuditHistoryPage() {
    const [data, setData] = useState<AuditLogResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [moduleFilter, setModuleFilter] = useState("All Modules")
    const [actionFilter, setActionFilter] = useState("All Actions")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setCurrentUserId(payload.sub);
                } catch (e) {
                    console.error("Failed to decode token", e);
                }
            }
        }
    }, [])

    const openDetailsModal = (log: AuditLog) => {
        setSelectedLog(log)
        setShowDetailsModal(true)
    }

    const closeDetailsModal = () => {
        setSelectedLog(null)
        setShowDetailsModal(false)
    }

    const formatFieldUpdate = (change: string | FieldUpdate) => {
        if (typeof change === 'string') {
            return change
        }
        const fieldUpdate = change as FieldUpdate
        return `${fieldUpdate.field}${fieldUpdate.previousValue ? ` (${fieldUpdate.previousValue})` : ''} → ${fieldUpdate.newValue}`
    }

    const fetchHistory = async () => {
        try {
            setLoading(true)
            const response = await auditLogService.getLogs({
                search: searchQuery,
                module: moduleFilter === "All Modules" ? undefined : moduleFilter,
                action: actionFilter === "All Actions" ? undefined : actionFilter,
                start_date: startDate ? new Date(startDate).toISOString() : undefined,
                end_date: endDate ? new Date(endDate).toISOString() : undefined
            })
            setData(response)
        } catch (err: any) {
            console.error("Failed to fetch history:", err)
            
            // Handle expired tokens specifically
            if (err.message?.includes('expired') || err.message?.includes('Token has expired')) {
                setError("Your session has expired. Please log in again to continue.")
                // Optionally redirect to login page after a delay
                setTimeout(() => {
                    window.location.href = '/login'
                }, 3000)
            } else {
                setError(err.message || "Failed to load history data.")
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchHistory()
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [searchQuery, moduleFilter, actionFilter, startDate, endDate])

    if (loading && !data) return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg font-medium text-gray-600">Loading Activity History...</span>
        </div>
    )

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/10 min-h-screen">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2.5 rounded-lg">
                        <ShieldCheck className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase italic">My Activity History</h2>
                        <p className="text-muted-foreground mt-0.5 text-xs font-bold uppercase tracking-widest opacity-60">
                            View all changes made to your account by admins and the system
                        </p>
                    </div>
                </div>
                <Button variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700 font-bold px-6 shadow-md" onClick={() => fetchHistory()}>
                    Refresh
                </Button>
            </div>

            {/* Notification Box */}
            <Card className="border-blue-100 bg-blue-50/50 shadow-none">
                <CardContent className="p-4 flex items-start gap-4">
                    <div className="p-1 mt-1">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                    <div className="text-xs text-blue-800 space-y-1">
                        <p className="font-black text-blue-900 uppercase tracking-tight">Note: This shows all activity related to your account including:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2 font-bold opacity-80">
                            <li>Changes made to your account by admins/system</li>
                            <li>Actions performed by you (marked with "You" badge)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats Bars - Matching Profile Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-600 rounded-lg p-4 text-white shadow-lg flex flex-col justify-center h-20">
                    <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">Total Activities</span>
                    <span className="text-2xl font-black mt-0.5">{data?.total || 0}</span>
                </div>
                <div className="bg-purple-600 rounded-lg p-4 text-white shadow-lg flex flex-col justify-center h-20">
                    <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">Filtered Results</span>
                    <span className="text-2xl font-black mt-0.5">{data?.filtered || 0}</span>
                </div>
                <div className="bg-emerald-600 rounded-lg p-4 text-white shadow-lg flex flex-col justify-center h-20">
                    <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">Last Activity</span>
                    <span className="text-2xl font-black mt-0.5">
                        {data?.last_activity_days_ago !== null ? `${data?.last_activity_days_ago} days ago` : 'None'}
                    </span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-xl border shadow-md space-y-6">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search by action, module, admin, or IP.." 
                        className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-none border-2 font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Module</label>
                        <select 
                            className="w-full h-11 px-4 rounded-lg border-2 border-gray-100 bg-gray-50/50 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                        >
                            <option>All Modules</option>
                            <option>Users</option>
                            <option>Credits</option>
                            <option>Reseller</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Action</label>
                        <select 
                            className="w-full h-11 px-4 rounded-lg border-2 border-gray-100 bg-gray-50/50 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                        >
                            <option>All Actions</option>
                            <option>UPDATE USER PLAN</option>
                            <option>UPDATE USER</option>
                            <option>CREDIT ALLOCATION</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Start Date</label>
                        <Input 
                            type="date" 
                            className="h-11 bg-gray-50/50 border-2 border-gray-100 shadow-none font-bold text-sm"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">End Date</label>
                        <Input 
                            type="date" 
                            className="h-11 bg-gray-50/50 border-2 border-gray-100 shadow-none font-bold text-sm"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <Card className="border-none shadow-xl overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b-2">
                                <tr>
                                    <th className="px-6 py-5">Date & Time</th>
                                    <th className="px-6 py-5">Action Type</th>
                                    <th className="px-6 py-5">Performed By</th>
                                    <th className="px-6 py-5">Affected User</th>
                                    <th className="px-6 py-5">Changes Made</th>
                                    <th className="px-6 py-5 text-center">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data?.logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-28 text-center font-black text-gray-300 uppercase italic tracking-widest">
                                            No activity records found.
                                        </td>
                                    </tr>
                                ) : (
                                    data?.logs.map((log) => {
                                        const date = new Date(log.created_at);
                                        const formattedDate = date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: '2-digit',
                                            year: 'numeric'
                                        });
                                        const formattedTime = date.toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        });

                                        return (
                                            <tr key={log.id} className="hover:bg-blue-50/20 transition-colors group">
                                                <td className="px-6 py-6 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-800">{formattedDate}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{formattedTime}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-black text-blue-600 tracking-tight uppercase border-b-2 border-blue-50 w-fit">{log.action_type}</span>
                                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{log.module}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 bg-gray-100 border-2 border-white shadow-sm">
                                                            <AvatarFallback className="text-[11px] font-black text-gray-500">
                                                                {log.performed_by.name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-gray-900 capitalize leading-none">{log.performed_by.name}</span>
                                                                {currentUserId === log.performed_by.id && (
                                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-1.5 py-0.5 text-[9px] font-black h-4 shadow-none tracking-widest">YOU</Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">{log.performed_by.role}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900">{log.affected_user?.name || '-'}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold break-all opacity-80">{log.affected_user?.email || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-wrap gap-2 max-w-[200px]">
                                                        {log.changes_made?.map((change, i) => (
                                                            <code key={i} className="px-2 py-1 bg-gray-50 text-gray-500 rounded font-mono text-[9px] font-black border border-gray-200 shadow-sm">
                                                                {formatFieldUpdate(change)}
                                                            </code>
                                                        )) || <span className="text-gray-200">-</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-2 border-transparent hover:border-blue-100"
                                                        onClick={() => openDetailsModal(log)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="px-6 py-6 bg-gray-50/50 border-t flex items-center justify-between text-[11px] font-black text-gray-400 tracking-widest uppercase">
                        <span>Showing {data?.logs.length || 0} of {data?.filtered || 0} Records</span>
                        <div className="flex gap-3">
                            <Button disabled variant="outline" size="sm" className="h-9 shadow-sm text-[10px] font-black uppercase tracking-widest px-6 border-2 border-gray-200 bg-white">Previous</Button>
                            <Button disabled variant="outline" size="sm" className="h-9 shadow-sm text-[10px] font-black uppercase tracking-widest px-6 border-2 border-gray-200 bg-white text-blue-600">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Activity Log Details Modal */}
            {showDetailsModal && selectedLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header - Dark Premium Style */}
                        <div className="bg-[#1e293b] text-white p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-400/30">
                                    <ShieldCheck className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight">Audit Log Details</h3>
                                    <p className="text-blue-200/60 text-xs font-medium uppercase tracking-widest mt-0.5">Complete activity record</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={closeDetailsModal}
                                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-8 overflow-y-auto space-y-8">
                            
                            {/* Top Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-blue-50 rounded-lg">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Basic Information</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-5 gap-x-2">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Action</label>
                                            <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50/50 font-black text-[10px] uppercase py-1">
                                                {selectedLog.action_type}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Module</label>
                                            <Badge variant="outline" className="text-purple-600 border-purple-100 bg-purple-50/50 font-black text-[10px] uppercase py-1">
                                                {selectedLog.module}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Timestamp</label>
                                            <p className="text-[11px] font-bold text-gray-600 font-mono">
                                                {new Date(selectedLog.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: true
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">IP Address</label>
                                            <p className="text-[11px] font-bold text-gray-600 font-mono">{selectedLog.ip_address || '127.0.0.1'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* User Information */}
                                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-orange-50 rounded-lg">
                                            <Users className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">User Information</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-blue-50">
                                                    {selectedLog.performed_by.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        <span>Admin User</span>
                                                        {currentUserId === selectedLog.performed_by.id && (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-1.5 py-0.5 text-[8px] font-black h-3.5 shadow-none tracking-widest">YOU</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900">{selectedLog.performed_by.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{selectedLog.performed_by.role === 'reseller' ? 'Reseller' : selectedLog.performed_by.role}</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-none font-bold text-[10px] uppercase px-2 py-0.5">
                                                {selectedLog.performed_by.role}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                {(selectedLog.affected_user?.name || 'SY').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target User</p>
                                                <p className="text-sm font-bold text-gray-900">{selectedLog.affected_user?.name || 'System'}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">{selectedLog.affected_user?.email || 'system@internal'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fields Updated Tags */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-blue-600" />
                                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest">
                                        Fields Updated ({selectedLog.changes_made?.length || 0})
                                    </h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedLog.changes_made?.map((change, i) => {
                                        const fieldName = typeof change === 'string' ? change : change.field;
                                        return (
                                            <Badge key={i} className="bg-blue-600 text-white border-none py-1.5 px-3 rounded-md text-[10px] font-bold shadow-sm shadow-blue-200">
                                                {fieldName}
                                            </Badge>
                                        )
                                    }) || <p className="text-sm text-gray-400 italic">No fields were modified</p>}
                                </div>
                            </div>

                            {/* Comparison Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Previous Values */}
                                <div className="border border-red-100 rounded-xl overflow-hidden bg-red-50/10">
                                    <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex items-center gap-2">
                                        <ChevronLeft className="h-3 w-3 text-red-500" />
                                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Previous Values</span>
                                    </div>
                                    <div className="p-4 font-mono text-[11px] min-h-[150px]">
                                        <pre className="text-red-700 whitespace-pre-wrap">
                                            {JSON.stringify(
                                                selectedLog.changes_made?.reduce((acc: any, change) => {
                                                    if (typeof change !== 'string') acc[change.field] = change.previousValue;
                                                    else acc[change] = '...';
                                                    return acc;
                                                }, {}), 
                                                null, 2
                                            )}
                                        </pre>
                                    </div>
                                </div>

                                {/* New Values */}
                                <div className="border border-emerald-100 rounded-xl overflow-hidden bg-emerald-50/10">
                                    <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center gap-2">
                                        <ChevronRight className="h-3 w-3 text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">New Values</span>
                                    </div>
                                    <div className="p-4 font-mono text-[11px] min-h-[150px]">
                                        <pre className="text-emerald-700 whitespace-pre-wrap">
                                            {JSON.stringify(
                                                selectedLog.changes_made?.reduce((acc: any, change) => {
                                                    if (typeof change !== 'string') acc[change.field] = change.newValue;
                                                    else acc[change] = 'updated';
                                                    return acc;
                                                }, {}), 
                                                null, 2
                                            )}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Description if any */}
                            {selectedLog.description && (
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Description</label>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed italic">
                                        "{selectedLog.description}"
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button 
                                    onClick={closeDetailsModal}
                                    className="bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs uppercase tracking-widest px-8 py-6 rounded-xl transition-all shadow-lg shadow-gray-200"
                                >
                                    Close Details
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
