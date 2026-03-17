import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ShieldCheck, History, User, Building2, Layout, Lock, Save, X, Loader2 } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import resellerService from "@/services/resellerService"
import { cn } from "@/lib/utils"

interface ProfileProps {
    data: any | null;
    onUpdate?: (updatedData: any) => Promise<void>;
}

export function ProfileHeader({ data }: { data: any }) {
    if (!data) return null;

    const name = data.profile?.name || data.profile?.username || "User";
    const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className="h-16 w-16 bg-blue-600 text-white shadow-lg">
                        <AvatarFallback className="text-xl font-bold bg-blue-600">{initials}</AvatarFallback>
                    </Avatar>
                    <span className={cn(
                        "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white shadow-sm",
                        data.whatsapp_mode === 'active' ? "bg-green-500" : "bg-red-500"
                    )} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-gray-900 capitalize tracking-tight">{name}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-1.5 py-0.5 rounded tracking-widest">{data.status || 'active'}</span>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{data.role === 'business_owner' ? 'reseller' : data.role}</span>
                    </div>
                </div>
            </div>
            <div className="text-right flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Member since</span>
                <span className="text-sm font-black text-gray-900">Mar 26, 2024</span>
            </div>
        </div>
    )
}

export function ProfileStats({ data }: { data: any }) {
    if (!data) return null;

    const stats = [
        { label: "TOTAL CREDITS", value: data.wallet?.credits_allocated || 0, color: "bg-blue-600" },
        { label: "USED CREDITS", value: data.wallet?.credits_used || 0, color: "bg-purple-600" },
        { label: "REMAINING CREDITS", value: data.wallet?.credits_remaining || 0, color: "bg-emerald-600" },
        { label: "WALLET BALANCE", value: "₹0", color: "bg-orange-600", isCurrency: true }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
            {stats.map((stat, i) => (
                <div key={i} className={cn("rounded-lg p-3 text-white shadow-md flex flex-col justify-center h-20", stat.color)}>
                    <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-xl font-black mt-0.5">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

export function PersonalInfoSection({ data, onUpdate }: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: data?.profile?.name || "",
        email: data?.profile?.email || "",
        phone: data?.profile?.phone || "",
        country: data?.address?.country || "",
        full_address: data?.address?.full_address || ""
    });

    const handleSave = async () => {
        if (!onUpdate) return;
        setLoading(true);
        try {
            await onUpdate({
                profile: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    username: data?.profile?.username // Keeping existing username
                },
                address: {
                    country: formData.country,
                    full_address: formData.full_address
                }
            });
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-4 border-b border-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                        <User className="h-5 w-5" />
                        <CardTitle className="text-base font-bold text-gray-800">Personal Information</CardTitle>
                    </div>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <Button 
                                variant="ghost" size="sm" 
                                className="text-green-600 font-bold h-7 px-2 hover:bg-green-50"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                Save
                            </Button>
                            <Button 
                                variant="ghost" size="sm" 
                                className="text-red-500 font-bold h-7 px-2 hover:bg-red-50"
                                onClick={() => setIsEditing(false)}
                                disabled={loading}
                            >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            variant="ghost" size="sm" 
                            className="text-blue-600 font-bold h-7 px-3"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-y-6 gap-x-8">
                {isEditing ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FULL NAME</label>
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">EMAIL ADDRESS</label>
                            <Input 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">USER ID</label>
                            <Input value={data?.id || "N/A"} disabled className="h-9 font-bold text-sm bg-gray-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MOBILE NUMBER</label>
                            <Input 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">COUNTRY</label>
                            <Input 
                                value={formData.country} 
                                onChange={(e) => setFormData({...formData, country: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ADDRESS</label>
                            <Input 
                                value={formData.full_address} 
                                onChange={(e) => setFormData({...formData, full_address: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <InfoItem label="FULL NAME" value={data?.profile?.name || "N/A"} />
                        <InfoItem label="EMAIL ADDRESS" value={data?.profile?.email || "N/A"} />
                        <InfoItem label="USER ID" value={data?.id || "N/A"} fullWidth />
                        <InfoItem label="MOBILE NUMBER" value={data?.profile?.phone || "N/A"} />
                        <InfoItem label="COUNTRY" value={data?.address?.country || "Not specified"} />
                        <InfoItem label="ADDRESS" value={data?.address?.full_address || "Not specified"} fullWidth />
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export function BusinessInfoSection({ data, onUpdate }: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        business_name: data?.business?.business_name || "",
        organization_type: data?.business?.organization_type || "",
        erp_system: data?.business?.erp_system || "",
        bank_name: data?.bank?.bank_name || ""
    });

    const handleSave = async () => {
        if (!onUpdate) return;
        setLoading(true);
        try {
            await onUpdate({
                business: {
                    business_name: formData.business_name,
                    organization_type: formData.organization_type,
                    erp_system: formData.erp_system
                },
                bank: {
                    bank_name: formData.bank_name
                }
            });
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-4 border-b border-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Building2 className="h-5 w-5" />
                        <CardTitle className="text-base font-bold text-gray-800">Business Information</CardTitle>
                    </div>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <Button 
                                variant="ghost" size="sm" 
                                className="text-green-600 font-bold h-7 px-2 hover:bg-green-50"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                Save
                            </Button>
                            <Button 
                                variant="ghost" size="sm" 
                                className="text-red-500 font-bold h-7 px-2 hover:bg-red-50"
                                onClick={() => setIsEditing(false)}
                                disabled={loading}
                            >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            variant="ghost" size="sm" 
                            className="text-blue-600 font-bold h-7 px-3"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-y-6 gap-x-8">
                {isEditing ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">COMPANY NAME</label>
                            <Input 
                                value={formData.business_name} 
                                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ORGANIZATION TYPE</label>
                            <Input 
                                value={formData.organization_type} 
                                onChange={(e) => setFormData({...formData, organization_type: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ERP TYPE</label>
                            <Input 
                                value={formData.erp_system} 
                                onChange={(e) => setFormData({...formData, erp_system: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BANK NAME</label>
                            <Input 
                                value={formData.bank_name} 
                                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                                className="h-9 font-bold text-sm"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <InfoItem label="COMPANY NAME" value={data?.business?.business_name || "Not provided"} />
                        <InfoItem label="ORGANIZATION TYPE" value={data?.business?.organization_type || "Not provided"} />
                        <InfoItem label="ERP TYPE" value={data?.business?.erp_system || "Not provided"} />
                        <InfoItem label="BANK NAME" value={data?.bank?.bank_name || "Not provided"} />
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export function AccountDetailsSection({ data }: { data: any }) {
    return (
        <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-4 border-b border-gray-50">
                <div className="flex items-center gap-2 text-blue-600">
                    <Layout className="h-5 w-5" />
                    <CardTitle className="text-base font-bold text-gray-800">Account Details</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <InfoItem label="PLAN TYPE" value="MAP 8A" />
                <InfoItem label="USER TYPE" value={data?.role || "reseller"} />
                <InfoItem label="EXPIRY DATE" value="UNLIMITED" isDynamic />
                <InfoItem label="USERNAME" value={data?.profile?.username || "N/A"} />
                <InfoItem label="CURRENT PASSWORD" value="••••••••••••" />
            </CardContent>
        </Card>
    )
}

export function SecuritySettingsSection() {
    return (
        <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-4 border-b border-gray-50">
                <div className="flex items-center gap-2 text-blue-600">
                    <Lock className="h-5 w-5" />
                    <CardTitle className="text-base font-bold text-gray-800">Security Settings</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                <div className="p-4 bg-gray-50 rounded-full border border-gray-100">
                    <ShieldCheck className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 font-medium max-w-[200px]">Keep your account secure by updating your password regularly.</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md">Change Password</Button>
            </CardContent>
        </Card>
    )
}

function InfoItem({ label, value, fullWidth = false, isDynamic = false }: { label: string, value: string, fullWidth?: boolean, isDynamic?: boolean }) {
    return (
        <div className={cn("flex flex-col gap-1", fullWidth ? "col-span-2" : "")}>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className={cn(
                "text-sm font-bold text-gray-800",
                isDynamic && "text-emerald-600 font-black"
            )}>
                {value}
            </span>
        </div>
    )
}
