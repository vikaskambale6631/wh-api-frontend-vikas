import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/audit-logs`;

export interface PerformedBy {
    id: string;
    name: string;
    role: string;
}

export interface AffectedUser {
    id?: string;
    name?: string;
    email?: string;
}

export interface FieldUpdate {
    field: string;
    previousValue?: string;
    newValue?: string;
}

export interface AuditLog {
    id: string;
    reseller_id?: string;
    performed_by: PerformedBy;
    affected_user?: AffectedUser;
    action_type: string;
    module: string;
    description?: string;
    changes_made?: string[] | FieldUpdate[];
    ip_address?: string;
    created_at: string;
}

export interface AuditLogResponse {
    total: number;
    filtered: number;
    last_activity_days_ago?: number;
    logs: AuditLog[];
}

export interface AuditLogFilters {
    module?: string;
    action?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}

// Helper to get auth header
const getAuthHeader = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const auditLogService = {
    async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
        try {
            const params = new URLSearchParams();
            if (filters.module) params.append('module', filters.module);
            if (filters.action) params.append('action', filters.action);
            if (filters.search) params.append('search', filters.search);
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
            if (filters.limit !== undefined) params.append('limit', filters.limit.toString());

            const response = await axios.get(`${API_URL}/me?${params.toString()}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error: any) {
            console.error('Audit log service error:', error);
            
            // Handle expired tokens specifically
            if (error.response?.status === 401) {
                const errorMessage = error.response?.data?.detail || 'Token has expired. Please log in again.';
                
                if (errorMessage.includes('expired')) {
                    // Clear expired tokens from localStorage
                    localStorage.removeItem('token');
                    localStorage.removeItem('resellerToken');
                    console.warn('Expired tokens cleared from localStorage');
                }
                
                throw new Error(errorMessage);
            }
            
            throw new Error(error.response?.data?.detail || 'Failed to load audit logs');
        }
    }
};
