"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import creditService, { CreditDistribution } from "@/services/creditService"
import resellerService, { ResellerProfile } from "@/services/resellerService"
import { Loader2, Send, History, AlertCircle, CheckCircle2 } from "lucide-react"

interface CreditDistributionComponentProps {
    preSelectedUser?: {
        id: string;
        name: string;
        business_name: string;
    } | null;
}

export default function CreditDistributionComponent({ preSelectedUser }: CreditDistributionComponentProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [resellerProfile, setResellerProfile] = useState<ResellerProfile | null>(null)
    const [history, setHistory] = useState<CreditDistribution[]>([])
    const [businessUsers, setBusinessUsers] = useState<any[]>([])

    // Form State
    const [selectedBusinessId, setSelectedBusinessId] = useState(preSelectedUser?.id || "")
    const [amount, setAmount] = useState("")
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        if (preSelectedUser?.id) {
            setSelectedBusinessId(preSelectedUser.id)
        }
    }, [preSelectedUser])

    const fetchData = async () => {
        setIsLoading(true)
        setMessage(null)
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                // In a component, maybe we don't redirect hard, but for now it's fine
                window.location.href = "/login"
                return
            }

            const profile = await resellerService.getProfile(token)
            setResellerProfile(profile)

            const users = await creditService.getMyBusinessUsers(token)
            setBusinessUsers(users)

            if (profile && profile.user_id) {
                const hist = await creditService.getResellerHistory(profile.user_id, token)
                setHistory(hist)
            }

        } catch (error: any) {
            console.error("Error loading data", error)
            setMessage({ type: 'error', text: "Failed to load data. Please try refreshing." })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDistribute = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBusinessId || !amount) {
            setMessage({ type: 'error', text: "Please select a user and enter amount." })
            return
        }

        const credits = parseInt(amount)
        if (isNaN(credits) || credits <= 0) {
            setMessage({ type: 'error', text: "Please enter a valid positive number of credits." })
            return
        }

        if (resellerProfile?.wallet?.available_credits !== undefined && credits > resellerProfile.wallet.available_credits) {
            setMessage({ type: 'error', text: "Insufficient available credits." })
            return
        }

        setIsSubmitting(true)
        setMessage(null)
        try {
            const token = localStorage.getItem("token")
            if (!token) throw new Error("No token")

            await creditService.distributeCredits({
                to_business_user_id: selectedBusinessId,
                credits_shared: credits
            }, token)

            setMessage({ type: 'success', text: "Credits distributed successfully!" })
            setAmount("")
            // We might keep the selected user if it's preSelected mode, or clear it.
            // Requirement said "pre-filled based on the row clicked", doesn't explicitly need clearing if modal stays open?
            // But usually modal closes or user stays.
            // If I clear selection, it might be confusing if they want to distribute again to same user.
            // I will keep selected user but clear amount.
            await fetchData()

        } catch (error: any) {
            console.error(error)
            const errorMsg = error.response?.data?.detail || "Failed to distribute credits."
            setMessage({ type: 'error', text: errorMsg })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading && !resellerProfile) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Top Stats Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-5 rounded-lg border border-slate-100">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Balance</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-bold text-blue-600">
                            {resellerProfile?.wallet?.available_credits ?? 0}
                        </span>
                        <span className="text-sm text-slate-500 font-medium">credits</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Distributed</span>
                    <div className="flex justify-end items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-semibold text-slate-700">
                            {resellerProfile?.wallet?.used_credits ?? 0}
                        </span>
                        <span className="text-sm text-slate-500 font-medium">credits</span>
                    </div>
                </div>
            </div>

            {/* Distribution Form */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Send className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Share Credits</h3>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg flex items-center gap-2.5 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleDistribute} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 block">Business User</label>
                        {preSelectedUser ? (
                            <div className="w-full h-10 px-3 border border-gray-200 rounded-md bg-gray-50 flex items-center text-sm text-gray-900 cursor-not-allowed">
                                <span className="font-semibold mr-2">{preSelectedUser.business_name || "Unknown Business"}</span>
                                <span className="text-gray-500">({preSelectedUser.name})</span>
                            </div>
                        ) : (
                            <select
                                value={selectedBusinessId}
                                onChange={(e) => setSelectedBusinessId(e.target.value)}
                                className="w-full h-10 px-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm bg-white transition-all"
                                required
                            >
                                <option value="">Select a business user...</option>
                                {businessUsers.map((user: any) => (
                                    <option key={user.busi_user_id} value={user.busi_user_id}>
                                        {user.business?.business_name || user.profile?.name} ({user.profile?.email})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 block">Amount</label>
                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full h-10 px-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                            placeholder="e.g. 500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Distribute Credits
                    </button>
                </form>
            </div>

            {/* History */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <History className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
                </div>

                <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">To</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic text-xs">
                                        No recent distributions
                                    </td>
                                </tr>
                            ) : (
                                history.slice(0, 5).map((item) => (
                                    <tr key={item.distribution_id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {new Date(item.shared_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium truncate max-w-[140px]" title={item.to_business_name}>
                                            {item.to_business_name || "Unknown"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-green-600 text-xs">
                                            +{item.credits_shared}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
