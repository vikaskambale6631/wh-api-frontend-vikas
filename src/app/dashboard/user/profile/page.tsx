"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProfileHeader, ProfileStats, InfoSection, InfoField, AccountPlanCard, SecurityCard } from "@/components/profile/ProfileComponents"
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

                // Fetch data using businessService (which uses proper API endpoints)
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

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* Header Section */}
            <ProfileHeader data={data} />

            {/* Stats Row */}
            <ProfileStats data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Personal Information */}
                    <InfoSection title="Personal Information">
                        <InfoField label="FULL NAME" value={data.profile.name} />
                        <InfoField label="EMAIL ADDRESS" value={data.profile.email} />
                        <InfoField label="USER ID" value={data.busi_user_id} fullWidth={true} />
                        <InfoField label="MOBILE NUMBER" value={data.profile.phone} />
                        <InfoField label="COUNTRY" value={"India"} /> {/* Hardcoded for now if not in API */}
                        <InfoField label="ADDRESS" value={data.address?.full_address || "Not provided"} fullWidth={true} />
                    </InfoSection>

                    <div className="border-t border-gray-100" />

                    {/* Business Information */}
                    <InfoSection title="Business Information">
                        <InfoField label="COMPANY NAME" value={data.business.business_name} />
                        <InfoField label="ORGANIZATION TYPE" value={data.business.business_name} /> {/* Assuming Org Type is same or not provided separately */}
                        <InfoField label="ERP TYPE" value={data.business.erp_system || "Other"} />
                        <InfoField label="BANK NAME" value={"IndusInd Bank"} /> {/* Hardcoded or need to add to DB schema later */}
                    </InfoSection>
                </div>

                {/* Side Column */}
                <div className="space-y-6">
                    <AccountPlanCard data={data} />
                    <SecurityCard />
                </div>
            </div>
        </div>
    )
}
