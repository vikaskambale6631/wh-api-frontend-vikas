import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, ArrowRight, Star, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface Plan {
    id: string;
    name: string;
    price: string; // e.g., "50,000" or "0"
    type: string; // "One-time payment"
    credits: string;
    rate: string;
    wallet: string;
    validity: string;
    support: string;
    popular: boolean;
    isDemo?: boolean;
    category: 'reseller' | 'user';
    icon?: LucideIcon;
}

interface PlanCardProps {
    plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
    return (
        <div className="relative group h-full">
            {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 z-20 flex justify-center">
                    <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1 border border-blue-400/30">
                        <Star className="h-3 w-3 fill-current" /> Most Popular
                    </span>
                </div>
            )}

            <Card className={cn(
                "flex flex-col h-full transition-all duration-500 hover:shadow-2xl border-gray-100",
                plan.popular ? "border-2 border-blue-600/50 shadow-xl shadow-blue-500/10 scale-105 z-10" : "hover:border-blue-200"
            )}>
                <CardHeader className="text-center pt-10 pb-4">
                    <div className={cn("mx-auto h-20 w-20 rounded-2xl flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-all duration-500 bg-linear-to-tr",
                        plan.isDemo ? "from-yellow-400/20 to-yellow-500/10" : 
                        plan.popular ? "from-blue-600/20 to-indigo-600/10" : 
                        "from-gray-100 to-gray-50")}>
                        {plan.icon ? (
                            <plan.icon className="h-10 w-10 text-yellow-500" />
                        ) : (
                            <Crown className={cn("h-10 w-10", plan.popular ? "text-blue-600" : "text-gray-500")} />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight text-gray-900">
                        {plan.name}
                    </CardTitle>
                    <div className="flex items-center justify-center gap-1 mt-3">
                        <span className="text-sm font-bold text-gray-400">₹</span>
                        <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{plan.type}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-8 p-8">
                    <div className="space-y-4 flex-1">
                        {[
                            { label: plan.credits, icon: Zap },
                            { label: plan.rate, icon: CheckCircle2 },
                            { label: `Wallet: ${plan.wallet}`, icon: Wallet },
                            { label: `Validity: ${plan.validity}`, icon: Calendar },
                            { label: plan.support, icon: Shield }
                        ].map((feature, i) => {
                            const Icon = feature.icon || CheckCircle2;
                            return (
                                <div key={i} className="flex items-center gap-4 text-sm font-medium text-gray-600">
                                    <div className={cn(
                                        "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border",
                                        plan.popular ? "bg-blue-50 border-blue-100 text-blue-600" :
                                        plan.category === 'user' ? "bg-green-50 border-green-100 text-green-600" :
                                        "bg-purple-50 border-purple-100 text-purple-600"
                                    )}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    {feature.label}
                                </div>
                            )
                        })}
                    </div>
                    
                    {plan.isDemo ? (
                        <Button
                            disabled
                            className="w-full h-14 font-black uppercase tracking-widest text-xs bg-gray-100 text-gray-400 cursor-not-allowed rounded-xl"
                        >
                            Demo Plan
                        </Button>
                    ) : (
                        <Link 
                            href={`/plans/checkout?planName=${encodeURIComponent(plan.name)}`}
                            className="w-full"
                        >
                            <Button
                                className={cn(
                                    "w-full h-14 font-black uppercase tracking-widest text-xs rounded-xl transition-all duration-300 shadow-lg",
                                    plan.popular
                                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
                                        : "bg-gray-900 hover:bg-gray-800 shadow-gray-900/10"
                                )}
                            >
                                Get Started 
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Helper icons for feature list
import { Wallet, Calendar, Shield } from "lucide-react";
