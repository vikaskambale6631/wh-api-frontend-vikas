import { CreditCard, MessageSquare, TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function StatsCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white border-none shadow-md relative overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-xs font-semibold tracking-wider uppercase">Total Credits</p>
                            <h3 className="text-3xl font-bold mt-1">13,930</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <CreditCard className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </CardContent>
                {/* Decorational circle */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </Card>

            <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white border-none shadow-md relative overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-purple-100 text-xs font-semibold tracking-wider uppercase">Used Credits</p>
                            <h3 className="text-3xl font-bold mt-1">0</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </CardContent>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </Card>

            <Card className="bg-linear-to-br from-green-500 to-green-600 text-white border-none shadow-md relative overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-100 text-xs font-semibold tracking-wider uppercase">Remaining Credits</p>
                            <h3 className="text-3xl font-bold mt-1">13,930</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </CardContent>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </Card>

            <Card className="bg-linear-to-br from-orange-500 to-orange-600 text-white border-none shadow-md relative overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-orange-100 text-xs font-semibold tracking-wider uppercase">Wallet Balance</p>
                            <h3 className="text-3xl font-bold mt-1">₹0</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </CardContent>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </Card>
        </div>
    )
}
