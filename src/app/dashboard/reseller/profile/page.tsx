"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProfileHeader, ProfileStats, InfoSection, InfoField, AccountPlanCard, SecurityCard } from "@/components/profile/ProfileComponents"
import resellerService, { ResellerProfile } from "@/services/resellerService" // Assuming types are exported from here
import { Loader2 } from "lucide-react"

// Create a local interface that matches what ProfileComponents expects if needed, 
// or just map on the fly. ProfileComponents expects 'BusinessProfile' structure mostly.
// We'll map the reseller data to a similar structure to reuse components.

export default function ResellerProfilePage() {
    const router = useRouter()
    const [data, setData] = useState<any>(null) // Using any for now to facilitate mapping flexibility
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
                if (!token) {
                    router.push("/login")
                    return
                }

                // Fetch data using resellerService
                const profileData = await resellerService.getProfile(token)

                // Construct a data object that ProfileComponents can consume
                // ProfileComponents expects: { profile: {name, ...}, business: {...}, wallet: {...}, role: string, status: string, whatsapp_mode: string }
                // Reseller data structure from service might be different. 
                // Based on previous file read, ResellerProfile has: name, username, email, phone.
                // We might need to mock or fetch missing fields like wallet to reuse the UI strictly.

                // Correctly mapping backend response to the structure expected by generic ProfileComponents
                const mappedData = {
                    ...profileData, // Contains role, status, user_id, profile{}, business{}, etc.

                    // Normalize wallet to expected keys
                    wallet: {
                        credits_allocated: profileData.wallet?.total_credits || 0,
                        credits_used: profileData.wallet?.used_credits || 0,
                        credits_remaining: profileData.wallet?.available_credits || 0
                    },

                    // Fallbacks for critical nested objects provided by API
                    // If API response already has them, these lines just ensure they aren't null
                    business: profileData.business || { business_name: "N/A" },
                    profile: profileData.profile || {},
                    address: profileData.address || {},
                    bank: profileData.bank || {},

                    // UI-specific fields not in backend
                    whatsapp_mode: "active",
                    id: profileData.user_id // Ensure ID is accessible at top level if needed specific way
                }

                setData(mappedData)
            } catch (err: any) {
                console.error("Failed to fetch reseller profile", err)
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
            {/* Resellers might have different stats, but reusing for now per screenshot request */}
            <ProfileStats data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Personal Information */}
                    <InfoSection title="Personal Information">
                        <InfoField label="FULL NAME" value={data.profile.name} />
                        <InfoField label="EMAIL ADDRESS" value={data.profile.email} />
                        <InfoField label="USER ID" value={data.id || "N/A"} fullWidth={true} />
                        <InfoField label="MOBILE NUMBER" value={data.profile.phone} />
                        {/* Reseller might not have addressed stored in same way */}
                        <InfoField label="COUNTRY" value={data.address?.country || "Not provided"} />
                        <InfoField label="ADDRESS" value={data.address?.full_address || "Not provided"} fullWidth={true} />
                    </InfoSection>

                    <div className="border-t border-gray-100" />

                    {/* Business Information */}
                    <InfoSection title="Business Information">
                        {/* Checking if reseller has business info, otherwise show N/A or defaults */}
                        <InfoField label="COMPANY NAME" value={data.business?.business_name || "N/A"} />
                        <InfoField label="ORGANIZATION TYPE" value={data.business?.business_name || "N/A"} />
                        <InfoField label="ERP TYPE" value={data.business?.erp_system || "N/A"} />
                        <InfoField label="BANK NAME" value={data.bank?.bank_name || "N/A"} />
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
