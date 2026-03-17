"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutGrid,
    Plug,
    MessageSquare,
    Layout,
    FileSpreadsheet,
    Users,
    MessageCircleReply,
    FileText,
    ChevronDown,
    X,
    LogOut,
    CreditCard,
    ShieldCheck,
    Code
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    collapsed: boolean;
    toggleSidebar: () => void;
}

export function UserSidebar({ collapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter(); // Added hook
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem('reseller_id') || localStorage.getItem('user_id');
            if (storedId && storedId !== 'undefined') setUserId(storedId);
        }
    }, []);

    const toggleSubmenu = (label: string) => {
        if (collapsed) return;
        setOpenSubmenu(openSubmenu === label ? null : label);
    };

    const handleSignOut = () => {
        router.push("/login")
    }

    // ... menuItems definitions (unchanged) ...
    const menuItems = [
        { label: "HOME", icon: LayoutGrid, href: "/dashboard/user", color: "text-blue-500" },
        { label: "CREDITS", icon: CreditCard, href: "/dashboard/user/credits", color: "text-amber-500" },
        { label: "DEVICES", icon: Plug, href: "/dashboard/user/devices", hasSubmenu: false, color: "text-purple-500" },
        {
            label: "Official Configuration",
            icon: ShieldCheck,
            href: "#",
            hasSubmenu: true,
            color: "text-green-600",
            submenu: [
                { label: "Configuration", href: "/dashboard/user/official-whatsapp?tab=config" },
                { label: "Templates", href: "/dashboard/user/official-whatsapp?tab=templates" },
                { label: "Webhook Logs", href: "/dashboard/user/official-whatsapp?tab=logs" }
            ]
        },
        {
            label: "MESSAGE",
            icon: MessageSquare,
            href: "#",
            hasSubmenu: true,
            color: "text-green-500",
            submenu: [
                { label: "Send Official Message", href: "/dashboard/user/official-message" },
                { label: "Send Unofficial Message", href: "/dashboard/user/message" },
                { label: "Bulk Messaging", href: "/dashboard/user/bulk-messaging" }
            ]
        },
        { label: "TEMPLATE", icon: Layout, href: "/dashboard/user/templates", color: "text-pink-500" },
        {
            label: "GOOGLE SHEET",
            icon: FileSpreadsheet,
            href: "#",
            hasSubmenu: true,
            color: "text-emerald-500",
            submenu: [
                { label: "Messaging", href: "/dashboard/user/google-sheet/messaging" },
                { label: "Trigger", href: "/dashboard/user/google-sheet/trigger" }
            ]
        },
        {
            label: "GROUPS",
            icon: Users,
            href: "#",
            hasSubmenu: true,
            color: "text-yellow-500",
            submenu: [
                { label: "Manage Groups", href: "/dashboard/user/groups/manager" },
                { label: "Broadcast", href: "/dashboard/user/groups/broadcast" }
            ]
        },
        { label: "MANAGE REPLIES", icon: MessageCircleReply, href: "/dashboard/user/manage-replies", color: "text-indigo-500" },
        {
            label: "REPORTS",
            icon: FileText,
            href: "#",
            hasSubmenu: true,
            color: "text-orange-500",
            submenu: [
                { label: "Delivery Reports", href: "/dashboard/user/reports/delivery-reports" },
                { label: "Schedule Reports", href: "/dashboard/user/reports/schedule-reports" }
            ]
        },
        { label: "API", icon: Code, href: "https://documenter.getpostman.com/view/1240173/2sB3B8stEM", color: "text-emerald-500" },
    ];

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-20", // Added flex flex-col to enable sticking footer
                collapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex-1 overflow-y-auto hide-scrollbar"> {/* Added flex-1 and overflow to scroll content, hide scrollbar utility might be needed or standard overflow */}
                <div className={cn("flex items-center mb-8 transition-all", collapsed ? "justify-center" : "gap-3")}>
                    <div className="relative w-8 h-8 shrink-0">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    {!collapsed && (
                        <h1 className="text-xl font-bold whitespace-nowrap overflow-hidden">Message API</h1>
                    )}
                    {!collapsed && (
                        <button onClick={toggleSidebar} className="ml-auto text-gray-400 hover:text-white p-1">
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Chevron Toggle when collapsed */}
                {collapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute left-[50%] -translate-x-[50%] top-20 text-gray-400 hover:text-white p-1"
                    >
                        <ChevronDown className="w-5 h-5 -rotate-90" />
                    </button>
                )}


                <nav className="flex flex-col space-y-2">
                    {menuItems.map((item, index) => (
                        <div key={index}>
                            <div
                                onClick={() => !collapsed && item.hasSubmenu ? toggleSubmenu(item.label) : null}
                                className={cn(
                                    "flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors group cursor-pointer",
                                    collapsed ? "justify-center" : "justify-between",
                                    item.hasSubmenu ? "select-none" : ""
                                )}
                                title={collapsed ? item.label : ''}
                            >
                                <Link
                                    href={item.href}
                                    target={item.href.startsWith("http") ? "_blank" : undefined}
                                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                    className={cn("flex items-center gap-3", collapsed ? "justify-center" : "flex-1")}
                                    onClick={(e) => {
                                        if (item.hasSubmenu) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <item.icon className={cn("w-5 h-5 transition-colors", item.color, "group-hover:text-white")} />
                                    {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                                </Link>
                                {!collapsed && item.hasSubmenu && (
                                    <ChevronDown
                                        className={cn("w-4 h-4 text-gray-500 transition-transform duration-200", openSubmenu === item.label ? "rotate-180" : "")}
                                    />
                                )}
                            </div>

                            {/* Submenu */}
                            {!collapsed && item.hasSubmenu && openSubmenu === item.label && item.submenu && (
                                <div className="ml-12 flex flex-col space-y-2 mt-1 mb-2">
                                    {item.submenu.map((subItem, subIndex) => (
                                        <Link
                                            key={subIndex}
                                            href={subItem.href}
                                            className="text-sm text-gray-400 hover:text-white transition-colors block py-1 whitespace-nowrap"
                                        >
                                            {subItem.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* User Profile & Sign Out Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
                {!collapsed ? (
                    <div className="space-y-4">
                        <Link href="/dashboard/user/profile" className="flex items-center gap-3 px-2 hover:bg-slate-800 rounded-md p-2 transition-colors cursor-pointer text-white">
                            <div className="h-9 w-9 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium">U</div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">User</p>
                                <p className="text-xs text-slate-400 truncate">ID: {userId || "..."}</p>
                            </div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 text-red-500 text-sm font-medium px-2 hover:bg-red-500/10 w-full p-2 rounded-md transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Link href="/dashboard/user/profile">
                            <div className="h-8 w-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer hover:opacity-80">U</div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="text-red-500 hover:bg-red-500/10 p-2 rounded-md"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
