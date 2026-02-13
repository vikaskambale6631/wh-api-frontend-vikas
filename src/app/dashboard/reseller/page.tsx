"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Wallet, User, TrendingUp, ShieldCheck, LogOut } from "lucide-react"
import resellerService, { ResellerProfile } from "@/services/resellerService"
import userService, { UserAnalytics, BusinessUser } from "@/services/userService"
import creditService, { CreditDistribution } from "@/services/creditService"

interface ResellerDashboardData {
    profile: ResellerProfile;
    wallet: {
        total_credits: number;
        available_credits: number;
        used_credits: number;
    };
    role: string;
}

export default function ResellerDashboard() {
    const router = useRouter()
    const [data, setData] = useState<ResellerDashboardData | null>(null)
    const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
    const [topUsers, setTopUsers] = useState<BusinessUser[]>([])
    const [transactions, setTransactions] = useState<CreditDistribution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    router.push("/login")
                    return
                }

                // 1. Profile
                const profileData = await resellerService.getProfile(token)
                setData(profileData)

                // 2. Analytics
                const analyticsData = await userService.getAnalytics(token)
                setAnalytics(analyticsData)

                // 3. Top Users (Client-side sort by usage)
                const users = await userService.getMyUsers(token)
                const sortedUsers = [...users].sort((a, b) => b.wallet.credits_used - a.wallet.credits_used).slice(0, 5)
                setTopUsers(sortedUsers)

                // 4. Transactions
                if (profileData.user_id) {
                    const history = await creditService.getResellerHistory(profileData.user_id, token, 0, 5)
                    setTransactions(history)
                }

            } catch (err: any) {
                console.error("Failed to load dashboard data", err)
                setError("Failed to load dashboard data.")
                if (err.response?.status === 401) {
                    router.push("/login")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchAllData()
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user_role")
        localStorage.removeItem("user_id")
        router.push("/login")
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500">
                <p>{error}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            Welcome, {data?.profile.name}
                        </h1>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800 uppercase tracking-wide">
                                {data?.role}
                            </span>
                            <span>{data?.profile.email}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-medium border border-red-100"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Credits */}
                    <div className="bg-linear-to-br from-blue-600 to-blue-700 text-white p-6 rounded-3xl shadow-lg shadow-blue-600/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Wallet className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-blue-100 font-medium mb-1 flex items-center gap-2">
                                <Wallet className="w-4 h-4" /> Total Credits
                            </p>
                            <h3 className="text-4xl font-bold tracking-tight">{data?.wallet.total_credits}</h3>
                        </div>
                    </div>

                    {/* Available Credits (Remaining) */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                        <div className="absolute right-4 top-4 bg-green-100 dark:bg-green-900/20 p-3 rounded-2xl text-green-600 dark:text-green-400 group-hover:rotate-12 transition-transform">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Remaining Credits</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{data?.wallet.available_credits}</h3>
                        </div>
                    </div>

                    {/* Used Credits */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                        <div className="absolute right-4 top-4 bg-purple-100 dark:bg-purple-900/20 p-3 rounded-2xl text-purple-600 dark:text-purple-400 group-hover:rotate-12 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Used Credits</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{data?.wallet.used_credits}</h3>
                        </div>
                    </div>
                </div>

                {/* Usage Overview / Messages Sent */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Usage Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                            <p className="text-gray-500 mb-2">Messages Sent</p>
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                                {(analytics as any)?.messages_sent ?? 0}
                            </h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                            <p className="text-gray-500 mb-2">Credits Left</p>
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">{data?.wallet.available_credits}</h3>
                        </div>
                    </div>
                </div>

                {/* Content Area: Top Users and Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Users */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Users</h2>
                            <button
                                onClick={() => router.push('/users')}
                                className="text-sm text-blue-600 font-medium hover:underline"
                            >
                                View All
                            </button>
                        </div>

                        <div className="space-y-4">
                            {topUsers.length === 0 ? (
                                <p className="text-gray-400 text-center py-10">No users found.</p>
                            ) : (
                                topUsers.map(user => (
                                    <div key={user.busi_user_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                {user.profile.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{user.profile.name}</p>
                                                <p className="text-xs text-gray-500">{user.business.business_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">{user.wallet.credits_used}</p>
                                            <p className="text-xs text-gray-500">Credits Used</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Date</th>
                                        <th className="px-4 py-3">To</th>
                                        <th className="px-4 py-3 text-right rounded-r-lg">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                                                No transactions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => (
                                            <tr key={tx.distribution_id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                <td className="px-4 py-4 text-gray-500">
                                                    {new Date(tx.shared_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                                                    {tx.to_business_name || "Unknown"}
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-green-600">
                                                    +{tx.credits_shared}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
