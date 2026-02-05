"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Users, Activity, LogOut, Wallet, Building2, User } from "lucide-react"
import resellerService, { ResellerProfile } from "@/services/resellerService"

interface WalletData {
    total_credits: number
    available_credits: number
    used_credits: number
}

interface ResellerData {
    profile: ResellerProfile
    wallet: WalletData
    business?: {
        business_name: string
    }
}

export default function ResellerDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [reseller, setReseller] = useState<ResellerData | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("resellerToken")
            if (!token) {
                router.push("/reseller/login")
                return
            }

            try {
                const data = await resellerService.getProfile(token)
                console.log("Reseller data:", data)
                setReseller(data)
            } catch (err: any) {
                console.error("Failed to fetch profile", err)
                if (err.response?.status === 401) {
                    localStorage.removeItem("resellerToken")
                    router.push("/reseller/login")
                } else {
                    setError("Failed to load dashboard data")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem("resellerToken")
        localStorage.removeItem("resellerUser")
        router.push("/reseller/login")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (!reseller) return null

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Building2 className="h-8 w-8 text-purple-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">Reseller Portal</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <User className="h-4 w-4" />
                                <span>{reseller.profile.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Welcome Section */}
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="mt-1 text-sm text-gray-500">Welcome back, check your credits and business performance.</p>
                </div>

                {/* Stats Grid */}
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Total Credits */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-blue-100 rounded-md p-3">
                                        <Wallet className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Credits</dt>
                                        <dd>
                                            <div className="text-lg font-bold text-gray-900">{reseller.wallet.total_credits}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Available Credits */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-green-100 rounded-md p-3">
                                        <CreditCard className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Available Credits</dt>
                                        <dd>
                                            <div className="text-lg font-bold text-gray-900">{reseller.wallet.available_credits}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Used Credits */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-red-100 rounded-md p-3">
                                        <Users className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Used Credits</dt>
                                        <dd>
                                            <div className="text-lg font-bold text-gray-900">{reseller.wallet.used_credits}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Detail Section */}
                <div className="mt-8 bg-white shadow rounded-lg border border-gray-100">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
                        <div className="mt-5 border-t border-gray-200">
                            <dl className="divide-y divide-gray-200">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{reseller.profile.name}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{reseller.profile.username}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{reseller.profile.email}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{reseller.profile.phone}</dd>
                                </div>
                                {reseller.business && (
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{reseller.business.business_name}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}
