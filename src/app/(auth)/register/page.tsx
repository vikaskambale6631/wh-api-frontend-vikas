"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserPlus, User, Mail, Phone, Lock, Building2, FileText, CreditCard, MapPin, Hash, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import resellerService, { ResellerRegisterData } from "@/services/resellerService"

export default function RegisterPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState<ResellerRegisterData>({
        profile: {
            name: "",
            username: "",
            email: "",
            phone: "",
            password: "",
        },
        business: {
            business_name: "",
            business_description: "",
            erp_system: "",
            gstin: "",
        },
        address: {
            full_address: "",
            pincode: "",
            country: "",
        },
        bank: {
            bank_name: "",
        }
    })

    const [confirmPassword, setConfirmPassword] = useState("")
    const [username, setUsername] = useState("")

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            profile: { ...formData.profile, [e.target.name]: e.target.value }
        })
    }

    const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            business: { ...formData.business, [e.target.name]: e.target.value }
        })
    }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            address: { ...formData.address, [e.target.name]: e.target.value }
        })
    }

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            bank: { ...formData.bank, [e.target.name]: e.target.value }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        if (formData.profile.password !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            const submissionData = {
                ...formData,
                profile: {
                    ...formData.profile,
                    username: username || formData.profile.email.split('@')[0]
                }
            }

            await resellerService.register(submissionData)
            router.push("/login?registered=true")
        } catch (err: any) {
            console.error("Registration error:", err)
            setError(err.response?.data?.detail || "Registration failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[1200px] my-4 relative z-10 px-4">
            {/* Main Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* Header Section - Compact */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Join us and start managing your business
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                        {/* Column 1: Personal Information */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Personal Info
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Full Name"
                                            className="input-field-compact"
                                            required
                                            value={formData.profile.name}
                                            onChange={handleProfileChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Username</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Username"
                                            className="input-field-compact"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address"
                                            className="input-field-compact"
                                            required
                                            value={formData.profile.email}
                                            onChange={handleProfileChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Phone</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="Mobile Number"
                                            className="input-field-compact"
                                            required
                                            value={formData.profile.phone}
                                            onChange={handleProfileChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Business Information */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                Business Info
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Business Name</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="business_name"
                                            placeholder="Business Name"
                                            className="input-field-compact"
                                            value={formData.business?.business_name}
                                            onChange={handleBusinessChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Product/Service</label>
                                    <div className="relative group">
                                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="business_description"
                                            placeholder="Description"
                                            className="input-field-compact"
                                            value={formData.business?.business_description}
                                            onChange={handleBusinessChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">ERP System</label>
                                    <div className="relative group">
                                        <select
                                            name="erp_system"
                                            className="input-field-compact appearance-none bg-white pl-10"
                                            value={formData.business?.erp_system}
                                            onChange={handleBusinessChange}
                                            style={{ paddingLeft: '0.75rem' }}
                                        >
                                            <option value="">Select ERP</option>
                                            <option value="SAP">SAP</option>
                                            <option value="Oracle">Oracle</option>
                                            <option value="Microsoft Dynamics">Microsoft Dynamics</option>
                                            <option value="Tally">Tally</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">GSTIN</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="gstin"
                                            placeholder="GSTIN"
                                            className="input-field-compact"
                                            value={formData.business?.gstin}
                                            onChange={handleBusinessChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Bank Name</label>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="bank_name"
                                            placeholder="Bank Name"
                                            className="input-field-compact"
                                            value={formData.bank?.bank_name}
                                            onChange={handleBankChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Location & Security */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                <Lock className="w-4 h-4 text-blue-600" />
                                Security & Loc
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Full Address</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="full_address"
                                            placeholder="Complete Address"
                                            className="input-field-compact"
                                            value={formData.address?.full_address}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            placeholder="Country"
                                            className="input-field-compact !pl-4"
                                            value={formData.address?.country}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Pin Code</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            placeholder="Pin"
                                            className="input-field-compact !pl-4"
                                            value={formData.address?.pincode}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Password"
                                            className="input-field-compact pr-8"
                                            required
                                            value={formData.profile.password}
                                            onChange={handleProfileChange}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Confirm</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            className="input-field-compact pr-8"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row items-center gap-4 justify-between border-t border-gray-100 pt-6">
                        <p className="text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                Sign in
                            </Link>
                        </p>

                        <button
                            type="submit"
                            className="w-full md:w-auto px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </div>

                </form>
            </div>

            <style jsx global>{`
        .input-field-compact {
          width: 100%;
          padding-left: 2.5rem; 
          padding-right: 0.75rem;
          padding-top: 0.6rem;
          padding-bottom: 0.6rem;
          background-color: rgb(249, 250, 251); /* gray-50 */
          border-width: 1px;
          border-color: rgb(229, 231, 235); /* gray-200 */
          border-radius: 0.5rem; /* rounded-lg */
          color: rgb(17, 24, 39); /* gray-900 */
          font-size: 0.875rem; /* text-sm */
          font-weight: 500;
          transition: all 0.2s;
        }
        .input-field-compact::placeholder {
           color: rgb(156, 163, 175); /* gray-400 */
           font-size: 0.8rem;
        }
        .input-field-compact:focus {
          outline: none;
          background-color: white;
          border-color: rgb(37, 99, 235); /* blue-600 */
          box-shadow: 0 0 0 1px rgb(37, 99, 235);
        }
      `}</style>
        </div>
    )
}
