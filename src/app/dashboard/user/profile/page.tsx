"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProfileHeader, ProfileStats, PersonalInfoSection, BusinessInfoSection, AccountDetailsSection, SecuritySettingsSection } from "@/components/profile/ProfileComponents"
import businessService, { BusinessProfile } from "@/services/businessService"
import { Loader2 } from "lucide-react"

export default function UserProfilePage() {
    const router = useRouter()
    const [data, setData] = useState<BusinessProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    router.push("/login")
                    return
                }

                const profileData = await businessService.getProfile(token)
                setData(profileData)
            } catch (err: any) {
                console.error("Failed to fetch profile", err)
                setError("Failed to load profile data.")
                if (err.response?.status === 401) {
                    router.push("/login")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-red-500">
                {error || "No profile data available."}
            </div>
        )
    }

    const handleUpdate = async (updatedData: any) => {
        const token = localStorage.getItem("token")
        if (!token) return
        const refreshed = await businessService.getProfile(token)
        setData(refreshed)
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* Header Section */}
            <ProfileHeader data={data} />

            {/* Stats Row */}
            <ProfileStats data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-8">
                    <PersonalInfoSection data={data} onUpdate={handleUpdate} />
                    <BusinessInfoSection data={data} onUpdate={handleUpdate} />
                </div>

                {/* Side Column */}
                <div className="space-y-6">
                    <AccountDetailsSection data={data} />
                    <SecuritySettingsSection />
                </div>
            </div>
        </div>
    )
}
