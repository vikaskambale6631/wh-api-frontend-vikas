"use client";

import {
    Filter,
    Download,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    X,
    Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import templatesService, { Template } from "@/services/templatesService";

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        template_name: "",
        category: "",
        language: "",
        content: ""
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        const filtered = templates.filter(template => 
            template.template_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTemplates(filtered);
    }, [templates, searchTerm]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (token) {
                const data = await templatesService.getTemplates(token);
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to load templates", error);
            setStatus({ type: 'error', text: "Failed to load templates." });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.template_name.trim()) {
            setStatus({ type: 'error', text: "Template name is required." });
            return;
        }
        if (!newTemplate.category.trim()) {
            setStatus({ type: 'error', text: "Category is required." });
            return;
        }
        if (!newTemplate.language.trim()) {
            setStatus({ type: 'error', text: "Language is required." });
            return;
        }
        if (!newTemplate.content.trim()) {
            setStatus({ type: 'error', text: "Content is required." });
            return;
        }

        setIsCreating(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (token) {
                await templatesService.createTemplate(token, newTemplate);
                setStatus({ type: 'success', text: "Template created successfully!" });
                setIsCreateModalOpen(false);
                setNewTemplate({ template_name: "", category: "", language: "", content: "" });
                fetchTemplates(); // Refresh list
            }
        } catch (error) {
            console.error("Create template error", error);
            setStatus({ type: 'error', text: "Failed to create template." });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Templates</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your message templates</p>
                </div>
                <button 
                    onClick={() => { setIsCreateModalOpen(true); setStatus(null); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Template</span>
                </button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-100 gap-4">
                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                            <tr>
                                <th className="p-4 w-10">
                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                </th>
                                <th className="p-4 font-semibold min-w-[150px]">Template Name</th>
                                <th className="p-4 font-semibold min-w-[150px]">Category</th>
                                <th className="p-4 font-semibold min-w-[100px]">Language</th>
                                <th className="p-4 font-semibold min-w-[100px]">Status</th>
                                <th className="p-4 font-semibold min-w-[120px]">Last Updated</th>
                                <th className="p-4 font-semibold w-16 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
                            {filteredTemplates.map((template) => (
                                <tr key={template.id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                    </td>
                                    <td className="p-4 font-medium text-gray-900 border-l border-transparent group-hover:border-blue-100 transition-colors">
                                        {template.template_name}
                                        <div className="text-xs text-gray-400 font-normal mt-0.5">{template.id}</div>
                                    </td>
                                    <td className="p-4">{template.category}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                                            {template.language}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${template.template_status === 'APPROVED'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : template.template_status === 'PENDING'
                                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${template.template_status === 'APPROVED' ? 'bg-emerald-500' : template.template_status === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'
                                                }`}></span>
                                            {template.template_status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {new Date(template.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                    <div className="text-xs text-gray-500">
                        Showing <span className="font-medium text-gray-900">{filteredTemplates.length}</span> templates
                        <div className="flex items-center gap-2">
                            <button disabled className="p-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed bg-white">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button disabled className="p-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed bg-white">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE TEMPLATE MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">Create New Template</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newTemplate.template_name}
                                    onChange={(e) => setNewTemplate({...newTemplate, template_name: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. Welcome Message"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                                <select
                                    value={newTemplate.category}
                                    onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select a category</option>
                                    <option value="Transactional">Transactional</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Onboarding">Onboarding</option>
                                    <option value="Authentication">Authentication</option>
                                    <option value="Billing">Billing</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language <span className="text-red-500">*</span></label>
                                <select
                                    value={newTemplate.language}
                                    onChange={(e) => setNewTemplate({...newTemplate, language: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select a language</option>
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={4}
                                    value={newTemplate.content}
                                    onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                    placeholder="Enter your template content here..."
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
                            <button
                                onClick={handleCreateTemplate}
                                disabled={isCreating}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
