"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, Mail, Eye, EyeOff } from "lucide-react"
import resellerService from "@/services/resellerService"

export default function ResellerLoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const response = await resellerService.login(formData)
            // Store token and user details
            localStorage.setItem("resellerToken", response.access_token)
            localStorage.setItem("refreshToken", response.refresh_token) // Added Refresh Token
            localStorage.setItem("user_role", "reseller")
            if (response.reseller?.reseller_id) {
                localStorage.setItem("reseller_id", response.reseller.reseller_id)
            }
            localStorage.setItem("resellerUser", JSON.stringify(response.reseller))

            router.push("/reseller/dashboard")
        } catch (err: any) {
            setError(err.response?.data?.detail || "Login failed. Please check your credentials.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Image */}
            <div
                className="fixed inset-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/login-bg.png)',
                }}
            >
                {/* Overlay to ensure card pops */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-600/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Reseller Portal</h1>
                    <p className="text-gray-200">
                        Don't have an account?{" "}
                        <Link href="/reseller/register" className="text-purple-300 font-semibold hover:text-purple-200 transition-colors">
                            Apply here
                        </Link>
                    </p>
                </div>

                <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 animate-in fade-in slide-in-from-right-8 duration-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all font-medium"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600/20" />
                                <span className="text-sm font-medium text-gray-600">Remember me</span>
                            </label>
                            <Link href="#" className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
