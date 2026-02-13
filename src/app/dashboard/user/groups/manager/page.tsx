"use client";

import {
    Filter,
    Download,
    Users,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Trash2,
    Edit,
    Plus,
    X,
    Loader2,
    Save,
    Eye,
    Phone,
    Search
} from "lucide-react";
import { useState, useEffect } from "react";
import groupService, { Group, ContactItem } from "@/services/groupService";

export default function GroupsManagerPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Create Group Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // View Group & Contacts State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupContacts, setGroupContacts] = useState<ContactItem[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);

    // New Contact Rows State
    const [newContactRows, setNewContactRows] = useState<ContactItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        // Filter groups based on search term
        const filtered = groups.filter(group =>
            group.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredGroups(filtered);
    }, [groups, searchTerm]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (token) {
                const data = await groupService.getGroups(token);
                setGroups(data);
            }
        } catch (error) {
            console.error("Failed to load groups", error);
            setStatus({ type: 'error', text: "Failed to load groups." });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            setStatus({ type: 'error', text: "Group name is required." });
            return;
        }
        setIsCreating(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (token) {
                const newGroup = await groupService.createGroup(token, newGroupName, newGroupDesc);
                setStatus({ type: 'success', text: "Group created successfully!" });
                setIsCreateModalOpen(false);
                setNewGroupName("");
                setNewGroupDesc("");

                // CRITICAL: Refresh groups immediately and set selected group
                await fetchGroups();
                setSelectedGroup(newGroup);
            }
        } catch (error) {
            console.error("Create group error", error);
            setStatus({ type: 'error', text: "Failed to create group." });
        } finally {
            setIsCreating(false);
        }
    };

    const openViewGroup = async (group: Group) => {
        setSelectedGroup(group);
        setIsViewModalOpen(true);
        setNewContactRows([]); // Reset new rows
        setGroupContacts([]);
        setIsLoadingContacts(true);
        setStatus(null);

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (token) {
                const contacts = await groupService.getGroupContacts(token, group.group_id);
                setGroupContacts(contacts);
            }
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        } finally {
            setIsLoadingContacts(false);
        }
    };

    const handleAddNewRow = () => {
        setNewContactRows([...newContactRows, { name: "", phone: "" }]);
    };

    const handleRemoveNewRow = (index: number) => {
        const rows = [...newContactRows];
        rows.splice(index, 1);
        setNewContactRows(rows);
    };

    const handleNewRowChange = (index: number, field: 'name' | 'phone', value: string) => {
        const rows = [...newContactRows];
        // @ts-ignore
        rows[index][field] = value;
        setNewContactRows(rows);
    };

    const validateAndSave = async (contactsToSave: ContactItem[], isBatch: boolean) => {
        if (!selectedGroup) {
            alert("No group selected. Please select a group first.");
            return;
        }

        // CRITICAL: Validate group exists before adding contacts
        if (!groups.find(g => g.group_id === selectedGroup.group_id)) {
            alert("Group not found. Please refresh the groups list.");
            return;
        }

        // Validation
        const validContacts = contactsToSave.filter(c => c.phone.trim() !== "");
        if (validContacts.length === 0) {
            alert("Please enter a valid phone number.");
            return;
        }

        const phones = validContacts.map(c => c.phone);
        const hasDuplicates = phones.some((p, i) => phones.indexOf(p) !== i);
        if (hasDuplicates) {
            alert("Duplicate phone numbers found in your list.");
            return;
        }

        const existingPhones = new Set(groupContacts.map(c => c.phone));
        const duplicatesInGroup = validContacts.some(c => existingPhones.has(c.phone));
        if (duplicatesInGroup) {
            alert("One or more phone numbers already exist in this group.");
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (token) {
                await groupService.addContacts(token, selectedGroup.group_id, validContacts);

                setStatus({
                    type: 'success',
                    text: `Contacts added successfully!`
                });

                // Refresh
                const updatedContacts = await groupService.getGroupContacts(token, selectedGroup.group_id);
                setGroupContacts(updatedContacts);
                fetchGroups(); // Update parent counts

                if (isBatch) {
                    setNewContactRows([]); // Clear all if batch
                } else {
                    // Start fresh or remove saved? If single row saved, clear rows.
                    setNewContactRows([]);
                }
            }
        } catch (error: any) {
            console.error("Add contacts error", error);

            // Handle specific 404 errors for missing groups
            if (error.response?.status === 404) {
                alert("Group not found or was deleted. Please refresh the groups list.");
                fetchGroups(); // Refresh to update state
            } else {
                alert("Failed to add contacts. Check inputs.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSingleRow = (index: number) => {
        validateAndSave([newContactRows[index]], false);
    };

    const handleSaveAllRows = () => {
        validateAndSave(newContactRows, true);
    };

    const handleDeleteGroup = async (group: Group) => {
        if (!confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (token) {
                const response = await groupService.deleteGroup(token, group.group_id);
                if (response.success) {
                    setStatus({ type: 'success', text: `Group "${group.name}" deleted successfully!` });

                    // CRITICAL: Update state immediately to prevent FK errors
                    setGroups(prev => prev.filter(g => g.group_id !== group.group_id));
                    if (selectedGroup?.group_id === group.group_id) {
                        setSelectedGroup(null);
                    }

                    // Optional: Refresh to ensure sync
                    fetchGroups();
                } else {
                    setStatus({ type: 'error', text: response.message || "Failed to delete group." });
                }
            }
        } catch (error: any) {
            console.error("Delete group error", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to delete group.";
            setStatus({ type: 'error', text: errorMessage });
        }
    };

    return (
        <div className="p-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Group Manager</h1>
                    <p className="text-gray-500 text-sm mt-1">Create and manage your contact groups</p>
                </div>
                <button
                    onClick={() => { setIsCreateModalOpen(true); setStatus(null); }}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Create New Group</span>
                </button>
            </div>

            {/* Status Notification */}
            {status && (
                <div className={`mb-4 p-3 rounded-lg flex items-center justify-between text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    <span>{status.text}</span>
                    <button onClick={() => setStatus(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-100 gap-4">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading groups...
                        </div>
                    ) : filteredGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Users className="w-12 h-12 text-gray-200 mb-3" />
                            <p>No groups found.</p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-2 text-yellow-600 hover:underline text-sm font-medium"
                            >
                                Create your first group
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-linear-to-r from-emerald-50 to-teal-50 text-xs font-semibold tracking-wider uppercase border-b border-emerald-100">
                                <tr>
                                    <th className="p-4 font-semibold min-w-[200px]">Group Name</th>
                                    <th className="p-4 font-semibold min-w-[150px]">Members</th>
                                    <th className="p-4 font-semibold min-w-[250px]">Description</th>
                                    <th className="p-4 font-semibold w-32 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-600 divide-y divide-yellow-50">
                                {filteredGroups.map((group) => (
                                    <tr key={group.group_id} className="hover:bg-yellow-50/40 transition-colors duration-150 group">
                                        <td className="p-4 border-l border-transparent group-hover:border-yellow-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-yellow-100/50 p-2 rounded-lg text-yellow-600">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{group.name}</div>
                                                    <div className="text-xs text-gray-400 font-normal mt-0.5 truncate max-w-[150px]">{group.group_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-gray-700">{group.contact_count}</span>
                                                <span className="text-xs text-gray-400">contacts</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 truncate max-w-xs">{group.description || "-"}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openViewGroup(group)}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-blue-200"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGroup(group)}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-red-200"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* CREATE GROUP MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">Create New Group</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none"
                                    placeholder="e.g. VIP Customers"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none resize-none"
                                    placeholder="Describe this group..."
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={isCreating}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Group
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW GROUP MODAL */}
            {isViewModalOpen && selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-gray-800">{selectedGroup.name}</h3>
                                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                        {groupContacts.length} contacts
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{selectedGroup.description || "No description"}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                                    <tr>
                                        <th className="p-4 border-b border-gray-100 w-12">#</th>
                                        <th className="p-4 border-b border-gray-100">Name</th>
                                        <th className="p-4 border-b border-gray-100">Phone</th>
                                        <th className="p-4 border-b border-gray-100 text-right pr-6">Status / Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {/* Existing Contacts */}
                                    {groupContacts.map((contact, index) => (
                                        <tr key={index} className="hover:bg-yellow-50/20 transition-colors text-sm text-gray-600 bg-white">
                                            <td className="p-4 text-gray-400 text-xs">{index + 1}</td>
                                            <td className="p-4 font-medium text-gray-800">{contact.name || "-"}</td>
                                            <td className="p-4 font-mono text-gray-500">{contact.phone}</td>
                                            <td className="p-4 text-right pr-6">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600 border border-green-100">
                                                    VALID
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* New Contact Rows */}
                                    {newContactRows.map((row, idx) => (
                                        <tr key={`new-${idx}`} className="bg-yellow-50/30 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <td className="p-4 text-yellow-600 text-xs font-bold">+</td>
                                            <td className="p-4">
                                                <input
                                                    type="text"
                                                    value={row.name}
                                                    onChange={(e) => handleNewRowChange(idx, 'name', e.target.value)}
                                                    placeholder="Name (Optional)"
                                                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 outline-none bg-white"
                                                    autoFocus={idx === newContactRows.length - 1 && newContactRows.length > 0}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="text"
                                                    value={row.phone}
                                                    onChange={(e) => handleNewRowChange(idx, 'phone', e.target.value)}
                                                    placeholder="Phone (Expected format: 91XXXXXXXXXX)"
                                                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 outline-none bg-white"
                                                />
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                {newContactRows.length === 1 ? (
                                                    <button
                                                        onClick={() => handleSaveSingleRow(idx)}
                                                        disabled={isSaving}
                                                        className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm transition-colors inline-flex"
                                                        title="Save Contact"
                                                    >
                                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRemoveNewRow(idx)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                                                        title="Remove Row"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Empty State / Loading State (Only if no rows exist) */}
                                    {!isLoadingContacts && groupContacts.length === 0 && newContactRows.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-12 text-gray-500">
                                                <Users className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                                                No contacts found. Click "Add New Row" to start.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Actions Area */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleAddNewRow}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-2 self-start px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New Contact
                                    </button>

                                    {newContactRows.length > 1 && (
                                        <button
                                            onClick={handleSaveAllRows}
                                            disabled={isSaving}
                                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all animate-in slide-in-from-bottom-2"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save {newContactRows.length} Contacts
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
