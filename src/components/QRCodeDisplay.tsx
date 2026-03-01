"use client";

import React, { useEffect, useState, useRef } from "react";
import { deviceService } from "@/services/deviceService";

interface QRCodeDisplayProps {
  deviceId: string;
  userId: string;
  onScanSuccess: (token: string) => void;
}

export default function QRCodeDisplay({
  deviceId,
  userId,
  onScanSuccess,
}: QRCodeDisplayProps) {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isMounted = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    isMounted.current = true;

    let hasStarted = false;

    const scheduleNext = (delay: number) => {
      if (!isMounted.current) return;
      timeoutRef.current = setTimeout(fetchQR, delay);
    };

    const handleConnected = () => {
      setStatus("connected");
      setLoading(false);
      setQrBase64(null);
      setRetryCount(0);
      onScanSuccessRef.current("real_connection_success");
    };

    const fetchQR = async () => {
      if (!isMounted.current) return;

      try {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (!qrBase64) setLoading(true);
        setError(null);

        // ✅ START SESSION FIRST
        if (!hasStarted) {
          try {
            await deviceService.startDevice(deviceId);
          } catch (e) {
            console.warn("Failed to start device session, continuing anyway", e);
          }
          hasStarted = true;
        }

        const data = await deviceService.getQRCode(deviceId, userId);

        if (!isMounted.current) return;

        // ✅ CONNECTED
        if (data.status === "connected") {
          handleConnected();
          return;
        }

        // ✅ QR READY (primary state)
        if ((data.status === "ready" || data.status === "qr_ready") && data.qr_code) {
          setQrBase64(data.qr_code);
          setStatus("scannable");
          setLoading(false);
          setRetryCount(0);
          scheduleNext(3000); // 🔹 KEEP POLLING while waiting for scan
          return;
        }

        // ✅ Pending states
        if (
          data.status === "pending" ||
          data.status === "initializing" ||
          data.status === "connecting" ||
          data.status === "created"
        ) {
          setStatus("initializing");
          scheduleNext(2000); // Poll every 2 seconds as requested
          return;
        }

        // 🚨 LOGGED OUT state
        if (data.status === "logged_out") {
          setQrBase64(null);
          setStatus("logged_out");
          setLoading(false);
          return; // Stop polling completely
        }

        // ✅ Cooldown
        if (data.status === "cooldown") {
          scheduleNext(3000);
          return;
        }

        // ✅ Direct QR fallback
        if (data.qr_code && !data.status) {
          setQrBase64(data.qr_code);
          setStatus("scannable");
          setLoading(false);
          setRetryCount(0);
          scheduleNext(3000); // 🔹 KEEP POLLING
          return;
        }

        // Fallback retry
        scheduleNext(2000);
      } catch (err: any) {
        if (!isMounted.current) return;

        setLoading(false);

        const responseStatus = err.response?.status;

        if (responseStatus === 409) {
          handleConnected();
          return;
        }

        if (responseStatus === 410) {
          setError(
            "Device logged out. Please refresh or create a new device."
          );
          return;
        }

        if (responseStatus === 404) {
          setError("Device not found.");
          return;
        }

        if (
          responseStatus === 429 ||
          responseStatus === 502 ||
          responseStatus === 503 ||
          responseStatus === 500
        ) {
          scheduleNext(5000);
          return;
        }

        if (retryCount > 10) {
          setError("Connection failed. Please try again.");
          return;
        }

        setRetryCount((prev) => prev + 1);
        scheduleNext(5000);
      }
    };

    fetchQR();

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [deviceId, userId]);

  // 🔹 UI STATES

  const getValidImgSrc = (qr: string | null): string | null => {
    if (!qr) return null;
    if (qr.startsWith("qr_code_placeholder_")) return null;
    if (qr.startsWith("data:image/")) return qr;

    // Basic sanity check for valid base64 string
    if (/^[A-Za-z0-9+/=]+$/.test(qr) && qr.length > 20) {
      return `data:image/png;base64,${qr}`;
    }

    return null;
  };

  const imgSrc = getValidImgSrc(qrBase64);

  if (status === "initializing" && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="text-gray-500">Initializing Connection...</p>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="text-green-600 font-bold text-xl">
          ✅ Connected!
        </div>
        <p className="text-gray-500">Redirecting...</p>
      </div>
    );
  }

  if (status === "logged_out") {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-red-50 p-6 rounded-xl border border-red-200">
        <div className="text-red-600 font-bold text-lg text-center">
          ⚠️ Device logged out from mobile device. Please reconnect.
        </div>
        <p className="text-sm text-red-500 text-center max-w-sm">
          You requested a logout from your WhatsApp app. You will need to refresh this page and generate a new QR code to link again.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10 px-4">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-inner border relative">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="WhatsApp QR"
            className="w-64 h-64 object-contain"
          />
        ) : (
          <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-gray-400">
            <div className="animate-pulse">
              {qrBase64?.startsWith("qr_code_placeholder_")
                ? "Waiting for QR Code generation..."
                : "Loading QR..."}
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-gray-600">
        Open WhatsApp → Settings → Linked Devices → Link a Device
      </div>
    </div>
  );
}