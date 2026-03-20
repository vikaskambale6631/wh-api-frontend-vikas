"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { businessService, BusinessProfile } from '@/services/businessService';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
    Loader2, 
    UserX, 
    Search, 
    Edit, 
    Trash2, 
    ExternalLink, 
    Wifi, 
    WifiOff, 
    Users,
    AlertCircle,
    Plus
} from "lucide-react";

interface Analytics {
    total_users: number;
    active_users: number;
    connected_users: number;
    disconnected_users: number;
    plan_expired_users: number;
    messages_sent: number;
}

export default function ResellerUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<BusinessProfile[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
                let resellerId = localStorage.getItem('reseller_id') || localStorage.getItem('user_id');

                if (!token || !resellerId || resellerId === 'undefined') {
                    // Fallback to searching all tokens if initial attempt fails
                    setError("Authentication data missing. Please login again.");
                    setLoading(false);
                    return;
                }

                // Call the new analytics endpoint and users endpoint
                const [usersData, stats] = await Promise.all([
                    businessService.getBusinessesByReseller(resellerId, token),
                    businessService.getAnalytics(token)
                ]);

                setUsers(usersData);
                setAnalytics(stats);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                const error = err as AxiosError<{ detail: any }>;
                const detail = error.response?.data?.detail;
                setError(typeof detail === 'string' ? detail : "Failed to load users data. Server might be offline.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredUsers = users.filter(user => 
        (user.business.business_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.profile.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.profile.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.profile.phone || "").includes(searchQuery)
    );

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center p-8 bg-background">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium text-muted-foreground">Fetching User Intelligence...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Network Connectivity Issue</h2>
                    <p className="max-w-md text-muted-foreground">{error}</p>
                </div>
                <Button variant="default" size="lg" className="px-10" onClick={() => window.location.reload()}>
                    Retry Connection
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-8 max-w-[1700px] mx-auto animate-in fade-in duration-700">
            {/* Unified Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Users className="h-8 w-8 text-blue-600" />
                        <h2 className="text-4xl font-extrabold tracking-tight">User Management</h2>
                    </div>
                    <p className="text-lg text-muted-foreground font-medium pl-1">
                        Manage and monitor all your users across the platform ecosystem.
                    </p>
                </div>
                <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transform hover:-translate-y-1 transition-all duration-300 rounded-xl px-8" 
                    onClick={() => router.push('/dashboard/reseller/users/create')}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Add New User
                </Button>
            </div>

            {/* Smart Analytics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "TOTAL USERS", value: analytics?.total_users || 0, color: "bg-blue-600", secondary: "blue", icon: Users },
                    { label: "CONNECTED", value: analytics?.connected_users || 0, color: "bg-emerald-500", secondary: "emerald", icon: Wifi },
                    { label: "DISCONNECTED", value: analytics?.disconnected_users || 0, color: "bg-rose-500", secondary: "rose", icon: WifiOff },
                    { label: "PLAN EXPIRED", value: analytics?.plan_expired_users || 0, color: "bg-orange-500", secondary: "orange", icon: AlertCircle }
                ].map((stat, i) => (
                    <Card key={i} className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-card/60 backdrop-blur-xl border border-border/50">
                        <div className={`h-1.5 w-full ${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                        <CardContent className="p-7">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">{stat.label}</p>
                                    <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-500`}>
                                   {React.createElement(stat.icon, { 
                                       className: `h-8 w-8 ${
                                           stat.secondary === 'blue' ? 'text-blue-600' : 
                                           stat.secondary === 'emerald' ? 'text-emerald-500' : 
                                           stat.secondary === 'rose' ? 'text-rose-500' : 
                                           'text-orange-500'
                                       }` 
                                   })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Premium Table Container */}
            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden rounded-3xl border border-border/50">
                <CardHeader className="px-8 pt-8 pb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold tracking-tight">User Database</CardTitle>
                            <p className="text-sm text-muted-foreground">{filteredUsers.length} users active in current view</p>
                        </div>
                        <div className="relative w-full lg:w-[450px] group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input 
                                placeholder="Search by name, email, mobile, or company..." 
                                className="pl-12 h-14 bg-muted/40 border-none shadow-inner ring-1 ring-border/50 focus:ring-2 focus:ring-blue-500/50 rounded-2xl text-base transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    {filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border/60 text-muted-foreground">
                            <div className="h-24 w-24 rounded-[2rem] bg-muted/30 flex items-center justify-center mb-6 rotate-12 group-hover:rotate-0 transition-transform">
                                <UserX className="h-12 w-12 opacity-20" />
                            </div>
                            <h4 className="text-2xl font-bold text-foreground mb-2">No Matching Intel Found</h4>
                            <p className="text-lg">Try adjusting your search query or expanding filters.</p>
                            <Button variant="link" className="text-blue-500 text-lg mt-4 flex items-center gap-2" onClick={() => setSearchQuery("")}>
                                <Plus className="h-4 w-4 rotate-45" /> Clear Search
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border/40 overflow-hidden bg-background/40">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent border-border/30">
                                        <TableHead className="py-6 font-bold uppercase text-[11px] tracking-widest pl-8">USER</TableHead>
                                        <TableHead className="py-6 font-bold uppercase text-[11px] tracking-widest">COMPANY</TableHead>
                                        <TableHead className="py-6 font-bold uppercase text-[11px] tracking-widest">CONTACT</TableHead>
                                        <TableHead className="py-6 font-bold uppercase text-[11px] tracking-widest">PLAN</TableHead>
                                        <TableHead className="py-6 font-bold uppercase text-[11px] tracking-widest">CREDITS</TableHead>
                                        <TableHead className="py-6 font-bold uppercase text-[11px] tracking-widest">STATUS</TableHead>
                                        <TableHead className="py-6 font-bold uppercase text-[11px] tracking-widest text-right pr-8">ACTIONS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => {
                                        const creditRatio = user.wallet.credits_remaining / (user.wallet.credits_allocated || 1);
                                        const isLowCredits = creditRatio < 0.2;
                                        
                                        return (
                                            <TableRow key={user.busi_user_id} className="group hover:bg-primary/5 transition-all duration-300 border-border/20">
                                                <TableCell className="py-6 pl-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xl group-hover:text-blue-600 transition-colors leading-tight">{user.profile.name}</span>
                                                        <span className="text-sm font-medium text-muted-foreground">{user.profile.email}</span>
                                                        <div className="flex items-center gap-1.5 mt-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 opacity-50" />
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Joined: {new Date(user.profile.created_at || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-lg text-foreground/90">{user.business.business_name}</span>
                                                        <span className="text-xs font-mono text-muted-foreground/70 uppercase tracking-tighter mt-1 bg-muted/60 px-2 py-0.5 rounded w-fit">GSTIN: {user.business.gstin || 'NOT PROVIDED'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground font-mono">{user.profile.phone}</span>
                                                        <span className="text-xs text-muted-foreground font-medium uppercase mt-1">
                                                            PIN: {user.address?.pincode || 'N/A'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <Badge variant="outline" className="px-4 py-1.5 font-black border-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors uppercase tracking-widest text-[11px] rounded-lg">
                                                        {user.plan_name || 'DEMO SESSION'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col w-[180px]">
                                                        <div className="flex items-end justify-between mb-2">
                                                            <span className="text-lg font-black tracking-tight">{user.wallet.credits_remaining.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">/ {user.wallet.credits_allocated.toLocaleString()}</span></span>
                                                        </div>
                                                        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
                                                            <div 
                                                                className={`h-full transition-all duration-1000 ease-out ${isLowCredits ? 'bg-rose-500' : 'bg-blue-600'}`} 
                                                                style={{ width: `${Math.min(100, creditRatio * 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mt-1.5 px-0.5">Remaining / Total</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2.5 w-2.5 rounded-full ${user.connection_status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                        <span className={`text-[12px] font-bold uppercase tracking-tight ${user.connection_status === 'connected' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {user.connection_status || 'Disconnected'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 text-right pr-8">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all" title="Edit User">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all" title="View Details" onClick={() => router.push(`/dashboard/reseller/users/${user.busi_user_id}`)}>
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all" title="Delete User">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
