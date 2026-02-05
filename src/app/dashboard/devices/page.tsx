"use client";

import DeviceList from "@/components/DeviceList";

// In a real app, this should come from Auth Context
// For now, hardcoding a dummy or "current" user ID for demonstration
// The user previously mentioned login failures, so I will add a Note.
const TEST_USER_ID = "test-user-id";

export default function DevicesPage() {
    // You should replace TEST_USER_ID with real user ID from your AuthContext
    // const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
                    <p className="mt-2 text-gray-600">Manage your connected WhatsApp devices and sessions.</p>
                </div>

                <DeviceList userId={TEST_USER_ID} />
            </div>
        </div>
    );
}
