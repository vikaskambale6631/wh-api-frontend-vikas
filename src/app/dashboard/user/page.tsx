"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Wallet, User, TrendingUp, LogOut, Building2, Smartphone } from "lucide-react"
import businessService, { BusinessProfile } from "@/services/businessService"

export default function UserDashboard() {
  const router = useRouter()
  const [data, setData] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/login")
          return
        }

        const profileData = await businessService.getProfile(token)
        setData(profileData)
      } catch (err: any) {
        console.error("Failed to fetch profile", err)
        setError("Failed to load dashboard data. Please try again.")
        if (err.response?.status === 401) {
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
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
        <button onClick={handleLogout} className="ml-4 text-blue-600 underline">Logout</button>
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
              {data?.business.business_name}
            </h1>
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
              <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-800 uppercase tracking-wide">
                {data?.role === 'business_owner' ? 'User' : data?.role}
              </span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {data?.profile.name}</span>
              <span className="hidden md:inline text-gray-300">|</span>
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

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Remaining Credits (Primary) */}
          <div className="md:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-violet-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Wallet className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-violet-100 font-medium mb-1 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Credits Remaining
              </p>
              <h3 className="text-5xl font-bold tracking-tight">{data?.wallet.credits_remaining}</h3>
              <div className="mt-4 flex gap-4 text-sm font-medium text-violet-200/80">
                <div>Allocated: {data?.wallet.credits_allocated}</div>
                <div>Used: {data?.wallet.credits_used}</div>
              </div>
            </div>
          </div>

          {/* WhatsApp Mode */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-4 top-4 bg-green-100 dark:bg-green-900/20 p-3 rounded-2xl text-green-600 dark:text-green-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">WhatsApp Mode</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{data?.whatsapp_mode}</h3>
            <div className="mt-2 text-xs text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg">Active</div>
          </div>

          {/* ERP System */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-4 top-4 bg-blue-100 dark:bg-blue-900/20 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">ERP System</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{data?.business.erp_system || "Not Connected"}</h3>
            <div className="mt-2 text-xs text-gray-400">ID: {data?.business.gstin || "N/A"}</div>
          </div>
        </div>

        {/* Content Placeholder */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px] flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Business Overview</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Send messages, manage templates, and view detailed analytics here. Features coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
