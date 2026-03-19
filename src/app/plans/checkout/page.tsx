"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Loader2, 
    Wallet, 
    Building2, 
    Mail, 
    Phone, 
    FileText, 
    ShoppingCart, 
    Users, 
    Crown 
} from "lucide-react"
import Script from "next/script"
import { resellerPlans, userPlans } from "@/data/plansData"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import creditService from "@/services/creditService"
import { businessService } from "@/services/businessService"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

declare global {
    interface Window {
        Razorpay: any;
    }
}

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const planName = searchParams.get('planName')
    const [isLoading, setIsLoading] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        company: "",
        gstin: "",
        allocate_to_user_id: "self"
    })
    const [businessUsers, setBusinessUsers] = useState<any[]>([])
    const [userRole, setUserRole] = useState<string | null>(null)
    
    const [billingData, setBillingData] = useState({
        grossAmount: 0,
        gstAmount: 0,
        totalAmount: 0,
        credits: 0
    })

    // Find the plan details
    const allPlans = [...resellerPlans, ...userPlans]
    const selectedPlan = allPlans.find(p => p.name === planName)

    // Initialize billing data when plan is selected
    useEffect(() => {
        if (selectedPlan) {
            const price = parseInt(selectedPlan.price.replace(/[^0-9]/g, ''))
            const gst = Math.round(price * 0.18)
            setBillingData({
                grossAmount: price,
                gstAmount: gst,
                totalAmount: price + gst,
                credits: parseInt(selectedPlan.credits.replace(/,/g, ''))
            })
        }
    }, [selectedPlan])

    // Fetch business users if role is reseller
    useEffect(() => {
        const fetchUserData = async () => {
            if (typeof window !== 'undefined') {
                try {
                    const role = localStorage.getItem('user_role')
                    const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
                    
                    if (role && token) {
                        setUserRole(role)
                        
                        if (role === 'reseller' || role === 'admin') {
                            const resellerId = localStorage.getItem('user_id') || localStorage.getItem('reseller_id')
                            if (resellerId) {
                                const response = await businessService.getBusinessesByReseller(resellerId, token)
                                setBusinessUsers(Array.isArray(response) ? response : (response.data || []))
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error fetching user info or businesses:', err)
                }
            }
        }
        fetchUserData()
    }, [])

    if (!selectedPlan && planName) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-red-600">Plan not found</h2>
                    <Button onClick={() => router.push('/plans')} className="mt-4">
                        Back to Plans
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    if (!planName) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900">No plan selected</h2>
                    <Button onClick={() => router.push('/plans')} className="mt-4">
                        View Plans
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    const handlePayment = async () => {
        if (!selectedPlan) return;
        
        // Simple validation
        if (!formData.name || !formData.email || !formData.mobile) {
            alert("Please fill in all required fields");
            return;
        }

        setIsLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                alert("You must be logged in to purchase a plan")
                router.push('/login')
                return
            }

            // Step 1: Call backend to initiate payment
            const payload: any = {
                plan_name: selectedPlan.name,
                credits: billingData.credits,
                price: billingData.grossAmount
            };
            
            if (formData.allocate_to_user_id !== "self") {
                payload.allocated_to_user_id = formData.allocate_to_user_id;
            }
            
            const response = await creditService.initiatePayment(payload, token)

            if (response.success && response.razorpay_order_id) {
                // Step 2: Open Razorpay Checkout
                const options = {
                    key: response.key,
                    amount: response.amount,
                    currency: response.currency,
                    name: "WhatsApp Platform",
                    description: selectedPlan.name,
                    order_id: response.razorpay_order_id,
                    handler: async function (paymentResponse: any) {
                        try {
                            setIsLoading(true);
                            const verifyResult = await creditService.verifyPayment({
                                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                razorpay_order_id: paymentResponse.razorpay_order_id,
                                razorpay_signature: paymentResponse.razorpay_signature
                            }, token);

                            if (verifyResult.success) {
                                router.push('/dashboard/reseller/orders?status=success');
                            } else {
                                alert("Payment verification failed. Please contact support.");
                            }
                        } catch (err: any) {
                            console.error("Verification error:", err);
                            alert("Error verifying payment");
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    prefill: {
                        name: formData.name,
                        email: formData.email,
                        contact: formData.mobile
                    },
                    notes: {
                        txnid: response.txnid
                    },
                    theme: {
                        color: "#2563eb"
                    }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                throw new Error("Failed to initialize payment gateway");
            }

        } catch (error: any) {
            console.error("Purchase failed:", error)
            alert(error.response?.data?.detail || error.message || "Failed to process purchase. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Removed static calculations

    return (
        <div className="max-w-6xl mx-auto py-10 px-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10 border-b pb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Plan Purchase</h1>
                    <p className="text-gray-500 font-medium">Complete your plan purchase to get started</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Personal Information */}
                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                    <CardHeader className="bg-gray-50/50 border-b p-6">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500">
                            <Users className="h-4 w-4 text-blue-600" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <Users className="absolute left-4 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                                    <Input 
                                        placeholder="Enter your full name" 
                                        className="pl-11 h-12 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                                    <Input 
                                        placeholder="Enter your email" 
                                        className="pl-11 h-12 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                                    <Input 
                                        placeholder="Enter your phone number" 
                                        className="pl-11 h-12 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Company Name (Optional)</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                                    <Input 
                                        placeholder="Enter company name" 
                                        className="pl-11 h-12 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.company}
                                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-600 uppercase tracking-widest ml-1">GSTIN (Optional)</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                                    <Input 
                                        placeholder="Enter GSTIN (if applicable)" 
                                        className="pl-11 h-12 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.gstin}
                                        onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            {(userRole === 'reseller' || userRole === 'admin') && (
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Allocate Plan To</label>
                                    <Select 
                                        value={formData.allocate_to_user_id} 
                                        onValueChange={(value) => setFormData({...formData, allocate_to_user_id: value})}
                                    >
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 font-medium">
                                            <SelectValue placeholder="Select a user to allocate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="self" className="font-semibold text-blue-600">Buy for Myself (My Wallet) - Default</SelectItem>
                                            {businessUsers.map((user) => (
                                                <SelectItem key={user.busi_user_id || user.id} value={user.busi_user_id || user.id}>
                                                    {user.profile?.name || user.business?.business_name || 'Unnamed Business'} ({user.profile?.email || 'No email'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400 mt-2 px-1 font-medium">If you select a business user, the credits from this plan will be automatically deposited into their wallet after purchase.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Details */}
                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                    <CardHeader className="bg-gray-50/50 border-b p-6">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500">
                            <Crown className="h-4 w-4 text-blue-600" />
                            Plan Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 font-medium">
                        <div className="grid grid-cols-2 gap-8 text-center sm:text-left">
                            <div className="border-r pr-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Plan Name</p>
                                <Badge variant="outline" className="text-lg font-black text-blue-600 border-none p-0">{selectedPlan?.name}</Badge>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Credits</p>
                                {isEditMode ? (
                                    <Input 
                                        type="number"
                                        value={billingData.credits}
                                        onChange={(e) => setBillingData({...billingData, credits: parseInt(e.target.value) || 0})}
                                        className="h-8 w-24 text-center font-black rounded-lg bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600"
                                    />
                                ) : (
                                    <p className="text-lg font-black text-gray-900">{billingData.credits.toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing Summary */}
                <Card className="border-none shadow-sm ring-1 ring-gray-100">
                    <CardHeader className="bg-gray-50/50 border-b p-6">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500">
                            <Wallet className="h-4 w-4 text-blue-600" />
                            Billing Summary
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="ml-auto text-blue-600 hover:text-blue-800"
                                onClick={() => setIsEditMode(!isEditMode)}
                            >
                                <FileText className="h-4 w-4" />
                                {isEditMode ? 'Save Changes' : 'Edit Billing'}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">Gross Amount</span>
                            {isEditMode ? (
                                <Input 
                                    type="number"
                                    value={billingData.grossAmount}
                                    onChange={(e) => {
                                        const newPrice = parseInt(e.target.value) || 0
                                        const newGst = Math.round(newPrice * 0.18)
                                        setBillingData({
                                            ...billingData,
                                            grossAmount: newPrice,
                                            gstAmount: newGst,
                                            totalAmount: newPrice + newGst
                                        })
                                    }}
                                    className="w-32 text-right font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1"
                                />
                            ) : (
                                <span className="font-black text-gray-900">₹{billingData.grossAmount.toLocaleString()}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">GST (18%)</span>
                            {isEditMode ? (
                                <Input 
                                    type="number"
                                    value={billingData.gstAmount}
                                    onChange={(e) => {
                                        const newGst = parseInt(e.target.value) || 0
                                        setBillingData({
                                            ...billingData,
                                            gstAmount: newGst,
                                            totalAmount: billingData.grossAmount + newGst
                                        })
                                    }}
                                    className="w-32 text-right font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1"
                                />
                            ) : (
                                <span className="font-black text-gray-900">₹{billingData.gstAmount.toLocaleString()}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">Internet Handling Charge</span>
                            <span className="font-black text-gray-900">₹0.00</span>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-dashed border-gray-200">
                            <span className="text-xl font-black text-gray-900 uppercase tracking-tighter">Total Amount</span>
                            <span className="text-3xl font-black text-blue-600 font-mono tracking-tighter">₹{billingData.totalAmount.toLocaleString()}</span>
                        </div>
                        
                        {/* Edit Mode Indicator */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                    {isEditMode ? 'Edit Mode: Modify billing details above' : 'Billing details can be edited before checkout'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-center">
                            <Button 
                                onClick={handlePayment}
                                disabled={isLoading}
                                className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {isEditMode ? 'Saving Changes...' : 'Redirecting to Payment Gateway...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Save & Continue' : 'Proceed to Checkout'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <DashboardLayout>
            <Script 
                src="https://checkout.razorpay.com/v1/checkout.js" 
                strategy="afterInteractive" 
            />
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            }>
                <CheckoutContent />
            </Suspense>
        </DashboardLayout>
    )
}
