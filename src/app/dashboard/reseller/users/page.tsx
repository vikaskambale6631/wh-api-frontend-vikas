"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { businessService, BusinessProfile } from '@/services/businessService';
import { useModal } from '@/context/ModalContext';
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
    Loader2, 
    Search, 
    Edit, 
    Trash2, 
    ExternalLink, 
    Wifi, 
    WifiOff, 
    Users,
    AlertCircle,
    Plus,
    Clock,
    UserPlus,
    Eye
} from "lucide-react";

interface Analytics {
    total_users: number;
    active_users: number;
    connected_users: number;
    disconnected_users: number;
    plan_expired_users: number;
}

export default function ResellerUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<BusinessProfile[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showAlert, showConfirm } = useModal();
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
            let resellerId = localStorage.getItem('reseller_id') || localStorage.getItem('user_id');

            if (!token || !resellerId || resellerId === 'undefined') {
                setError("Authentication session invalid. Please log in.");
                setLoading(false);
                return;
            }

            const [usersData, stats] = await Promise.all([
                businessService.getBusinessesByReseller(resellerId, token),
                businessService.getAnalytics(token)
            ]);

            setUsers(usersData);
            setAnalytics(stats);
        } catch (err) {
            console.error("Failed to fetch intelligence:", err);
            setError("Communication link failed. Please check your connectivity.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (userId: string) => {
        router.push(`/dashboard/reseller/users/${userId}?edit=true`);
    };

    const handleDelete = async (userId: string, name: string) => {
        showConfirm(
            "Delete User",
            `Are you sure you want to delete user "${name}"?`,
            async () => {
                try {
                    const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
                    if (!token) return;
                    await businessService.delete(userId, token);
                    setUsers(users.filter(u => u.busi_user_id !== userId));
                    fetchData(); // Refresh analytics
                    showAlert("Success", "User deleted successfully.");
                } catch (err) {
                    showAlert("Error", "Deletion blocked by active system dependencies.");
                }
            }
        );
    };

    const filteredUsers = users.filter(user => 
        (user.business.business_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.profile.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.profile.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.profile.phone || "").includes(searchQuery)
    );

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 max-w-[1600px] mx-auto transition-all duration-300">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        User Management
                    </h2>
                    <p className="text-muted-foreground font-medium pl-1">
                        Manage and monitor all your users
                    </p>
                </div>
                <Button 
                    className="bg-blue-600 hover:bg-blue-700 h-11 px-6 text-base font-semibold rounded-lg shadow-md"
                    onClick={() => router.push('/dashboard/reseller/users/create')}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Add New User
                </Button>
            </div>

            {/* Production Grade Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: "TOTAL USERS", value: analytics?.total_users || 0, color: "bg-blue-600", icon: Users },
                    { label: "CONNECTED", value: analytics?.connected_users || 0, color: "bg-emerald-500", icon: Wifi },
                    { label: "DISCONNECTED", value: analytics?.disconnected_users || 0, color: "bg-rose-500", icon: WifiOff },
                    { label: "PLAN EXPIRED", value: analytics?.plan_expired_users || 0, color: "bg-orange-500", icon: Clock }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-lg overflow-hidden relative group">
                        <div className={`absolute top-0 left-0 w-full h-1 ${stat.color} opacity-80`} />
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">{stat.label}</p>
                                    <h3 className="text-4xl font-extrabold text-slate-900 leading-none">{stat.value}</h3>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.color} bg-opacity-10 group-hover:scale-105 transition-transform`}>
                                   {React.createElement(stat.icon, { className: `h-8 w-8 ${stat.color.replace('bg-', 'text-')}` })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table Area with Embedded Search */}
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                <div className="p-8 pb-4">
                    <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-bold text-slate-800">User Analytics</h3>
                        <div className="relative w-full md:w-[450px]">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input 
                                placeholder="Search users by name, email, mobile, or company..." 
                                className="pl-14 h-14 bg-slate-50 border-slate-200 rounded-xl text-base focus:bg-white transition-all focus:ring-2 focus:ring-blue-500/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-8">
                    <div className="border rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-slate-200 hover:bg-transparent">
                                    <TableHead className="py-5 font-bold text-xs uppercase text-slate-500 tracking-wider pl-8">USER</TableHead>
                                    <TableHead className="py-5 font-bold text-xs uppercase text-slate-500 tracking-wider">COMPANY</TableHead>
                                    <TableHead className="py-5 font-bold text-xs uppercase text-slate-500 tracking-wider">CONTACT</TableHead>
                                    <TableHead className="py-5 font-bold text-xs uppercase text-slate-500 tracking-wider">PLAN</TableHead>
                                    <TableHead className="py-5 font-bold text-xs uppercase text-slate-500 tracking-wider">CREDITS</TableHead>
                                    <TableHead className="py-5 font-bold text-xs uppercase text-slate-500 tracking-wider">STATUS</TableHead>
                                    <TableHead className="py-5 font-bold text-xs uppercase text-slate-500 tracking-wider text-right pr-8">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                                            No user accounts match your search query.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.map((user) => (
                                    <TableRow key={user.busi_user_id} className="hover:bg-slate-50/50 transition-colors border-slate-100 min-h-[90px]">
                                        <TableCell className="py-6 pl-8">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base text-slate-900">{user.profile.name}</span>
                                                <span className="text-xs text-slate-500 font-medium">{user.profile.email}</span>
                                                <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Joined: {new Date(user.profile.created_at || new Date()).toLocaleDateString('en-GB')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{user.business.business_name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{user.business.gstin || 'No GSTIN'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 font-mono font-bold text-slate-600 text-sm">
                                            <div className="flex flex-col">
                                                <span>{user.profile.phone}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{user.address?.pincode || 'No pincode'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-600 border-blue-200 font-bold text-[10px] rounded-md gap-2">
                                                <ExternalLink className="h-3 w-3" />
                                                {user.plan_name || 'DEMO'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {user.wallet.credits_remaining.toLocaleString()} / {user.wallet.credits_allocated.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Remaining / Total</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2.5 w-2.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <Badge className={`${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} border-none shadow-none font-bold text-[10px] px-3`}>
                                                    {user.status === 'active' ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 text-right pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                    onClick={() => router.push(`/dashboard/reseller/users/${user.busi_user_id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                                                    onClick={() => handleEdit(user.busi_user_id)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-lg"
                                                    onClick={() => handleDelete(user.busi_user_id, user.profile.name)}
                                                >
                                                    <UserPlus className="h-4 w-4 rotate-45" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </Card>
        </div>
    );
}
