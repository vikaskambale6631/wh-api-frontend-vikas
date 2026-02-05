import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export interface Template {
    id: number;
    busi_user_id: string;
    template_name: string;
    template_status: string;
    category: string;
    language: string;
    content: string;
    meta_template_id?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTemplateRequest {
    template_name: string;
    category: string;
    language: string;
    content: string;
    meta_template_id?: string;
}

const templatesService = {
    getTemplates: async (token: string): Promise<Template[]> => {
        const response = await axios.get(`${API_URL}/official-whatsapp/config/templates`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    createTemplate: async (token: string, templateData: CreateTemplateRequest): Promise<Template> => {
        const response = await axios.post(`${API_URL}/official-whatsapp/config/templates`, templateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default templatesService;
