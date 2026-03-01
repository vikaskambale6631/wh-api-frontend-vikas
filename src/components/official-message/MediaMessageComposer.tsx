"use client";

import { useState } from "react";
import {
    Image as ImageIcon,
    Video,
    FileText,
    Link as LinkIcon,
} from "lucide-react";

type MediaType = "image" | "video" | "document";

interface MediaMessageComposerProps {
    mediaType: MediaType;
    setMediaType: (type: MediaType) => void;
    filePath: string;
    setFilePath: (path: string) => void;
    caption: string;
    setCaption: (caption: string) => void;
}

const MEDIA_TABS: { key: MediaType; label: string; icon: React.ReactNode }[] = [
    { key: "image", label: "Image", icon: <ImageIcon size={18} /> },
    { key: "video", label: "Video", icon: <Video size={18} /> },
    { key: "document", label: "Document", icon: <FileText size={18} /> },
];

const MAX_CAPTION_LENGTH = 1024;

export default function MediaMessageComposer({
    mediaType,
    setMediaType,
    filePath,
    setFilePath,
    caption,
    setCaption,
}: MediaMessageComposerProps) {

    return (
        <div className="space-y-6">
            {/* Media Type Selector — Segmented Control */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Media Type
                </label>
                <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                    {MEDIA_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setMediaType(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${mediaType === tab.key
                                ? "bg-white text-emerald-700 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* File Path Input */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    File Path or URL
                </label>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={filePath}
                        onChange={(e) => setFilePath(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="e.g. D:\files\image.jpg or https://example.com/photo.jpg"
                    />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                    Enter the full file path on the server or a publicly accessible URL. No file size limit applies.
                </p>
                {filePath.trim() && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                        <span className="text-emerald-600 text-sm font-medium">✓ File path set</span>
                        <span className="text-emerald-500 text-xs truncate flex-1">{filePath}</span>
                    </div>
                )}
            </div>

            {/* Caption Input */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                        Caption / Message <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <span
                        className={`text-xs font-medium ${caption.length > MAX_CAPTION_LENGTH
                            ? "text-red-500"
                            : "text-gray-400"
                            }`}
                    >
                        {caption.length} / {MAX_CAPTION_LENGTH}
                    </span>
                </div>
                <textarea
                    value={caption}
                    onChange={(e) => {
                        if (e.target.value.length <= MAX_CAPTION_LENGTH) {
                            setCaption(e.target.value);
                        }
                    }}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-28 resize-none shadow-sm text-sm"
                    placeholder="Add an optional caption to your media..."
                />
                <p className="mt-1 text-xs text-gray-400">
                    If provided, the file + caption will be sent together via <code className="text-emerald-600">/send-file-text</code>. Otherwise, only the file is sent via <code className="text-emerald-600">/send-file</code>.
                </p>
            </div>
        </div>
    );
}
