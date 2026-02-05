"use client";

import React, { useEffect, useState } from 'react';
import { analyticsService, ResellerDashboardResponse } from '@/services/analyticsService';
import DashboardCards from '@/components/analytics/DashboardCards';
import UsageOverview from '@/components/analytics/UsageOverview';
import TopUsers from '@/components/analytics/TopUsers';
import RecentTransactions from '@/components/analytics/RecentTransactions';
import PlanDetails from '@/components/analytics/PlanDetails';
import AccountInfo from '@/components/analytics/AccountInfo';
import TrafficSource from '@/components/analytics/TrafficSource';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
    const [user, setUser] = useState<{ user_id: string; role: string } | null>(null);
    const [data, setData] = useState<ResellerDashboardResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [regenerating, setRegenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const role = localStorage.getItem('user_role');
            // Prioritize reseller_id for resellers
            let userId = localStorage.getItem('reseller_id') || localStorage.getItem('user_id');

            // Fix: Handle 'undefined' string being stored in localStorage
            if (userId === 'undefined' || !userId) userId = null;

            if (role && userId) {
                setUser({ user_id: userId, role });
            } else {
                setLoading(false);
                setError("Authentication data missing. Please login again.");
            }
        }
    }, []);

    const fetchAnalytics = async () => {
        if (!user || user.role !== 'reseller') return;

        try {
            setLoading(true);
            setError(null);
            const dashboard = await analyticsService.getResellerDashboard(user.user_id);
            setData(dashboard);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
            setError("Failed to load analytics data.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        if (!user) return;

        try {
            setRegenerating(true);
            setError(null);
            setSuccess(null);
            const dashboard = await analyticsService.regenerateAnalytics(user.user_id);
            setData(dashboard);
            setSuccess("Analytics regenerated successfully.");
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error("Failed to regenerate analytics", error);
            setError("Failed to regenerate data.");
        } finally {
            setRegenerating(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'reseller') {
            fetchAnalytics();
        }
    }, [user]);

    if (!user && loading) return <div className="p-8">Loading...</div>;
    if (user && user.role !== 'reseller') return <div className="p-8">Access Denied.</div>;

    const displayName = data?.account_info?.full_name || data?.account_info?.username || user?.user_id || "Reseller";

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome back, {loading && !data ? "..." : displayName}!
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s what&apos;s happening with your account today.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {error && <span className="text-sm text-red-500 font-medium">{error}</span>}
                    {success && <span className="text-sm text-green-600 font-medium">{success}</span>}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchAnalytics}
                        disabled={loading || regenerating}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                    >
                        {regenerating ? 'Regenerating...' : 'Regenerate Analytics'}
                    </Button>
                </div>
            </div>

            {data && (
                <div className="flex justify-end text-xs text-muted-foreground -mt-4 mb-4">
                    Last Updated: {new Date(data.last_updated).toLocaleString()}
                </div>
            )}

            <div className="space-y-6">
                <DashboardCards data={data} loading={loading} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Usage, Top Users, Transactions */}
                    <div className="lg:col-span-2 space-y-6">
                        <UsageOverview
                            creditsUsed={data?.used_credits || 0}
                            creditsRemaining={data?.remaining_credits || 0}
                            messagesSent={data?.messages_sent || 0}
                            loading={loading}
                        />
                        <div className="grid gap-6 md:grid-cols-2">
                            <TopUsers
                                users={data?.business_users || []}
                                loading={loading}
                            />
                            <RecentTransactions
                                transactions={data?.recent_transactions || []}
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* Right Column: New Sections */}
                    <div className="space-y-6">
                        <PlanDetails
                            data={data?.plan_details || { plan_type: "...", expiry: "..." }}
                            loading={loading}
                        />
                        <AccountInfo
                            data={data?.account_info || { user_type: "", username: "", email: "", reseller_id: "" }}
                            loading={loading}
                        />
                        <TrafficSource
                            data={data?.traffic_source || []}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
