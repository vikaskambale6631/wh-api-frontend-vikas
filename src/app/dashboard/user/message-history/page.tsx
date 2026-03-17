"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
    MessageSquare, 
    Send, 
    RefreshCw, 
    Search, 
    Calendar, 
    CreditCard, 
    ArrowLeft,
    Filter,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    Smartphone,
    Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import creditService, { MessageUsageLog } from "@/services/creditService"
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function MessageHistoryPage() {
    const router = useRouter()
    const [logs, setLogs] = useState<MessageUsageLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [messageType, setMessageType] = useState("all")
    const [status, setStatus] = useState("all")

    const fetchData = async () => {
        setLoading(true)
        setError("")
        try {
            const token = localStorage.getItem("token")
            const userId = localStorage.getItem("user_id") || localStorage.getItem("reseller_id")

            if (!token || !userId) {
                router.push("/login")
                return
            }

            // First check if backend is running
            try {
                const healthResponse = await fetch('http://localhost:8000/health')
                if (!healthResponse.ok) {
                    throw new Error('Backend not healthy')
                }
            } catch (healthError: any) {
                console.error('Backend health check failed:', healthError)
                setError('Backend server is not running. Please start the backend server.')
                setLoading(false)
                return
            }

            // Fetch message usage logs
            const logsData = await creditService.getMessageCreditUsage(token, {
                start_date: startDate ? new Date(startDate).toISOString() : undefined,
                end_date: endDate ? new Date(endDate).toISOString() : undefined,
                limit: 100
            })

            // Filter logs based on message type and status
            let filteredLogs = logsData
            
            if (messageType !== "all") {
                filteredLogs = filteredLogs.filter(log => {
                    const message = log.message_id.toLowerCase()
                    switch (messageType) {
                        case "official":
                            return message.includes("official") || !message.includes("engine")
                        case "unofficial":
                            return message.includes("engine") || message.includes("unofficial")
                        case "single":
                            return message.includes("single") || (!message.includes("bulk") && !message.includes("group"))
                        case "bulk":
                            return message.includes("bulk") || message.includes("group")
                        case "trigger":
                            return message.includes("trigger") || message.includes("google")
                        case "payment":
                            return message.includes("razorpay") || message.includes("plan") || message.includes("pay")
                        default:
                            return true
                    }
                })
            }

            if (status !== "all") {
                filteredLogs = filteredLogs.filter(log => {
                    if (status === "sent") {
                        return log.credits_deducted > 0
                    } else if (status === "received") {
                        return log.credits_deducted < 0
                    }
                    return true
                })
            }

            setLogs(filteredLogs)
            console.log('Message history fetched:', { total: logsData.length, filtered: filteredLogs.length })

        } catch (err: any) {
            console.error("Error fetching message history:", err)
            if (err.message?.includes('Failed to fetch')) {
                setError('Backend server is not accessible. Please check if server is running.')
            } else {
                setError(err.response?.data?.message || err.message || "Failed to load message history")
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [startDate, endDate, messageType, status])

    const getStatusIcon = (credits: number) => {
        if (credits < 0) {
            return <CheckCircle className="h-4 w-4 text-green-600" />
        } else if (credits > 0) {
            return <XCircle className="h-4 w-4 text-red-600" />
        } else {
            return <Clock className="h-4 w-4 text-gray-600" />
        }
    }

    const getStatusColor = (credits: number) => {
        if (credits < 0) {
            return 'text-green-600 bg-green-50'
        } else if (credits > 0) {
            return 'text-red-600 bg-red-50'
        } else {
            return 'text-gray-600 bg-gray-50'
        }
    }

    const getMessageTypeIcon = (messageId: string) => {
        const message = messageId.toLowerCase()
        if (message.includes("official") || !message.includes("engine")) {
            return <Smartphone className="h-4 w-4 text-blue-600" />
        } else if (message.includes("engine") || message.includes("unofficial")) {
            return <MessageSquare className="h-4 w-4 text-green-600" />
        } else if (message.includes("bulk") || message.includes("group")) {
            return <Users className="h-4 w-4 text-purple-600" />
        } else if (message.includes("trigger") || message.includes("google")) {
            return <RefreshCw className="h-4 w-4 text-orange-600" />
        } else if (message.includes("razorpay") || message.includes("plan")) {
            return <CreditCard className="h-4 w-4 text-emerald-600" />
        } else {
            return <Send className="h-4 w-4 text-gray-600" />
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const exportToCSV = () => {
        const csv = [
            ['Date', 'Time', 'Message ID', 'Type', 'Credits Change', 'Balance After', 'Reference'],
            ...logs.map(log => [
                formatDate(log.timestamp),
                new Date(log.timestamp).toLocaleTimeString(),
                log.message_id,
                getMessageTypeIcon(log.message_id) ? 'Various' : 'Message',
                `${log.credits_deducted > 0 ? '-' : '+'}${Math.abs(log.credits_deducted)}`,
                log.balance_after.toLocaleString(),
                log.usage_id.substring(0, 14) + '...'
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `message-history-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                            Message History
                        </h1>
                        <p className="text-gray-500 mt-1">Track all message types with credit deduction details</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <h3 className="font-medium text-red-900">Connection Error</h3>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                        <Button onClick={fetchData} className="mt-3 bg-red-600 hover:bg-red-700">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Content */}
                {!error && (
                    <>
                        {/* Filters */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                                        <select 
                                            value={messageType} 
                                            onChange={(e) => setMessageType(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="official">Official WhatsApp</option>
                                            <option value="unofficial">Unofficial WhatsApp</option>
                                            <option value="single">Single Message</option>
                                            <option value="bulk">Bulk/Group Message</option>
                                            <option value="trigger">Google Sheet Trigger</option>
                                            <option value="payment">Payment/Plan Purchase</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select 
                                            value={status} 
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="sent">Credits Deducted (Sent)</option>
                                            <option value="received">Credits Added (Received)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                        <input 
                                            type="date" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                        <input 
                                            type="date" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); setMessageType("all"); setStatus("all"); }}>
                                        Clear Filters
                                    </Button>
                                    <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 gap-2">
                                        <Download className="h-4 w-4" />
                                        Export CSV
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <p className="text-sm text-gray-500 font-medium mb-2">Total Messages</p>
                                <h3 className="text-3xl font-bold text-gray-900">
                                    {logs.length}
                                </h3>
                                <p className="text-xs text-blue-600 mt-1 font-medium">All Types</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <p className="text-sm text-gray-500 font-medium mb-2">Credits Deducted</p>
                                <h3 className="text-3xl font-bold text-red-600">
                                    {logs.filter(log => log.credits_deducted > 0).reduce((sum, log) => sum + log.credits_deducted, 0)}
                                </h3>
                                <p className="text-xs text-red-400 mt-1 font-medium">For Messages Sent</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <p className="text-sm text-gray-500 font-medium mb-2">Credits Added</p>
                                <h3 className="text-3xl font-bold text-green-600">
                                    {Math.abs(logs.filter(log => log.credits_deducted < 0).reduce((sum, log) => sum + log.credits_deducted, 0))}
                                </h3>
                                <p className="text-xs text-green-400 mt-1 font-medium">From Plans/Payments</p>
                            </div>
                        </div>

                        {/* Message History Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Message History ({logs.length})
                                    </div>
                                    <Button onClick={exportToCSV} variant="outline" size="sm">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </CardTitle>
                                <CardDescription>
                                    Complete history of all message types with credit deduction details
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Date & Time</th>
                                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Message ID</th>
                                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Type</th>
                                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Credits Change</th>
                                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Balance After</th>
                                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y relative">
                                            {loading && !logs.length && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                        Loading message history...
                                                    </td>
                                                </tr>
                                            )}
                                            {!loading && logs.length > 0 ? (
                                                logs.map((log) => (
                                                    <tr key={log.usage_id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-gray-900">
                                                                {formatDate(log.timestamp)}
                                                            </div>
                                                            <div className="text-gray-500 text-xs text-nowrap">
                                                                {new Date(log.timestamp).toLocaleTimeString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {getMessageTypeIcon(log.message_id)}
                                                                <span className="font-mono text-xs text-gray-600">
                                                                    {log.message_id}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${getStatusColor(log.credits_deducted)}`}>
                                                                {getStatusIcon(log.credits_deducted)}
                                                                <span className="ml-1">
                                                                    {log.credits_deducted > 0 ? '-' : '+'}{Math.abs(log.credits_deducted)}
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-black text-gray-700">
                                                            {log.balance_after.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-400 text-xs font-mono">
                                                            {log.usage_id.substring(0, 14)}...
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : !loading && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                        No message history found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
