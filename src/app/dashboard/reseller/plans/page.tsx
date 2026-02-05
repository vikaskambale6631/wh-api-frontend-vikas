"use client"

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, Users, Wallet, Crown, Zap, List, Grid } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Plan, PlanCard } from "@/components/plans/PlanCard";
import { PlanTable } from "@/components/plans/PlanTable";

// Merged Data with categories
const allPlans: Plan[] = [
    // Reseller Plans
    {
        id: "map-8d",
        name: "MAP 8D",
        price: "50,000",
        type: "One-time payment",
        credits: "500,000 Credits",
        rate: "0.1 paise per message",
        wallet: "₹0",
        validity: "360 days",
        support: "24/7 Support",
        popular: false,
        category: 'reseller'
    },
    {
        id: "map-8a",
        name: "MAP 8A",
        price: "13,500",
        type: "One-time payment",
        credits: "100,000 Credits",
        rate: "0.135 paise per message",
        wallet: "₹0",
        validity: "360 days",
        support: "24/7 Support",
        popular: true,
        category: 'reseller'
    },
    {
        id: "map-8c",
        name: "MAP 8C",
        price: "33,000",
        type: "One-time payment",
        credits: "300,000 Credits",
        rate: "0.11 paise per message",
        wallet: "₹0",
        validity: "360 days",
        support: "24/7 Support",
        popular: false,
        category: 'reseller'
    },
    // User Plans
    {
        id: "demo",
        name: "DEMO",
        price: "0",
        type: "One-time payment",
        credits: "30 Credits",
        rate: "0 paise per message",
        wallet: "₹0",
        validity: "3 days",
        support: "24/7 Support",
        popular: false,
        isDemo: true,
        icon: Zap,
        category: 'user'
    },
    {
        id: "map-9a",
        name: "MAP 9A",
        price: "500",
        type: "One-time payment",
        credits: "1,000 Credits",
        rate: "0.5 paise per message",
        wallet: "₹0",
        validity: "30 days",
        support: "24/7 Support",
        popular: false,
        category: 'user'
    },
    {
        id: "map-9b",
        name: "MAP 9B",
        price: "2,000",
        type: "One-time payment",
        credits: "5,000 Credits",
        rate: "0.4 paise per message",
        wallet: "₹0",
        validity: "180 days",
        support: "24/7 Support",
        popular: false,
        category: 'user'
    },
    {
        id: "map-9d",
        name: "MAP 9D",
        price: "6,000",
        type: "One-time payment",
        credits: "25,000 Credits",
        rate: "0.24 paise per message",
        wallet: "₹0",
        validity: "360 days",
        support: "24/7 Support",
        popular: false,
        category: 'user'
    },
    {
        id: "map-9c",
        name: "MAP 9C",
        price: "3,000",
        type: "One-time payment",
        credits: "10,000 Credits",
        rate: "0.3 paise per message",
        wallet: "₹0",
        validity: "360 days",
        support: "24/7 Support",
        popular: false,
        category: 'user'
    },
    {
        id: "map-9e",
        name: "MAP 9E",
        price: "11,000",
        type: "One-time payment",
        credits: "50,000 Credits",
        rate: "0.22 paise per message",
        wallet: "₹0",
        validity: "360 days",
        support: "24/7 Support",
        popular: false,
        category: 'user'
    },
];

type PlanType = 'all' | 'reseller' | 'user';

export default function PlansPage() {
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [activePlanType, setActivePlanType] = useState<PlanType>('all');

    const filteredPlans = allPlans.filter(plan => {
        if (activePlanType === 'all') return true;
        return plan.category === activePlanType;
    });

    const overviewCards = [
        {
            id: 'all',
            label: "TOTAL PLANS",
            value: allPlans.length.toString(),
            icon: LayoutGrid,
            color: "bg-blue-600",
            textColor: "text-white"
        },
        {
            id: 'reseller',
            label: "RESELLER PLANS",
            value: allPlans.filter(p => p.category === 'reseller').length.toString(),
            icon: Crown,
            color: "bg-purple-600",
            textColor: "text-white"
        },
        {
            id: 'user',
            label: "USER PLANS",
            value: allPlans.filter(p => p.category === 'user').length.toString(),
            icon: Users,
            color: "bg-green-600",
            textColor: "text-white"
        },
        // Display only, not clickable for filtering
        {
            id: 'price',
            label: "AVERAGE PRICE",
            value: "₹22,214",
            icon: Wallet,
            color: "bg-orange-500",
            textColor: "text-white",
            noFilter: true
        },
    ];

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-6 w-6 text-blue-600" />
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Pricing Plans</h2>
                </div>
                <p className="text-muted-foreground">
                    Choose the perfect plan for your messaging needs
                </p>
            </div>

            {/* Overview Cards (Filters) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-blue-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-gray-800">Plans Overview</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {overviewCards.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => !item.noFilter && setActivePlanType(item.id as PlanType)}
                            className={cn(
                                "cursor-pointer transition-all duration-200 transform hover:scale-[1.02]",
                                !item.noFilter && activePlanType === item.id ? "ring-2 ring-offset-2 ring-gray-900 scale-[1.02]" : ""
                            )}
                        >
                            <Card className={`${item.color} border-none shadow-lg relative overflow-hidden h-full`}>
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start z-10 relative">
                                        <div>
                                            <p className={`text-xs font-semibold ${item.textColor} opacity-90 mb-1`}>{item.label}</p>
                                            <h3 className={`text-3xl font-bold ${item.textColor}`}>{item.value}</h3>
                                        </div>
                                        <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm ${item.textColor}`}>
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* Plans Display Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {activePlanType === 'all' && <LayoutGrid className="h-5 w-5 text-gray-600" />}
                        {activePlanType === 'reseller' && <Crown className="h-5 w-5 text-purple-600" />}
                        {activePlanType === 'user' && <Users className="h-5 w-5 text-green-600" />}
                        <h3 className="text-xl font-bold text-gray-900 capitalize">
                            {activePlanType === 'all' ? 'All Plans' : `${activePlanType} Plans`}
                        </h3>
                        <span className="text-sm text-muted-foreground ml-2">
                            ({filteredPlans.length} plans found)
                        </span>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                        <button
                            onClick={() => setViewMode('card')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === 'card' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <Grid className="h-4 w-4" /> Card View
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <List className="h-4 w-4" /> Table View
                        </button>
                    </div>
                </div>

                {viewMode === 'card' ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {filteredPlans.map((plan) => (
                            <PlanCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                ) : (
                    <PlanTable plans={filteredPlans} />
                )}

                {filteredPlans.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed text-gray-500">
                        <p>No plans found for this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
