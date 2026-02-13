"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { replyService, InboxMessage } from "@/services/replyService";
import {
    MessageSquare, Search, RefreshCw, MoreVertical, User, CheckCheck, Smile, Zap, Plus, X, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatLayout, ConversationPanel, ChatListPanel } from "@/components/ui/chat-layout";
import { MessageBubble, ChatListItem, MessageInput } from "@/components/ui/chat-components";
import "@/styles/manage-replies.css";

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
    const [messageText, setMessageText] = useState("");
    const [optimisticMessages, setOptimisticMessages] = useState<{ [key: string]: ChatMessage[] }>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);



    // --- Message Sending Logic ---
    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !selectedPhone) return;

        try {
            // Find the most recent inbox message to attach this reply to
            const rawMsgs = groupedConversations[selectedPhone];
            if (!rawMsgs || rawMsgs.length === 0) {
                alert("Cannot reply: No conversation thread found.");
                return;
            }

            const sortedRaw = [...rawMsgs].sort((a, b) => new Date(b.incoming_time).getTime() - new Date(a.incoming_time).getTime());
            const targetMsg = sortedRaw[0];

            if (!targetMsg) return;

            // Optimistic update: Add the outgoing message immediately
            const optimisticMessage: ChatMessage = {
                id: `out_${Date.now()}_${Math.random()}`,
                text: text,
                timestamp: new Date().toISOString(),
                direction: 'outgoing',
                status: 'sent',
                originalMsgId: targetMsg.id
            };

            // Add optimistic message to state
            setOptimisticMessages(prev => ({
                ...prev,
                [selectedPhone]: [...(prev[selectedPhone] || []), optimisticMessage]
            }));

            // Clear input immediately for better UX
            setMessageText("");

            // Security Logging
            console.log("[FRONTEND] handleSendMessage triggered");
            console.log("[FRONTEND] Target Message ID:", targetMsg.id);
            console.log("[FRONTEND] Selected Phone (Conversation Key):", selectedPhone);
            console.log("[FRONTEND] Target Message Phone Prop:", targetMsg.phone_number);
            console.log("[FRONTEND] Device ID:", targetMsg.device_id);

            // Send the actual message to backend
            // CRITICAL: Use selectedPhone to ensure we rely on the conversation key, 
            // fallback to targetMsg.phone_number if needed.
            const phoneToSend = selectedPhone || targetMsg.phone_number;

            console.log("[FRONTEND] FINAL SENDING PHONE:", phoneToSend);

            await replyService.sendReply(targetMsg.id, phoneToSend, targetMsg.device_id, text);

            // Refresh messages to get the actual state from backend
            const data = await replyService.getInbox();
            setMessages(data);

            // Clear optimistic messages after successful send
            setTimeout(() => {
                setOptimisticMessages(prev => {
                    const updated = { ...prev };
                    delete updated[selectedPhone];
                    return updated;
                });
            }, 1000);

        } catch (error: any) {
            console.error('Reply send error:', error);

            let errorMessage = "Failed to send message";

            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                } else if (errorData.detail?.error) {
                    errorMessage = errorData.detail.error;
                    if (errorData.detail.engine === 'unofficial' && errorData.detail.device_id) {
                        errorMessage += ` (Device: ${errorData.detail.device_id.slice(0, 8)}...)`;
                    }
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            if (errorMessage.includes('not connected') || errorMessage.includes('Device')) {
                errorMessage += "\n\nPlease ensure your WhatsApp device is connected and try again.";
            }

            alert(errorMessage);
        }
    };

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

        // Add optimistic messages if any
        const optimisticMsgs = optimisticMessages[selectedPhone] || [];
        const combinedStream = [...chatStream, ...optimisticMsgs];

        // Sort by time
        return combinedStream.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [selectedPhone, groupedConversations, optimisticMessages]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentConversation]);

    // --- Actions ---

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
        <ChatLayout
            chatList={
                <ChatListPanel
                    header={
                        <>
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#00a884] font-semibold">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="flex gap-3 text-white ml-auto">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 transition-all duration-200">
                                    <RefreshCw className="w-5 h-5" onClick={loadMessages} />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 transition-all duration-200">
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </div>
                        </>
                    }
                    search={
                        <div className="relative bg-[#f0f2f5] rounded-xl h-11 flex items-center px-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#00a884] focus-within:bg-white">
                            <Search className="w-4 h-4 text-[#8696a0] mr-3" />
                            <input
                                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#8696a0] text-[#111b21]"
                                placeholder="Search or start new chat"
                            />
                        </div>
                    }
                    list={
                        <>
                            {loading && messages.length === 0 ? (
                                <div className="flex justify-center items-center h-20 text-[#8696a0] text-sm">Loading chats...</div>
                            ) : sortedContacts.filter(phone => !phone.startsWith("120363")).map(phone => {
                                const msgs = groupedConversations[phone];
                                const lastMsg = msgs[0];

                                // Find the actual latest message for preview
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
                                    <ChatListItem
                                        key={phone}
                                        name={msgs[0]?.contact_name || phone}
                                        lastMessage={previewMsg.text}
                                        timestamp={formatTime(previewMsg.timestamp)}
                                        unreadCount={unreadCount}
                                        isActive={selectedPhone === phone}
                                        onClick={() => handleSelectContact(phone)}
                                    />
                                );
                            })}
                        </>
                    }
                />
            }
            conversation={
                selectedPhone ? (
                    <ConversationPanel
                        header={
                            <>
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#00a884] font-semibold">
                                    {groupedConversations[selectedPhone]?.[0]?.contact_name?.charAt(0)?.toUpperCase() || selectedPhone.charAt(0)}
                                </div>
                                <div className="cursor-pointer ml-4">
                                    <div className="font-semibold text-lg text-white">
                                        {groupedConversations[selectedPhone]?.[0]?.contact_name || selectedPhone}
                                    </div>
                                    <div className="text-xs text-white/80">click for contact info</div>
                                </div>
                                <div className="flex gap-4 text-white ml-auto">
                                    <Search className="w-5 h-5 cursor-pointer hover:text-white/80 transition-colors" />
                                    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white/80 transition-colors" />
                                </div>
                            </>
                        }
                        messages={
                            <>
                                <AnimatePresence initial={false}>
                                    {currentConversation.map((msg, index) => (
                                        <MessageBubble
                                            key={msg.id}
                                            text={msg.text}
                                            timestamp={formatTime(msg.timestamp)}
                                            isOutgoing={msg.direction === 'outgoing'}
                                        />
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </>
                        }
                        input={
                            <MessageInput
                                value={messageText}
                                onChange={setMessageText}
                                onSend={handleSendMessage}
                            />
                        }
                    />
                ) : (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white">
                        <div className="w-80 mb-12 text-center">
                            <div className="flex justify-center mb-8">
                                <div className="w-24 h-24 rounded-full bg-[#00a884] flex items-center justify-center shadow-lg">
                                    <MessageSquare className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-light text-center mb-4 text-[#111b21]">WhatsApp Web</h1>
                            <p className="text-[#667781] text-center text-sm leading-6">
                                Send and receive messages without keeping your phone online.<br />
                                Use WhatsApp on up to 4 linked devices and 1 phone.
                            </p>
                        </div>
                    </div>
                )
            }
        />
    );
}

// --- Utils ---
function formatTime(timestamp: string) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return "";
    }
}
