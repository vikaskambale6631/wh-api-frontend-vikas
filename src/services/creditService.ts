import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface CreditDistribution {
    distribution_id: string;
    from_reseller_id: string;
    to_business_user_id: string;
    credits_shared: number;
    shared_at: string;
    created_at: string;
    from_reseller_name?: string;
    to_business_name?: string;
}

export interface CreditDistributionCreate {
    to_business_user_id: string;
    credits_shared: number;
}

const creditService = {
    distributeCredits: async (data: CreditDistributionCreate, token: string) => {
        const response = await axios.post(
            `${API_URL}/credits/distribute`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    },

    getResellerHistory: async (reseller_id: string, token: string, skip = 0, limit = 100) => {
        const response = await axios.get(
            `${API_URL}/credits/history/reseller`,
            {
                params: {
                    skip,
                    limit
                    // reseller_id is inferred from token usually, but our API spec has it as param for some routes?
                    // Checking backend: API uses `get_current_reseller_id` dependency, so token is enough.
                    // Wait, the API route definition:
                    // @router.get("/history/reseller", ...)
                    // It uses dependency for reseller_id. It does NOT take reseller_id as path/query param for the route itself?
                    // Let's re-read backend code.
                    // Backend: `async def get_reseller_history(..., reseller_id: uuid.UUID = Depends(get_current_reseller_id))`
                    // This means `reseller_id` comes from Token.
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    },

    getBusinessHistory: async (business_id: string, token: string, skip = 0, limit = 100) => {
        const response = await axios.get(
            `${API_URL}/credits/history/business/${business_id}`,
            {
                params: { skip, limit },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    },

    getResellerTotalDistributed: async (reseller_id: string, token: string) => {
        const response = await axios.get(
            `${API_URL}/credits/reseller/${reseller_id}/total`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    },

    getBusinessTotalReceived: async (business_id: string, token: string) => {
        const response = await axios.get(
            `${API_URL}/credits/business/${business_id}/total`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    },

    // Helper to get business users for dropdown
    getMyBusinessUsers: async (token: string) => {
        // Reuse business service or call here
        const response = await axios.get(
            `${API_URL}/busi_users/my-users`,
            {
                params: { limit: 1000 },
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    },

    getMessageCreditUsage: async (token: string, params: { skip?: number, limit?: number, start_date?: string, end_date?: string } = {}) => {
        const response = await axios.get(
            `${API_URL}/v1/credits/usage`,
            {
                params,
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    },

    getUserCurrentBalance: async (token: string) => {
        const response = await axios.get(
            `${API_URL}/v1/credits/balance`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    },

    getCreditSummary: async (token: string) => {
        const response = await axios.get(
            `${API_URL}/v1/credits/summary`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    }
};

export interface MessageUsageLog {
    usage_id: string;
    user_id: string;
    message_id: string;
    credits_deducted: number;
    balance_after: number;
    timestamp: string;
}

export default creditService;
