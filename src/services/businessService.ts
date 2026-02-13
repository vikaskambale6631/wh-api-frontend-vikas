import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/busi_users`; // Base URL for business users

export interface BusinessRegisterData {
    parent_reseller_id: string;
    role?: string;
    status?: string;
    whatsapp_mode?: string;
    profile: {
        name: string;
        username: string;
        email: string;
        phone: string;
        password: string;
    };
    business: {
        business_name: string;
        business_description?: string;
        erp_system?: string;
        gstin?: string;
    };
    address?: {
        full_address?: string;
        pincode?: string;
        country?: string;
    };
    wallet?: {
        credits_allocated: number;
    };
}

export interface BusinessLoginData {
    email: string;
    password: string;
}

export interface BusinessProfile {
    busi_user_id: string; // UUID serialized as string
    role: string;
    status: string;
    profile: {
        name: string;
        username: string;
        email: string;
        phone: string;
        created_at?: string;
    };
    business: {
        business_name: string;
        business_description?: string;
        erp_system?: string;
        gstin?: string;
    };
    wallet: {
        credits_allocated: number;
        credits_used: number;
        credits_remaining: number;
    };
    whatsapp_mode: string;
    address?: {
        full_address?: string;
        pincode?: string;
        country?: string;
    };
}

export const businessService = {
    // Register a new business (Called by Reseller)
    register: async (data: BusinessRegisterData, token: string) => {
        const response = await axios.post(`${API_URL}/register`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Login as a Business User
    login: async (data: BusinessLoginData) => {
        const response = await axios.post(`${API_URL}/login`, data);
        return response.data;
    },

    // Get Current Business User Profile
    getProfile: async (token: string) => {
        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get all businesses for a reseller (Called by Reseller)
    getBusinessesByReseller: async (resellerId: string, token: string) => {
        const response = await axios.get(`${API_URL}/reseller/${resellerId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default businessService;
