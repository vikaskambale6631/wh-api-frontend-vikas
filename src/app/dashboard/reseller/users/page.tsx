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
import { Loader2, UserX } from "lucide-react";

export default function ResellerUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<BusinessProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
                let resellerId = localStorage.getItem('reseller_id') || localStorage.getItem('user_id');

                // Fix: Handle 'undefined' string values
                if (resellerId === 'undefined' || !resellerId) resellerId = null;

                if (!token || !resellerId) {
                    setError("Authentication data missing. Please login again.");
                    setLoading(false);
                    return;
                }

                const data = await businessService.getBusinessesByReseller(resellerId, token);
                setUsers(data);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                const error = err as AxiosError<{ detail: any }>;
                const detail = error.response?.data?.detail;
                setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || "Failed to load users.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Users</h2>
                    <p className="text-muted-foreground">
                        Manage and view all your registered business users.
                    </p>
                </div>
                <Button onClick={() => router.push('/dashboard/reseller/users/create')}>
                    + Add User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users List</CardTitle>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <UserX className="h-12 w-12 mb-4 opacity-20" />
                            <p>No users found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Name</TableHead>
                                    <TableHead>Contact Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Credits</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead className="text-right">Registered</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.busi_user_id}>
                                        <TableCell className="font-medium">
                                            {user.business.business_name}
                                        </TableCell>
                                        <TableCell>{user.profile.name}</TableCell>
                                        <TableCell>{user.profile.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.wallet.credits_remaining} / {user.wallet.credits_allocated}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.whatsapp_mode}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {new Date(user.profile.created_at || new Date()).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
