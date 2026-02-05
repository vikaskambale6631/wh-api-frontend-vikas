import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Helper to get headers
const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        (JSON.parse(localStorage.getItem('user') || '{}').token);
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export interface InboxMessage {
    id: string;
    device_id: string;
    phone_number: string;
    incoming_message: string;
    incoming_time: string;
    is_replied: boolean;
    reply_message?: string;
    reply_time?: string;
    device_name?: string;
    is_incoming?: boolean;
    unread?: boolean;
}

export const replyService = {
    getInbox: async (): Promise<InboxMessage[]> => {
        const response = await axios.get(`${API_URL}/replies`, { headers: getAuthHeaders() });
        // Handle wrapper object { success: true, data: [...] }
        return response.data.data || response.data;
    },

    sendReply: async (messageId: string, text: string) => {
        const response = await axios.post(`${API_URL}/replies/send`,
            { message_id: messageId, reply_text: text },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    markAsRead: async (phoneNumber: string) => {
        const response = await axios.post(`${API_URL}/replies/mark-read`,
            { phone_number: phoneNumber },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    // --- Quick Replies ---
    getQuickReplies: async (): Promise<QuickReply[]> => {
        const response = await axios.get(`${API_URL}/quick-replies`, { headers: getAuthHeaders() });
        return response.data;
    },

    createQuickReply: async (shortcut: string, text: string): Promise<QuickReply> => {
        const response = await axios.post(`${API_URL}/quick-replies`,
            { shortcut, text },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    deleteQuickReply: async (id: string) => {
        await axios.delete(`${API_URL}/quick-replies/${id}`, { headers: getAuthHeaders() });
    }
};

export interface QuickReply {
    id: string;
    shortcut: string;
    text: string;
}
