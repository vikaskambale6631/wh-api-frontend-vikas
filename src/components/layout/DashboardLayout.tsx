"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { UserSidebar } from "@/components/layout/UserSidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    // Determine which sidebar to show based on URL
    const isUserDashboard = pathname.startsWith("/dashboard/user")

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed)
    }

    // Role-based protection and redirection
    useEffect(() => {
        const role = localStorage.getItem("user_role")
        const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")

        if (!token) {
            router.push("/login")
            return
        }

        // If no role but on dashboard, maybe let it load or redirect to a default
        if (!role) return;

        const normalizedRole = role.toLowerCase();

        if (normalizedRole === 'reseller' && pathname.startsWith("/dashboard/user")) {
            router.push("/dashboard/reseller/analytics")
        } else if (normalizedRole === 'user' || normalizedRole === 'business_owner') {
            // If we are on reseller pages but are a user, redirect
            if (pathname.startsWith("/dashboard/reseller")) {
                router.push("/dashboard/user")
            }
        }
    }, [pathname, router])

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {isUserDashboard ? (
                <UserSidebar collapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            ) : (
                <Sidebar collapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            )}

            <main
                className={`flex-1 p-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed
                    ? (isUserDashboard ? "ml-20" : "ml-16")
                    : "ml-64"
                    }`}
            >
                {children}
            </main>
        </div>
    )
}
