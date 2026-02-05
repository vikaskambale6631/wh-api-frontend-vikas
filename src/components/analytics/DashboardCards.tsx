import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, BarChart3, PieChart, Wallet } from 'lucide-react';

interface DashboardCardsProps {
    data: {
        total_credits: number;
        used_credits: number;
        remaining_credits: number;
        wallet_balance: number;
    } | null;
    loading: boolean;
}

export default function DashboardCards({ data, loading }: DashboardCardsProps) {
    if (loading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    </CardContent>
                </Card>
            ))}
        </div>;
    }

    if (!data) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-blue-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">TOTAL CREDITS PURCHASED</CardTitle>
                    <DollarSign className="h-4 w-4 opacity-75" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.total_credits.toLocaleString()}</div>
                    <p className="text-xs opacity-75 pt-1">Lifetime accumulation</p>
                </CardContent>
            </Card>

            <Card className="bg-purple-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">USED CREDITS</CardTitle>
                    <BarChart3 className="h-4 w-4 opacity-75" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.used_credits.toLocaleString()}</div>
                    <p className="text-xs opacity-75 pt-1">Consumed by businesses</p>
                </CardContent>
            </Card>

            <Card className="bg-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">REMAINING TO DISTRIBUTE</CardTitle>
                    <PieChart className="h-4 w-4 opacity-75" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.remaining_credits.toLocaleString()}</div>
                    <p className="text-xs opacity-75 pt-1">Available for allocation</p>
                </CardContent>
            </Card>

            <Card className="bg-orange-500 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">WALLET BALANCE</CardTitle>
                    <Wallet className="h-4 w-4 opacity-75" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.wallet_balance.toLocaleString()}</div>
                    <p className="text-xs opacity-75 pt-1">Current Account Balance</p>
                </CardContent>
            </Card>
        </div>
    );
}
