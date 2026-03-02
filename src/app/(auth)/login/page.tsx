"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Briefcase, UserCheck } from "lucide-react"
import resellerService from "@/services/resellerService"
import businessService from "@/services/businessService"

function LoginPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [loginType, setLoginType] = useState<"reseller" | "business">("reseller")

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setSuccessMessage("Registration successful! Please sign in.")
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)
        setIsLoading(true)

        try {
            let data;
            if (loginType === "reseller") {
                data = await resellerService.login(formData)

                // Store token
                localStorage.setItem("token", data.access_token)
                localStorage.setItem("resellerToken", data.access_token)
                localStorage.setItem("refreshToken", data.refresh_token) // Added Refresh Token
                localStorage.setItem("user_role", data.reseller.role)
                localStorage.setItem("user_id", data.reseller.reseller_id)
                localStorage.setItem("reseller_id", data.reseller.reseller_id)

                // Redirect based on role
                if (data.reseller.role === "reseller" || data.reseller.role === "admin") {
                    router.push("/dashboard/reseller/analytics")
                } else {
                    router.push("/dashboard/reseller/analytics")
                }
            } else {
                data = await businessService.login(formData)
                // Store token
                localStorage.setItem("token", data.access_token)
                localStorage.setItem("refreshToken", data.refresh_token) // Added Refresh Token
                localStorage.setItem("user_role", data.busi_user.role)
                localStorage.setItem("user_id", data.busi_user.busi_user_id)

                // Redirect Business User
                router.push("/dashboard/user")
            }

        } catch (err: any) {
            console.error("Login error:", err)
            setError(err.response?.data?.detail || "Invalid email or password.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[440px] flex flex-col items-center">
            {/* Header Outside Card */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                <p className="text-gray-500">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>

            {/* Main Card */}
            <div className="w-full bg-white rounded-[1.5rem] shadow-xl shadow-gray-200/50 p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 border border-gray-100">

                {/* Login Type Toggle */}
                <div className="flex bg-gray-100/80 p-1 rounded-xl mb-6 relative">
                    <button
                        onClick={() => setLoginType("reseller")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${loginType === "reseller"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Briefcase className="w-4 h-4" /> Reseller
                    </button>
                    <button
                        onClick={() => setLoginType("business")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${loginType === "business"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <UserCheck className="w-4 h-4" /> User
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">Remember me</span>
                        </label>
                        <Link href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}
