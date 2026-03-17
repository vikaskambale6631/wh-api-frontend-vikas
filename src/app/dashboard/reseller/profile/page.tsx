"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
    ProfileHeader, 
    ProfileStats, 
    PersonalInfoSection, 
    BusinessInfoSection, 
    AccountDetailsSection, 
    SecuritySettingsSection 
} from "@/components/profile/ProfileComponents"
import resellerService from "@/services/resellerService"
import { Loader2 } from "lucide-react"

export default function ResellerProfilePage() {
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
            if (!token) {
                router.push("/login")
                return
            }

            const profileData = await resellerService.getProfile(token)

            const mappedData = {
                ...profileData,
                wallet: {
                    credits_allocated: profileData.wallet?.total_credits || 0,
                    credits_used: profileData.wallet?.used_credits || 0,
                    credits_remaining: profileData.wallet?.available_credits || 0
                },
                business: profileData.business || { business_name: null, organization_type: null, erp_system: null },
                profile: profileData.profile || {},
                address: profileData.address || {},
                bank: profileData.bank || { bank_name: null },
                whatsapp_mode: "active",
                id: profileData.reseller_id // Backend returns reseller_id
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

    useEffect(() => {
        fetchProfile()
    }, [router])

    const handleUpdate = async (updatedFields: any) => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
            if (!token) return;

            await resellerService.updateProfile(token, updatedFields);
            // Refresh data after update
            await fetchProfile();
        } catch (err) {
            console.error("Update failed:", err);
            throw err;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] text-red-500 font-bold">
                {error || "No profile data found."}
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6 bg-gray-50/20 min-h-screen">
            {/* Header Section */}
            <ProfileHeader data={data} />

            {/* Stats Row */}
            <ProfileStats data={data} />

            {/* Main Content Grid - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PersonalInfoSection data={data} onUpdate={handleUpdate} />
                <BusinessInfoSection data={data} onUpdate={handleUpdate} />
                <AccountDetailsSection data={data} />
                <SecuritySettingsSection />
            </div>
        </div>
    )
}
