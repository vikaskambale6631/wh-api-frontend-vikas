/**
 * Unofficial WhatsApp API Service
 *
 * Wraps every endpoint in /api/unofficial with correct content types:
 *  - /send-message              → JSON body
 *  - /send-file                 → FormData (form fields)
 *  - /send-file-text            → FormData
 *  - /send-file-caption         → FormData
 *  - /bulk-send-messages        → FormData
 *  - /bulk-send-files           → FormData
 *  - /bulk-send-files-with-text → FormData
 *  - /delivery-report           → GET query params
 *  - /status-check              → GET query params
 */

import { API_BASE_URL } from "@/config/api";
import axios from "@/config/axios";

const UNOFFICIAL_BASE = `/unofficial`;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse error responses from the backend (handles 422 + 500) */
function parseApiError(status: number, data: any): string {
    if (status === 422) {
        // FastAPI validation error: { detail: [{ loc, msg, type }] }
        if (Array.isArray(data?.detail)) {
            return data.detail
                .map((e: any) => `${e.loc?.join(" → ") || "field"}: ${e.msg}`)
                .join("; ");
        }
        return data?.detail || "Validation error (422)";
    }
    if (status === 500) {
        return typeof data?.detail === "string"
            ? data.detail
            : "Internal server error (500)";
    }
    return data?.detail || data?.message || `Request failed (${status})`;
}

/** Build FormData from a plain object */
function buildFormData(fields: Record<string, string | boolean | number>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) {
            fd.append(key, String(value));
        }
    }
    return fd;
}

/** Generic POST with JSON body */
async function postJSON<T = any>(
    endpoint: string,
    body: Record<string, any>
): Promise<T> {
    try {
        const res = await axios.post(`${UNOFFICIAL_BASE}${endpoint}`, body);
        return res.data;
    } catch (error: any) {
        throw new Error(parseApiError(error.response?.status || 500, error.response?.data || {}));
    }
}

/** Generic POST with FormData body */
async function postForm<T = any>(
    endpoint: string,
    fields: Record<string, string | boolean | number>
): Promise<T> {
    const fd = buildFormData(fields);
    try {
        const res = await axios.post(`${UNOFFICIAL_BASE}${endpoint}`, fd);
        return res.data;
    } catch (error: any) {
        throw new Error(parseApiError(error.response?.status || 500, error.response?.data || {}));
    }
}

/** Generic GET with query params */
async function getQuery<T = any>(
    endpoint: string,
    params: Record<string, string>
): Promise<T> {
    try {
        const res = await axios.get(`${UNOFFICIAL_BASE}${endpoint}`, { params });
        return res.data;
    } catch (error: any) {
        throw new Error(parseApiError(error.response?.status || 500, error.response?.data || {}));
    }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SendMessageResult {
    success?: boolean;
    result?: any;
    [key: string]: any;
}

export interface BulkSendResult {
    success: boolean;
    total_recipients: number;
    success_count: number;
    error_count: number;
    delivered_count: number;
    results: Array<{
        recipient: string;
        status: "success" | "error";
        error?: string;
        result?: any;
        index: number;
    }>;
    timestamp: number;
    operation_type?: string;
}

export interface DeliveryReport {
    [key: string]: any;
}

export interface StatusCheckResult {
    [key: string]: any;
}

// ─── Service ────────────────────────────────────────────────────────────────

const unofficialApiService = {
    // ── Single message endpoints ──────────────────────────────────────────

    /** POST /send-message — JSON body */
    sendMessage: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        message: string,
        waitForDelivery = false,
        maxWaitTime = 30
    ): Promise<SendMessageResult> =>
        postJSON("/send-message", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            message,
            wait_for_delivery: waitForDelivery,
            max_wait_time: maxWaitTime,
        }),

    /** POST /send-file — FormData */
    sendFile: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        filePath: string
    ): Promise<SendMessageResult> =>
        postForm("/send-file", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            file_path: filePath,
        }),

    /** POST /send-file-text — FormData (file + text message) */
    sendFileText: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        filePath: string,
        message: string
    ): Promise<SendMessageResult> =>
        postForm("/send-file-text", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            file_path: filePath,
            message,
        }),

    /** POST /send-file-caption — FormData (file + caption) */
    sendFileCaption: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        filePath: string,
        caption: string
    ): Promise<SendMessageResult> =>
        postForm("/send-file-caption", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            file_path: filePath,
            caption,
        }),


    // ── Bulk endpoints ────────────────────────────────────────────────────

    /** POST /bulk-send-messages — JSON (array of messages) */
    bulkSendMessages: async (
        deviceId: string,
        deviceName: string,
        message: string,
        recipients: string[],
        waitForDelivery = true,
        maxWaitTime = 30
    ): Promise<BulkSendResult> => {
        const payload = {
            id: deviceId,
            name: deviceName,
            messages: recipients.map(r => ({ number: r, message })),
            wait_for_delivery: waitForDelivery,
            max_wait_time: maxWaitTime,
        };
        const response = await axios.post("/unofficial/bulk-send-messages", payload);
        return response.data;
    },

    /** POST /bulk-send-files — FormData (comma-separated recipients) */
    bulkSendFiles: (
        deviceId: string,
        deviceName: string,
        filePath: string,
        recipients: string[],
        waitForDelivery = true,
        maxWaitTime = 30
    ): Promise<BulkSendResult> =>
        postForm("/bulk-send-files", {
            device_id: deviceId,
            device_name: deviceName,
            file_path: filePath,
            recipients_raw: recipients.join(","),
            wait_for_delivery: waitForDelivery,
            max_wait_time: maxWaitTime,
        }),

    /** POST /bulk-send-files-with-text — FormData (message + optional file) */
    bulkSendFilesWithText: (
        deviceId: string,
        deviceName: string,
        message: string,
        recipients: string[],
        filePath?: string,
        waitForDelivery = true,
        maxWaitTime = 30
    ): Promise<BulkSendResult> => {
        const fields: Record<string, string | boolean | number> = {
            device_id: deviceId,
            device_name: deviceName,
            text: message,
            recipients_raw: recipients.join(","),
            wait_for_delivery: waitForDelivery,
            max_wait_time: maxWaitTime,
        };
        if (filePath) fields.file_path = filePath;
        return postForm("/bulk-send-files-with-text", fields);
    },

    // ── Query endpoints ───────────────────────────────────────────────────

    /** GET /delivery-report */
    getDeliveryReport: (
        deviceId: string,
        deviceName: string,
        messageId: string
    ): Promise<DeliveryReport> =>
        getQuery("/delivery-report", {
            device_id: deviceId,
            device_name: deviceName,
            message_id: messageId,
        }),

    /** GET /status-check */
    statusCheck: (
        deviceId: string,
        deviceName: string
    ): Promise<StatusCheckResult> =>
        getQuery("/status-check", {
            device_id: deviceId,
            device_name: deviceName,
        }),

    // ── GET variants of send endpoints (query-param based) ────────────────

    /** GET /send-message-query */
    sendMessageQuery: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        message: string,
        waitForDelivery = false,
        maxWaitTime = 30
    ): Promise<SendMessageResult> =>
        getQuery("/send-message-query", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            message,
            wait_for_delivery: String(waitForDelivery),
            max_wait_time: String(maxWaitTime),
        }),

    /** GET /send-file (query params) */
    sendFileQuery: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        filePath: string
    ): Promise<SendMessageResult> =>
        getQuery("/send-file", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            file_path: filePath,
        }),

    /** GET /send-file-text (query params) */
    sendFileTextQuery: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        filePath: string,
        message: string
    ): Promise<SendMessageResult> =>
        getQuery("/send-file-text", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            file_path: filePath,
            message,
        }),

    /** GET /send-file-caption (query params) */
    sendFileCaptionQuery: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        filePath: string,
        caption: string
    ): Promise<SendMessageResult> =>
        getQuery("/send-file-caption", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            file_path: filePath,
            caption,
        }),

    /** GET /send-file-query (query params alias) */
    sendFileQueryAlias: (
        deviceId: string,
        deviceName: string,
        receiverNumber: string,
        filePath: string
    ): Promise<SendMessageResult> =>
        getQuery("/send-file-query", {
            device_id: deviceId,
            device_name: deviceName,
            receiver_number: receiverNumber,
            file_path: filePath,
        }),
};

export default unofficialApiService;
