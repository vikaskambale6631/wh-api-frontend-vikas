"use client"

import React, { useState, useEffect } from "react"
import { ShoppingCart, CreditCard, ArrowRight, Package, Calendar, CheckCircle, Clock, XCircle, UserCheck, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import creditService from "@/services/creditService"

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('http://localhost:8000/api/v1/credits/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setOrders(data)
            } else {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.')
                } else {
                    setError('Failed to fetch orders. Please try again.')
                }
            }
        } catch (error: any) {
            setError('Backend server is not accessible.')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
            case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
            default: return <Clock className="h-4 w-4 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-700 bg-green-50 border border-green-200'
            case 'pending': return 'text-yellow-700 bg-yellow-50 border border-yellow-200'
            case 'failed': return 'text-red-700 bg-red-50 border border-red-200'
            default: return 'text-gray-700 bg-gray-50 border border-gray-200'
        }
    }

    const getAllocBadge = (order: any) => {
        if (order.status !== 'success') return null
        if (order.is_allocated === 'allocated') {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Allocated
                </span>
            )
        }
        return (
            <span className="px-2 py-1 rounded-full text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Not Allocated
            </span>
        )
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2.5 rounded-lg shadow-sm">
                        <CreditCard className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Order History</h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Track and manage all your orders</p>
                    </div>
                </div>
                <Card className="min-h-[500px] flex items-center justify-center">
                    <CardContent className="text-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading orders...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2.5 rounded-lg shadow-sm">
                        <CreditCard className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Order History</h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">
                            Track all purchases and allocate credits to your business users
                        </p>
                    </div>
                </div>
            </div>

            {error ? (
                <Card className="min-h-[500px] flex items-center justify-center border-red-200 bg-red-50/50">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12">
                        <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-red-900 mb-2">Connection Error</h3>
                        <p className="text-red-700 max-w-sm mb-8">{error}</p>
                        <Button onClick={() => fetchOrders()} className="bg-red-600 hover:bg-red-700">Try Again</Button>
                    </CardContent>
                </Card>
            ) : orders.length === 0 ? (
                <Card className="min-h-[500px] flex items-center justify-center border-dashed border-2 bg-gray-50/50">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12">
                        <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <ShoppingCart className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Found</h3>
                        <p className="text-gray-500 max-w-sm mb-8">
                            You haven&apos;t placed any orders yet. Start by exploring our plans.
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">
                            Browse Plans <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Your Orders ({orders.length})
                        </CardTitle>
                        <CardDescription>
                            Paid orders can be allocated to a business user. Credits go directly into their wallet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {orders.map((order: any) => (
                                <div key={order.id} className="border rounded-xl p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex flex-col gap-4">
                                        {/* Top row */}
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-bold text-gray-900 text-base">{order.plan_name} Plan</h4>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </span>
                                                {getAllocBadge(order)}
                                            </div>
                                            <span className="text-lg font-black text-blue-700">₹{order.amount?.toLocaleString()}</span>
                                        </div>

                                        {/* Details row */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {formatDate(order.created_at)}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-800">Credits:</span> {order.credits?.toLocaleString()}
                                            </div>
                                            <div className="col-span-2 text-xs text-gray-400 truncate">
                                                TXN: {order.txnid}
                                            </div>
                                        </div>

                                        {/* Allocated info */}
                                        {order.allocated_to_user_id && (
                                            <div className="text-xs text-blue-600 bg-blue-50 rounded px-3 py-2">
                                                <span className="font-semibold">Allocated to:</span> {order.allocated_to_user_id}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
