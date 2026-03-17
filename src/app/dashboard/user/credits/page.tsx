"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Shield, RefreshCw, Search, Calendar, CreditCard, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import creditService, { MessageUsageLog } from "@/services/creditService"

export default function CreditUsagePage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [logs, setLogs] = useState<MessageUsageLog[]>([])
    const [currentBalance, setCurrentBalance] = useState<number | null>(null)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [error, setError] = useState("")
    const [summary, setSummary] = useState<{ 
        total_usage: number, 
        total_added: number,
        latest_deduction: { credits: number, timestamp: string | null },
        latest_transaction: { credits: number, timestamp: string | null, message_id: string | null }
    } | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
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
                setIsLoading(false)
                return
            }

            // Fetch concurrently
            const [logsData, balanceData, summaryData] = await Promise.all([
                creditService.getMessageCreditUsage(token, {
                    start_date: startDate ? new Date(startDate).toISOString() : undefined,
                    end_date: endDate ? new Date(endDate).toISOString() : undefined,
                    limit: 100
                }),
                creditService.getUserCurrentBalance(token),
                creditService.getCreditSummary(token)
            ])

            setLogs(logsData)
            setCurrentBalance(balanceData.current_balance)
            setSummary(summaryData)
            console.log('Usage data fetched:', { logs: logsData.length, balance: balanceData, summary: summaryData })

        } catch (err: any) {
            console.error("Error fetching credit usage:", err)
            if (err.message?.includes('Failed to fetch')) {
                setError('Backend server is not accessible. Please check if server is running.')
            } else {
                setError(err.response?.data?.message || err.message || "Failed to load credit history")
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [startDate, endDate]) // Re-fetch when filters change

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                            Credit Usage History
                        </h1>
                        <p className="text-gray-500 mt-1">Track your message credit consumption and balance history</p>
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
                            <AlertCircle className="h-5 w-5 text-red-600" />
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
                        {/* Balance & Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm border-l-4 border-l-blue-500">
                        <p className="text-sm text-gray-500 font-medium mb-2">Current Balance</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {currentBalance !== null ? currentBalance : "---"}
                        </h3>
                        <p className="text-xs text-blue-600 mt-1 font-medium">Available Credits</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Total Usage (Sent)</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {summary?.total_usage ?? "---"}
                        </h3>
                        <p className="text-xs text-red-400 mt-1">Credits Deducted</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Total Added</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {summary?.total_added ?? "---"}
                        </h3>
                        <p className="text-xs text-emerald-500 mt-1">Credits Recharged</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Latest Activity</p>
                        <h3 className="text-xl font-bold text-gray-900">
                            {summary?.latest_transaction?.timestamp ? new Date(summary.latest_transaction.timestamp).toLocaleDateString() : "N/A"}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 font-medium italic">
                            {summary?.latest_transaction?.credits !== undefined ? (
                                summary.latest_transaction.credits > 0 ? `Deducted: ${summary.latest_transaction.credits}` : `Added: ${Math.abs(summary.latest_transaction.credits)}`
                            ) : ""}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Start Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">End Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button variant="ghost" className="text-gray-500" onClick={() => { setStartDate(""); setEndDate(""); }}>
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">DATE & TIME</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Message ID</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Credits Change</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Balance After</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y relative">
                                {isLoading && !logs.length && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Loading history...
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.usage_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </div>
                                                <div className="text-gray-500 text-xs text-nowrap">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-600">
                                                {log.message_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.credits_deducted > 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-red-600 border border-red-100">
                                                        -{log.credits_deducted}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        +{Math.abs(log.credits_deducted)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-700">
                                                {log.balance_after.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-400 text-xs font-mono">
                                                {log.usage_id.substring(0, 14)}...
                                            </td>
                                        </tr>
                                    ))
                                ) : !isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No credit usage history found.
                                        </td>
                                    </tr>
                                )}
                                {error && !isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                                            {error}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
