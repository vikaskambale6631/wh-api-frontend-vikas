"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

interface MessageBubbleProps {
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  className?: string;
}

export function MessageBubble({ text, timestamp, isOutgoing, className }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full flex",
        isOutgoing ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "relative max-w-md px-4 py-2 rounded-xl text-sm leading-[19px] transition-all",
          isOutgoing
            ? "bg-[#dcf8c6] text-[#111b21] rounded-tr-none ml-auto"
            : "bg-white text-[#111b21] rounded-tl-none border border-[#e9edef]"
        )}
      >
        <div className="px-1 pt-1 pb-4">
          {text}
        </div>

        {/* Timestamp & Status */}
        <div className="absolute right-3 bottom-1 flex items-center gap-1">
          <span className={cn("text-[11px] min-w-fit", isOutgoing ? "text-[#4fc3f7]" : "text-[#8696a0]")}>
            {timestamp}
          </span>
          {isOutgoing && (
            <span className="text-[#4fc3f7] ml-0.5">
              <CheckCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ChatListItemProps {
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isActive?: boolean;
  onClick?: () => void;
  avatar?: string;
  className?: string;
}

export function ChatListItem({ 
  name, 
  lastMessage, 
  timestamp, 
  unreadCount = 0, 
  isActive = false, 
  onClick,
  avatar,
  className 
}: ChatListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 mx-2 my-1",
        isActive 
          ? "bg-[#f0f2f5] border border-[#00a884]" 
          : "hover:bg-[#f0f2f5]",
        className
      )}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold shrink-0">
        {avatar || name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-semibold text-[14px] text-[#111b21] truncate">
            {name}
          </h3>
          <span className={cn("text-xs", unreadCount > 0 ? "text-[#00a884] font-medium" : "text-[#8696a0]")}>
            {timestamp}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#8696a0] truncate flex items-center gap-1">
            {lastMessage}
          </p>
          {unreadCount > 0 && (
            <span className="bg-[#00a884] text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full ml-2">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function MessageInput({ value, onChange, onSend, placeholder = "Type a message", className }: MessageInputProps) {
  return (
    <div className={cn("flex items-center gap-3 w-full", className)}>
      {/* Emoji Button */}
      <button className="text-[#8696a0] hover:text-[#111b21] hover:bg-[#f0f2f5] transition-all duration-200 p-2 rounded-full">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Input Field */}
      <div className="flex-1 bg-white border border-[#e9edef] rounded-full px-4 py-3 outline-none focus-within:ring-2 focus-within:ring-[#00a884] transition-all duration-200">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onSend(value);
            }
          }}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none text-[#111b21] placeholder:text-[#8696a0] w-full h-full"
        />
      </div>

      {/* Send Button */}
      {value.trim() ? (
        <button
          onClick={() => onSend(value)}
          className="px-6 py-3 rounded-full bg-[#00a884] hover:bg-[#008069] text-white font-medium transition-all duration-200"
        >
          Send
        </button>
      ) : (
        <button className="text-[#8696a0] hover:text-[#111b21] hover:bg-[#f0f2f5] transition-all duration-200 p-2 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
    </div>
  );
}
