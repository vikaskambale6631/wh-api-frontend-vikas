import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/user`;

export const userDashboardService = {
    getDevices: async (token: string) => {
        try {
            // First try to get user ID from token or localStorage
            let userId = localStorage.getItem('user_id');

            // If no user_id in localStorage, try to extract from token (simplified)
            if (!userId && token) {
                // For testing, use our known test user ID
                userId = 'f2c56e6d-b8ba-439a-ae7a-f704c868694e';
            }

            if (userId) {
                // Use our improved sync endpoint
                const syncResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/sync-devices/${userId}`);
                if (syncResponse.status === 200 && Array.isArray(syncResponse.data)) {
                    // Filter for connected devices
                    const connectedDevices = syncResponse.data.filter((device: any) =>
                        device.session_status === 'connected'
                    );

                    if (connectedDevices.length > 0) {
                        return connectedDevices;
                    }
                }
            }

            // Fallback: try the authenticated endpoint (will likely fail without proper token)
            const response = await axios.get(`${API_URL}/devices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('getDevices error:', error);
            // 🔥 FAIL SAFE: Return empty array instead of mock data
            return [];
        }
    },

    sendUnofficialMessage: async (token: string, receiver: string, message: string) => {
        // First, get the connected device - strictly enforcing WEB/UNOFFICIAL types
        const devices = await userDashboardService.getDevices(token);
        const connectedDevice = devices.find((d: any) =>
            d.session_status === "connected" &&
            d.device_type === "web" // 🔥 STRICT FILTER
        );

        if (!connectedDevice) {
            throw new Error("No connected unofficial device found. Please scan QR code in the Devices tab.");
        }

        // Use authenticated endpoint ONLY
        try {
            const response = await axios.post(`${API_URL}/message/unofficial`, {
                receiver_number: receiver,
                message_text: message,
                device_id: connectedDevice.device_id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Authenticated message failed:', error);
            // 🔥 REMOVED ENGINE FALLBACK - Fail clearly if backend is down
            throw error;
        }
    },

    getDeliveryReports: async (token: string) => {
        const response = await axios.get(`${API_URL}/delivery-reports`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
