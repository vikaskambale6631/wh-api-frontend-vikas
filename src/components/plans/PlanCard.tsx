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
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" /> Most Popular
                    </span>
                </div>
            )}

            <Card className={cn(
                "flex flex-col h-full transition-all duration-300 hover:shadow-xl",
                plan.popular ? "border-2 border-blue-600 shadow-lg scale-105 z-10" : "border border-gray-100 hover:border-gray-200"
            )}>
                <CardHeader className="text-center pt-8 pb-4">
                    <div className={cn("mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300",
                        plan.isDemo ? "bg-yellow-50" : "bg-gray-50")}>
                        {plan.icon ? (
                            <plan.icon className="h-8 w-8 text-yellow-500" />
                        ) : (
                            <Crown className={cn("h-8 w-8", plan.popular ? "text-blue-600" : "text-gray-500")} />
                        )}
                    </div>
                    <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        {plan.name}
                    </CardTitle>
                    <p className="text-3xl font-extrabold text-gray-900 mt-2">
                        ₹{plan.price}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">{plan.type}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-6">
                    <div className="space-y-3 flex-1">
                        {[plan.credits, plan.rate, `Wallet: ${plan.wallet}`, `Validity: ${plan.validity}`, plan.support].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                <div className={cn(
                                    "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                                    plan.popular ? "bg-blue-100 text-blue-600" :
                                        plan.category === 'user' ? "bg-green-100 text-green-600" :
                                            "bg-purple-100 text-purple-600"
                                )}>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>
                    <Button
                        disabled={plan.isDemo}
                        className={cn(
                            "w-full h-12 font-bold group-hover:translate-y-[-2px] transition-all duration-300",
                            plan.isDemo
                                ? "bg-gray-100 text-gray-500 hover:bg-gray-100 cursor-not-allowed"
                                : plan.popular
                                    ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                                    : "bg-gray-900 hover:bg-gray-800"
                        )}
                    >
                        {plan.isDemo ? "Demo Plan - No Purchase Required" : (
                            <>Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
