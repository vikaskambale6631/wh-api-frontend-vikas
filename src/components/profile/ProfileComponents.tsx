import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ShieldCheck, History } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import resellerService from "@/services/resellerService"
import { BusinessProfile } from "@/services/businessService"

interface ProfileProps {
    data: BusinessProfile | null;
}

export function ProfileHeader({ data }: ProfileProps) {
    if (!data) return null;

    // Get initials
    const name = data.profile.name || data.profile.username || "User";
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="flex items-start justify-between">
            <div className="flex gap-4">
                <div className="relative">
                    <Avatar className="h-16 w-16 bg-blue-600 text-white">
                        <AvatarFallback className="text-xl font-medium bg-blue-600">{initials}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${data.whatsapp_mode === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`border-opacity-50 ${data.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                            {data.status || 'Disconnected'}
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-50 font-normal">{data.role === 'business_owner' ? 'User' : data.role}</Badge>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500">Member since</p>
                <p className="text-sm font-medium text-gray-900">Mar 26, 2024</p>
            </div>
        </div>
    )
}

export function ProfileStats({ data }: ProfileProps) {
    if (!data) return null;

    return (
        <div className="grid grid-cols-4 gap-8 py-6 border-t border-b border-gray-100">
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">TOTAL CREDITS</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{data.wallet.credits_allocated.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">USED CREDITS</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{data.wallet.credits_used.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">REMAINING</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{data.wallet.credits_remaining.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">BALANCE</p>
                <p className="text-2xl font-bold text-orange-500 mt-1">₹0</p>
            </div>
        </div>
    )
}

export function InfoSection({ title, children, showEdit = true }: { title: string, children: React.ReactNode, showEdit?: boolean }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserIcon title={title} />
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
                {showEdit && <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Edit</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {children}
            </div>
        </div>
    )
}

function UserIcon({ title }: { title: string }) {
    if (title.includes("Personal")) return <div className="p-1 rounded bg-blue-50 text-blue-600"><CheckCircle2 className="h-4 w-4" /></div>
    if (title.includes("Business")) return <div className="p-1 rounded bg-blue-50 text-blue-600"><CheckCircle2 className="h-4 w-4" /></div> // Using check icon for business too as per generic 'icon' request or similar
    return null
}

export function InfoField({ label, value, fullWidth = false }: { label: string, value: string, fullWidth?: boolean }) {
    return (
        <div className={fullWidth ? "col-span-2" : ""}>
            <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
            <p className={`mt-1 text-sm font-medium ${value === "Not provided" || value === "Other" ? "text-gray-900 italic" : "text-gray-900"}`}>{value}</p>
            {fullWidth && <div className="mt-2" />} {/* Spacing fix for full width items if needed */}
        </div>
    )
}

export function AccountPlanCard({ data }: ProfileProps) {
    if (!data) return null;

    return (
        <Card className="bg-white border text-card-foreground shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base font-semibold">Account Plan</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">PLAN TYPE</p>
                    <p className="text-lg font-bold">MAP 8A</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">USER TYPE</p>
                    <p className="text-base font-medium capitalize">{data.role === 'business_owner' ? 'User' : data.role.replace('_', ' ')}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">EXPIRY DATE</p>
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                        <History className="h-4 w-4" />
                        <span>UNLIMITED</span>
                    </div>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">USERNAME</p>
                    <p className="text-sm font-medium break-all">{data.profile.username}</p>
                </div>
            </CardContent>
        </Card>
    )
}

export function SecurityCard() {
    const [isEditing, setIsEditing] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleChangePassword = async () => {
        setMessage(null);
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: "All fields are required" });
            return;
        }

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: "New password must be at least 8 characters" });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "New passwords do not match" });
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Not authenticated");

            await resellerService.changePassword(token, {
                current_password: currentPassword,
                new_password: newPassword
            });

            setMessage({ type: 'success', text: "Password updated successfully" });

            // Allow user to see success message before resetting or closing
            setTimeout(() => {
                setIsEditing(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setMessage(null);
            }, 2000);

        } catch (error: any) {
            console.error("Change password error:", error);
            const errorMsg = error.response?.data?.detail || "Failed to update password";
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base font-semibold">Security</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                {!isEditing ? (
                    <>
                        <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                            <History className="h-6 w-6 text-blue-600 rotate-180" />
                        </div>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            Keep your account secure by updating your password regularly.
                        </p>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            onClick={() => setIsEditing(true)}
                        >
                            Change Password
                        </Button>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">CURRENT PASSWORD</p>
                            <div className="bg-white p-2 rounded border flex gap-1 justify-between tracking-widest text-lg h-10 items-center overflow-hidden">
                                ••••••••••••
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        {message && (
                            <div className={`text-sm p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Current Password</label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 8 characters"
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Confirm Password</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Retype new password"
                                className="bg-white"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleChangePassword}
                                disabled={isLoading}
                            >
                                {isLoading ? "Updating..." : "Update"}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setIsEditing(false);
                                    setMessage(null);
                                    setCurrentPassword("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
