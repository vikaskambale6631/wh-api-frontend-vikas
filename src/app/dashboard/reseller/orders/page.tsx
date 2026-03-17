"use client"

import React, { useState, useEffect } from "react"
import { ShoppingCart, CreditCard, Search, ArrowRight, Package, Calendar, CheckCircle, Clock, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token')
            
            // First check if backend is running
            try {
                const healthResponse = await fetch('http://localhost:8000/health')
                if (!healthResponse.ok) {
                    throw new Error('Backend not healthy')
                }
            } catch (healthError: any) {
                console.error('Backend health check failed:', healthError)
                setError('Backend server is not running. Please start the backend server.')
                setLoading(false)
                return
            }
            
            const response = await fetch('http://localhost:8000/api/v1/credits/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            
            if (response.ok) {
                const data = await response.json()
                setOrders(data)
                console.log('Orders fetched:', data)
            } else {
                console.error('Failed to fetch orders:', response.status, response.statusText)
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.')
                } else {
                    setError('Failed to fetch orders. Please try again.')
                }
            }
        } catch (error: any) {
            console.error('Error fetching orders:', error)
            if (error.message.includes('Failed to fetch')) {
                setError('Backend server is not accessible. Please check if the server is running.')
            } else {
                setError('An error occurred while fetching orders.')
            }
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600" />
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />
            default:
                return <Clock className="h-4 w-4 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'text-green-600 bg-green-50'
            case 'pending':
                return 'text-yellow-600 bg-yellow-50'
            case 'failed':
                return 'text-red-600 bg-red-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-2.5 rounded-lg shadow-sm">
                            <CreditCard className="h-7 w-7 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Order History</h2>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Track and manage all your orders
                            </p>
                        </div>
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
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2.5 rounded-lg shadow-sm">
                        <CreditCard className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Order History</h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">
                            Track and manage all your orders
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {error ? (
                <Card className="min-h-[500px] flex items-center justify-center border-red-200 bg-red-50/50">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12">
                        <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-red-900 mb-2">Connection Error</h3>
                        <p className="text-red-700 max-w-sm mb-8 leading-relaxed">
                            {error}
                        </p>
                        <div className="flex gap-4">
                            <Button onClick={() => fetchOrders()} className="bg-red-600 hover:bg-red-700 h-11 px-8 rounded-full shadow-md transition-all">
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : orders.length === 0 ? (
                <Card className="min-h-[500px] flex items-center justify-center border-dashed border-2 bg-gray-50/50">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12">
                        <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <ShoppingCart className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Found</h3>
                        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                            You haven&apos;t placed any orders yet. Start by exploring our plans and make your first purchase.
                        </p>
                        <div className="flex gap-4">
                            <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-full shadow-md transition-all hover:scale-105">
                                Browse Plans
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
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
                            View your complete order history and payment status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {orders.map((order: any) => (
                                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold text-gray-900">{order.plan_name} Plan</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(order.created_at)}
                                                </div>
                                                <div className="text-gray-600">
                                                    <span className="font-medium">Credits:</span> {order.credits.toLocaleString()}
                                                </div>
                                                <div className="text-gray-600">
                                                    <span className="font-medium">Amount:</span> ₹{order.amount.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                Transaction ID: {order.txnid}
                                            </div>
                                        </div>
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
