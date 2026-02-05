"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { replyService, InboxMessage } from "@/services/replyService";
import {
    MessageSquare, Search, Send, Clock, User, Phone, RefreshCw, MoreVertical,
    Paperclip, Smile, Check, CheckCheck, Zap, Plus, Trash2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Page Metadata ---
// Note: Metadata handled in separate layout file for client components

// --- Types ---
interface ChatMessage {
    id: string;
    text: string;
    timestamp: string;
    direction: 'incoming' | 'outgoing';
    status?: 'sent' | 'delivered' | 'read';
    originalMsgId: string; // To track which backend message this relates to
}

// --- Main Page Component ---
export default function ManageRepliesPage() {
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile responsiveness if needed
    const messagesEndRef = useRef<HTMLDivElement>(null);



    // --- Loading Logic ---
    const loadMessages = async () => {
        setLoading(true);
        try {
            const data = await replyService.getInbox();
            setMessages(data || []);
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load & Polling
    useEffect(() => {
        loadMessages();
        const interval = setInterval(() => {
            // value silent background refresh
            replyService.getInbox().then(data => {
                if (data) setMessages(data);
            }).catch(console.error);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // --- Data Processing ---
    // Group messages by phone number
    const groupedConversations = useMemo(() => {
        const groups: Record<string, InboxMessage[]> = {};
        messages.forEach(msg => {
            if (!groups[msg.phone_number]) groups[msg.phone_number] = [];
            groups[msg.phone_number].push(msg);
        });
        return groups;
    }, [messages]);

    // Sort contacts by latest activity (incoming or reply)
    const sortedContacts = useMemo(() => {
        return Object.keys(groupedConversations).sort((a, b) => {
            const getLatestTime = (msgs: InboxMessage[]) => {
                if (!msgs.length) return 0;
                // Find max time in this thread
                return msgs.reduce((max, msg) => {
                    const t1 = new Date(msg.incoming_time).getTime();
                    const t2 = msg.reply_time ? new Date(msg.reply_time).getTime() : 0;
                    return Math.max(max, t1, t2);
                }, 0);
            };
            return getLatestTime(groupedConversations[b]) - getLatestTime(groupedConversations[a]);
        });
    }, [groupedConversations]);

    // Current Conversation Logic
    const currentConversation = useMemo(() => {
        if (!selectedPhone) return [];
        const rawMsgs = groupedConversations[selectedPhone] || [];

        // Flatten into chat stream
        const chatStream: ChatMessage[] = [];
        rawMsgs.forEach(msg => {
            // Incoming
            chatStream.push({
                id: `in_${msg.id}`,
                text: msg.incoming_message,
                timestamp: msg.incoming_time,
                direction: 'incoming',
                originalMsgId: msg.id
            });
            // Outgoing (if exists)
            if (msg.is_replied && msg.reply_message) {
                chatStream.push({
                    id: `out_${msg.id}`,
                    text: msg.reply_message,
                    timestamp: msg.reply_time!,
                    direction: 'outgoing',
                    status: 'read', // Creating a fake status for visual completeness
                    originalMsgId: msg.id
                });
            }
        });

        // Sort by time
        return chatStream.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [selectedPhone, groupedConversations]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentConversation]);

    // --- Actions ---
    const handleSendMessage = async (text: string) => {
        if (!selectedPhone) return;

        // Strategy: Find the most recent inbox message ID to attach this reply to.
        // Even if it's already replied, we'll overwrite the reply on the backend (limitation),
        // but we'll optimistic-update the UI to show a new bubble.
        const rawMsgs = groupedConversations[selectedPhone];
        if (!rawMsgs || rawMsgs.length === 0) {
            alert("Cannot reply: No conversation thread found.");
            return;
        }

        // Ideally pick the latest one
        // Sort rawMsgs by incoming time desc
        const sortedRaw = [...rawMsgs].sort((a, b) => new Date(b.incoming_time).getTime() - new Date(a.incoming_time).getTime());
        const targetMsg = sortedRaw[0];

        if (!targetMsg) return;

        try {
            // Optimistic update (simulated)
            // We can't easily update the 'messages' state in a way that creates a NEW persistent message 
            // because the backend is 1:1. 
            // So we will just call the API and let the poll/refresh handle it, 
            // BUT for user experience we should clear input and show it.

            // To properly show it 'optimistically' as a NEW bubble, we would need local state override.
            // For now, let's rely on standard flow: Send -> Refresh.
            // But to make it snappy, we'll force a quick re-fetch.

            await replyService.sendReply(targetMsg.id, text);

            // Immediately fetch latest state
            const data = await replyService.getInbox();
            setMessages(data);

        } catch (error: any) {
            console.error('Reply send error:', error);
            
            // Extract detailed error message from backend
            let errorMessage = "Failed to send message";
            
            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                } else if (errorData.detail?.error) {
                    errorMessage = errorData.detail.error;
                    // Add device info if available
                    if (errorData.detail.engine === 'unofficial' && errorData.detail.device_id) {
                        errorMessage += ` (Device: ${errorData.detail.device_id.slice(0, 8)}...)`;
                    }
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Special handling for unofficial engine errors
            if (errorMessage.includes('not connected') || errorMessage.includes('Device')) {
                errorMessage += "\n\nPlease ensure your WhatsApp device is connected and try again.";
            }
            
            alert(errorMessage);
        }
    };

    const handleSelectContact = (phone: string) => {
        setSelectedPhone(phone);
        // Mark as read logic
        replyService.markAsRead(phone).catch(console.error);

        // Optimistic read status update
        setMessages(prev => prev.map(m =>
            m.phone_number === phone ? { ...m, unread: false } : m
        ));
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#eef2f5] font-sans">

            {/* LEFT SIDEBAR - Contact List */}
            <div className={`w-full md:w-[380px] bg-white border-r border-[#e9edef] flex flex-col z-10 ${selectedPhone ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-[#d1d7db]">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                        <User className="text-gray-500 w-6 h-6" />
                    </div>
                    <div className="flex gap-4 text-[#54656f]">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-[rgba(0,0,0,0.05)]">
                            <RefreshCw className="w-5 h-5" onClick={loadMessages} />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-[rgba(0,0,0,0.05)]">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3 bg-white border-b border-gray-100">
                    <div className="relative bg-[#f0f2f5] rounded-lg h-9 flex items-center px-4">
                        <Search className="w-4 h-4 text-[#54656f] mr-4" />
                        <input
                            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#54656f]"
                            placeholder="Search or start new chat"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    {loading && messages.length === 0 ? (
                        <div className="flex justify-center items-center h-20 text-gray-400 text-sm">Loading chats...</div>
                    ) : sortedContacts.map(phone => {
                        const msgs = groupedConversations[phone];
                        const lastMsg = msgs[0]; // Logic assumes grouped is unsorted, but we need 'latest' to display preview
                        // Let's find the actual latest message (incoming or reply) for preview
                        const allForPhone: ChatMessage[] = [];
                        msgs.forEach(m => {
                            allForPhone.push({ id: '', text: m.incoming_message, timestamp: m.incoming_time, direction: 'incoming', originalMsgId: m.id });
                            if (m.is_replied && m.reply_message) {
                                allForPhone.push({ id: '', text: m.reply_message, timestamp: m.reply_time!, direction: 'outgoing', originalMsgId: m.id });
                            }
                        });
                        allForPhone.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        const previewMsg = allForPhone[0];

                        const unreadCount = msgs.filter(m => m.unread).length;

                        return (
                            <div
                                key={phone}
                                onClick={() => handleSelectContact(phone)}
                                className={cn(
                                    "flex items-center p-3 cursor-pointer border-b border-[#f0f2f5] hover:bg-[#f5f6f6] transition-colors relative",
                                    selectedPhone === phone ? "bg-[#f0f2f5]" : ""
                                )}
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 flex items-center justify-center mr-3 overflow-hidden">
                                    <User className="w-7 h-7 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="text-[#111b21] font-medium text-[16px] truncate">{phone}</h3>
                                        <span className={cn("text-xs", unreadCount > 0 ? "text-[#25d366] font-medium" : "text-[#667781]")}>
                                            {formatTime(previewMsg.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-[#667781] truncate flex items-center gap-1">
                                            {previewMsg.direction === 'outgoing' && (
                                                <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                                            )}
                                            {previewMsg.text}
                                        </p>
                                        {unreadCount > 0 && (
                                            <span className="bg-[#25d366] text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full ml-2">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT MAIN PANEL - Chat */}
            <div className={`flex-1 flex flex-col bg-[#efeae2] h-full ${!selectedPhone ? 'hidden md:flex' : 'flex'}`}>
                {selectedPhone ? (
                    <>
                        {/* Header */}
                        <div className="h-16 bg-[#f0f2f5] flex items-center px-4 border-b border-[#d1d7db] justify-between shadow-sm z-20">
                            <div className="flex items-center gap-3">
                                {/* Back button for mobile */}
                                <Button variant="ghost" size="icon" className="md:hidden mr-1" onClick={() => setSelectedPhone(null)}>
                                    <svg viewBox="0 0 24 24" width="24" height="24" className="fill-[#54656f]"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
                                </Button>

                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                    <User className="text-gray-500 w-6 h-6" />
                                </div>
                                <div className="cursor-pointer">
                                    <div className="text-[#111b21] font-medium">{selectedPhone}</div>
                                    <div className="text-xs text-[#667781]">click for contact info</div>
                                </div>
                            </div>
                            <div className="flex gap-4 text-[#54656f]">
                                <Search className="w-5 h-5 cursor-pointer" />
                                <MoreVertical className="w-5 h-5 cursor-pointer" />
                            </div>
                        </div>

                        {/* Messages Area */}

                        <div
                            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 custom-scrollbar shadow-inner"
                            style={{
                                backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                                backgroundRepeat: 'repeat',
                                backgroundSize: '400px'
                            }}
                        >
                            <AnimatePresence initial={false}>
                                {currentConversation.map((msg, index) => {
                                    const isOutgoing = msg.direction === 'outgoing';
                                    const showTail = true; // Simplified for now, usually checks if next msg is same author

                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={cn(
                                                "w-full flex",
                                                isOutgoing ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "relative max-w-[85%] md:max-w-[65%] px-2 py-1.5 rounded-lg shadow-sm text-sm md:text-[14.2px] leading-[19px] transition-all hover:shadow-md cursor-default",
                                                    isOutgoing
                                                        ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                                                        : "bg-white text-[#111b21] rounded-tl-none"
                                                )}
                                            >
                                                {/* Tail Svg */}
                                                {isOutgoing ? (
                                                    <span className="absolute -right-2 top-0 text-[#d9fdd3]">
                                                        <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid slice" className="fill-current block"><path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path></svg>
                                                    </span>
                                                ) : (
                                                    <span className="absolute -left-2 top-0 text-white">
                                                        <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid slice" className="fill-current block scale-x-[-1]"><path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path></svg>
                                                    </span>
                                                )}

                                                <div className="px-1 pt-1 pb-4">
                                                    {msg.text}
                                                </div>

                                                {/* Timestamp & Status */}
                                                <div className="absolute right-2 bottom-1 flex items-center gap-1">
                                                    <span className="text-[11px] text-[#667781] min-w-fit">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                    {isOutgoing && (
                                                        <span className="text-[#53bdeb] ml-0.5">
                                                            <CheckCheck className="w-3.5 h-3.5" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                            <div className="h-4" /> {/* Spacer */}
                        </div>

                        {/* Input Area */}
                        <ChatInput onSend={handleSendMessage} />
                    </>
                ) : (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center p-10 border-b-[6px] border-[#25d366]">
                        <div className="w-64 mb-10 text-[#41525d]">
                            {/* Illustration could go here, for now simple text/icon */}
                            <div className="flex justify-center mb-6">
                                <MessageSquare className="w-24 h-24 text-gray-300" />
                            </div>
                            <h1 className="text-3xl font-light text-center mb-4 text-[#41525d]">WhatsApp Web</h1>
                            <p className="text-[#667781] text-center text-sm leading-6">
                                Send and receive messages without keeping your phone online.<br />
                                Use WhatsApp on up to 4 linked devices and 1 phone.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Subcomponents ---

// --- Subcomponents ---

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
    const [text, setText] = useState("");
    const [showQuick, setShowQuick] = useState(false);
    const [replies, setReplies] = useState<{ id: string, shortcut: string, text: string }[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newShortcut, setNewShortcut] = useState("");
    const [newText, setNewText] = useState("");

    // Load replies when opening
    useEffect(() => {
        if (showQuick) {
            replyService.getQuickReplies().then(setReplies).catch(console.error);
        }
    }, [showQuick]);

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text);
        setText("");
    };

    const handleAddQuick = async () => {
        if (!newShortcut || !newText) return;
        try {
            const added = await replyService.createQuickReply(newShortcut, newText);
            setReplies([...replies, added]);
            setIsAdding(false);
            setNewShortcut("");
            setNewText("");
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteQuick = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await replyService.deleteQuickReply(id);
            setReplies(replies.filter(r => r.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative z-20">
            {/* Quick Reply Popover */}
            {showQuick && (
                <div className="absolute bottom-16 left-4 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[400px]">
                    <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                        <span className="font-semibold text-emerald-800 text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4 fill-emerald-500 text-emerald-600" />
                            Quick Replies
                        </span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsAdding(!isAdding)}>
                                <Plus className="w-4 h-4 text-emerald-700" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowQuick(false)}>
                                <X className="w-4 h-4 text-gray-500" />
                            </Button>
                        </div>
                    </div>

                    {isAdding && (
                        <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2">
                            <Input
                                placeholder="Shortcut (e.g. /greeting)"
                                value={newShortcut}
                                onChange={e => setNewShortcut(e.target.value)}
                                className="h-8 text-xs bg-white"
                            />
                            <Input
                                placeholder="Full Message text..."
                                value={newText}
                                onChange={e => setNewText(e.target.value)}
                                className="h-8 text-xs bg-white"
                            />
                            <Button size="sm" className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddQuick}>
                                Save Reply
                            </Button>
                        </div>
                    )}

                    <div className="overflow-y-auto p-1 custom-scrollbar">
                        {replies.length === 0 && !isAdding ? (
                            <div className="p-4 text-center text-gray-400 text-xs">No quick replies yet. Click + to add.</div>
                        ) : (
                            replies.map(r => (
                                <div
                                    key={r.id}
                                    className="p-2 hover:bg-gray-100 rounded cursor-pointer group flex justify-between items-start"
                                    onClick={() => {
                                        setText(text + r.text);
                                        setShowQuick(false);
                                    }}
                                >
                                    <div>
                                        <div className="font-bold text-xs text-gray-700">{r.shortcut}</div>
                                        <div className="text-xs text-gray-500 line-clamp-2">{r.text}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) => handleDeleteQuick(r.id, e)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="min-h-[62px] bg-[#f0f2f5] px-4 py-2 flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-[#54656f]">
                    <Smile className="w-6 h-6" />
                </Button>
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`text-[#54656f] transition-colors ${showQuick ? 'bg-emerald-100 text-emerald-600 rounded-full' : ''}`}
                        onClick={() => setShowQuick(!showQuick)}
                    >
                        <Zap className={`w-6 h-6 ${showQuick ? 'fill-current' : ''}`} />
                    </Button>
                </div>

                <div className="flex-1 bg-white rounded-lg flex items-center border border-white focus-within:border-white">
                    <Input
                        className="border-none shadow-none focus-visible:ring-0 bg-transparent py-3 px-4 h-10 text-[15px] placeholder:text-[#54656f]"
                        placeholder="Type a message"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
                        }}
                    />
                </div>
                {text.trim() ? (
                    <Button
                        onClick={handleSend}
                        size="icon"
                        className="bg-[#00a884] hover:bg-[#008f6f] w-10 h-10 rounded-full shrink-0"
                    >
                        <Send className="w-5 h-5 text-white ml-0.5" />
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="text-[#54656f]">
                        <span className="w-6 h-6 flex items-center justify-center">🎤</span>
                    </Button>
                )}

            </div>
        </div>
    );
}

// --- Utils ---
function formatTime(isoString: string) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
