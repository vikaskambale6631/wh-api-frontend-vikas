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
    file: File | null;
    setFile: (file: File | null) => void;
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
    file,
    setFile,
    caption,
    setCaption,
}: MediaMessageComposerProps) {

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFilePath(""); // Clear manual path if file is selected
        }
    };

    const clearFile = () => {
        setFile(null);
    };

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

            {/* File Upload Area */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                    File Attachment
                </label>
                
                {!file ? (
                    <div className="relative group">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all group-hover:border-emerald-300 group-hover:bg-emerald-50/30">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                <ImageIcon size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-700">Click or drag to upload</p>
                                <p className="text-xs text-gray-400 mt-1">Images, Videos, or Documents</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <FileText size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-900 truncate">{file.name}</p>
                            <p className="text-xs text-emerald-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button 
                            onClick={clearFile}
                            className="p-2 hover:bg-emerald-200 rounded-lg text-emerald-600 transition-colors"
                        >
                            <Video size={18} className="rotate-45" /> 
                            {/* Using Video as an 'X' icon for now or just a button */}
                            <span className="sr-only">Remove file</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-4 py-2">
                    <div className="h-[1px] bg-gray-100 flex-1"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OR USE EXTERNAL PATH</span>
                    <div className="h-[1px] bg-gray-100 flex-1"></div>
                </div>

                {/* File Path Input */}
                <div>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={filePath}
                            onChange={(e) => {
                                setFilePath(e.target.value);
                                if (e.target.value) setFile(null); // Clear file if manual path is typed
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                            placeholder="e.g. C:\Users\ASUS\Downloads\file.pdf or https://example.com/photo.jpg"
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                        Enter a local file path or a publicly accessible URL.
                    </p>
                </div>
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
