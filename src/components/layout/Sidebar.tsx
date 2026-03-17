import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, User, Code, ShoppingCart, CreditCard, Users, History, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const sidebarItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/dashboard/reseller/analytics", color: "text-blue-600" },
    { icon: User, label: "Profile", href: "/dashboard/reseller/profile", color: "text-purple-600" },
    { icon: Code, label: "API", href: "https://documenter.getpostman.com/view/1240173/2sB3B8stEM", color: "text-emerald-500" },
    { icon: ShoppingCart, label: "My Orders", href: "/dashboard/reseller/orders", color: "text-blue-500" },
    { icon: CreditCard, label: "Plans", href: "/dashboard/reseller/plans", color: "text-pink-600" },
    { icon: Users, label: "Users", href: "/dashboard/reseller/users", color: "text-teal-600" },
    { icon: History, label: "Activity History", href: "/dashboard/reseller/history", color: "text-cyan-600" },
]

interface SidebarProps {
    collapsed: boolean
    toggleSidebar: () => void
}

export function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedId = localStorage.getItem("reseller_id") || localStorage.getItem("user_id");
            if (storedId && storedId !== 'undefined') setUserId(storedId);
        }
    }, [])

    const handleSignOut = () => {
        router.push("/login")
    }

    return (
        <div
            className={cn(
                "h-screen bg-white border-r flex flex-col fixed left-0 top-0 transition-all duration-300 ease-in-out z-20",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header section */}
            <div className="p-4 border-b flex items-center justify-between h-[65px]">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={100}
                            height={32}
                            className="h-8 w-auto"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <h1 className="font-bold text-xl tracking-tight truncate">Message API</h1>
                    </div>
                )}
                {collapsed && (
                    <div className="w-full flex justify-center">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={100}
                            height={32}
                            className="h-8 w-auto"
                        />
                    </div>
                )}

                {!collapsed && (
                    <button onClick={toggleSidebar} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {collapsed && (
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-gray-900"
                >
                    <ChevronRight className="h-3 w-3" />
                </button>
            )}


            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href
                    const isExternal = item.href.startsWith("http")

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noopener noreferrer" : undefined}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
                                isActive
                                    ? "bg-gray-50 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", item.color)} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t space-y-4">
                {!collapsed ? (
                    <>
                        <Link href="/dashboard/reseller/profile" className="flex items-center gap-3 px-2 hover:bg-gray-50 rounded-md p-1 transition-colors cursor-pointer">
                            <Avatar className="h-9 w-9 bg-gray-200">
                                <AvatarFallback>User</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate text-gray-900">User</p>
                                <p className="text-xs text-gray-500 truncate">ID: {userId || "..."}</p>
                            </div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 text-red-500 text-sm font-medium px-2 hover:bg-red-50 w-full p-2 rounded-md transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Link href="/dashboard/reseller/profile">
                            <Avatar className="h-8 w-8 bg-gray-200 cursor-pointer hover:opacity-80">
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-md"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
