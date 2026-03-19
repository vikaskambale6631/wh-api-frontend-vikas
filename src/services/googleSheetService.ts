import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

// Ensure this matches your backend URL.
// IMPORTANT: If you are running physically on a device, localhost won't work.
const API_URL = API_BASE_URL;

// Helper to get headers with token
const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {}; // Server-side safety

    // Try multiple keys for robustness
    const token = localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        (JSON.parse(localStorage.getItem('user') || '{}').token);

    if (!token) {
        console.warn('GoogleSheetService: No auth token found in localStorage');
        // Optionally redirect to login here if strictly needed, but better to let API fail with 401
    }

    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Create a configured instance (optional but good for consistency)
const api = axios.create({
    baseURL: API_URL,
    timeout: 120000, // Increased to 120s for long-running manual sends
});

// Add interceptor to inject token on every request
api.interceptors.request.use(config => {
    const headers = getAuthHeaders();
    config.headers.Authorization = headers.Authorization;
    config.headers['Content-Type'] = 'application/json';
    return config;
}, error => Promise.reject(error));

// Add response interceptor for debugging and better error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);

            // Extract meaningful error message from backend
            let errorMessage = 'Unknown error occurred';
            if (error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
            }

            // Attach the extracted message to the error for frontend components
            error.userMessage = errorMessage;

            // Handle 401
            if (error.response.status === 401) {
                console.error('Unauthorized access. Token may be expired.');
                // window.location.href = '/login'; // Optional: Auto-redirect
            }
        } else if (error.request) {
            console.error('Network Error (No Response):', error.request);
            error.userMessage = 'Network error - please check your connection';
        } else {
            console.error('Error Setup:', error.message);
            error.userMessage = 'Request setup failed';
        }
        return Promise.reject(error);
    }
);

export interface GoogleSheet {
    id: string; // UUID serialized as string in JSON
    sheet_name: string;
    spreadsheet_id: string;
    worksheet_name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    total_rows: number;
    connected_at: string; // ISO datetime string
    last_synced_at?: string; // ISO datetime string or null
    trigger_enabled: boolean;
    trigger_config?: any;
    user_id?: string | null; // UUID serialized as string or null
    message_template?: string | null;
    created_at?: string | null; // ISO datetime string or null
    updated_at?: string | null; // ISO datetime string or null
    available_sheets?: string[]; // Array of available sheet names
}

export interface TriggerHistory {
    id: string; // UUID serialized as string in JSON
    sheet_id: string; // UUID serialized as string in JSON
    phone_number: string;
    message_content: string;
    status: string;
    triggered_at: string; // ISO datetime string
    error_message?: string | null;
    row_data?: any;
    official_message_id?: string;
}

export const googleSheetService = {
    listSheets: async () => {
        const response = await api.get<GoogleSheet[]>('/google-sheets/');
        return response.data;
    },

    connectSheet: async (data: { sheet_name: string, spreadsheet_id: string, worksheet_name?: string }) => {
        const response = await api.post<GoogleSheet>('/google-sheets/connect', data);
        return response.data;
    },

    deleteSheet: async (sheetId: string) => {
        const response = await api.delete(`/google-sheets/${sheetId}`);
        return response.data;
    },

    fetchRows: async (sheetId: string, worksheetName?: string) => {
        const params = worksheetName ? { worksheet_name: worksheetName } : {};
        const response = await api.get<{ headers: string[], rows: any[] }>(`/google-sheets/${sheetId}/rows`, { params });
        return response.data;
    },

    setTrigger: async (sheetId: string, data: {
        trigger_type: string;
        is_enabled: boolean;
        message_template?: string;
        phone_column?: string;
        trigger_column?: string;
        status_column?: string;
        trigger_value?: string;
        schedule_column?: string;
        webhook_url?: string;
        execution_interval?: number;
        send_time_column?: string;
        message_column?: string;
        device_id?: string;
    }) => {
        const payload = {
            sheet_id: sheetId, // Add required sheet_id field
            ...data
        };
        const response = await api.post(`/google-sheets/${sheetId}/triggers`, payload);
        return response.data;
    },

    listTriggers: async (sheetId: string) => {
        const response = await api.get(`/google-sheets/${sheetId}/triggers`);
        return response.data;
    },

    startTrigger: async (triggerId: string) => {
        const response = await api.post(`/google-sheets/triggers/${triggerId}/start`);
        return response.data;
    },

    stopTrigger: async (triggerId: string) => {
        const response = await api.post(`/google-sheets/triggers/${triggerId}/stop`);
        return response.data;
    },

    deleteTrigger: async (triggerId: string) => {
        const response = await api.delete(`/google-sheets/triggers/${triggerId}`);
        return response.data;
    },

    getTriggerHistory: async (sheetId: string) => {
        try {
            // The backend returns a direct array: List[Dict]
            const response = await api.get<TriggerHistory[]>(`/google-sheets/${sheetId}/history`);

            // Check if response.data is directly the array
            if (Array.isArray(response.data)) {
                return response.data;
            }

            // Legacy/Fallback check if it's wrapped (unlikely given current backend, but safe to keep)
            const wrapped = response.data as any;
            if (wrapped && Array.isArray(wrapped.data)) {
                return wrapped.data;
            }

            console.warn('Unexpected API response structure for trigger history:', response.data);
            return [];
        } catch (error) {
            console.error('Failed to fetch trigger history:', error);
            return [];
        }
    },


    getAllTriggerHistory: async () => {
        try {
            const response = await api.get<{ data: TriggerHistory[], success: boolean }>('/google-sheets/triggers/history');
            return response.data.data || [];
        } catch (error) {
            console.error('Failed to fetch all trigger history:', error);
            return [];
        }
    },

    manualSend: async (data: {
        template_name?: string;
        language_code?: string;
        phone_column: string;
        header_param_columns?: string[];
        body_param_columns?: string[];
        button_param_columns?: { [key: string]: string };
        selected_rows?: any[];
        sheet_id: string;
        send_all?: boolean;
    }) => {
        const response = await api.post(`/google-sheets/${data.sheet_id}/manual-send`, data);
        return response.data;
    },

    // ✅ NEW: Official Template Messaging Methods
    getTemplates: async (sheetId: string) => {
        const response = await api.get(`/google-sheets/${sheetId}/templates`);
        return response.data;
    },

    sendOfficialTemplate: async (sheetId: string, data: {
        template_name: string;
        language_code?: string;
        phone_column: string;
        header_param_columns?: string[];
        body_param_columns?: string[];
        button_param_columns?: { [key: string]: string };
        selected_rows?: any[];
        send_all?: boolean;
    }) => {
        const response = await api.post(`/google-sheets/${sheetId}/official-template-send`, data);
        return response.data;
    },

    createOfficialTemplateTrigger: async (sheetId: string, data: {
        trigger_type: string;
        is_enabled?: boolean;
        template_name: string;
        language_code?: string;
        phone_column?: string;
        header_param_columns?: string[];
        body_param_columns?: string[];
        button_param_columns?: { [key: string]: string };
        trigger_column?: string;
        trigger_value?: string;
        status_column?: string;
        schedule_column?: string;
        webhook_url?: string;
        execution_interval?: number;
    }) => {
        const response = await api.post(`/google-sheets/${sheetId}/official-template-triggers`, data);
        return response.data;
    },

    // ✅ NEW: Google Sheet Messaging (supports both text and template)
    sendGoogleSheetMessage: async (sheetId: string, data: {
        mode: 'text' | 'template';
        phone_column: string;
        text_message?: string;
        template_name?: string;
        language_code?: string;
        header_param_columns?: string[];
        body_param_columns?: string[];
        button_param_columns?: { [key: string]: string };
        selected_rows?: any[];
        send_all?: boolean;
    }) => {
        const response = await api.post(`/google-sheets/${sheetId}/messaging`, data);
        return response.data;
    },

    // ✅ NEW: Get Official Config Status
    getOfficialConfigStatus: async () => {
        const response = await api.get('/google-sheets/official-config/status');
        return response.data;
    },

    // ✅ NEW: Verify available worksheets for a connected sheet
    getAvailableWorksheets: async (sheetId: string) => {
        const response = await api.get<string[]>(`/google-sheets/${sheetId}/worksheets`);
        return response.data;
    },

    // ✅ NEW: Trigger Polling Control
    getPollingStatus: async () => {
        const response = await api.get<{ is_running: boolean, status: string }>('/google-sheets/triggers/polling/status');
        return response.data;
    },

    startPolling: async (interval: number = 30) => {
        const response = await api.post('/google-sheets/triggers/polling/start', null, { params: { interval } });
        return response.data;
    },

    stopPolling: async () => {
        const response = await api.post('/google-sheets/triggers/polling/stop');
        return response.data;
    },

    fireTriggersNow: async () => {
        const response = await api.post('/google-sheets/triggers/polling/fire-now');
        return response.data;
    }
};
