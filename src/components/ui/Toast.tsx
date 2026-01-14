"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "info",
  duration = 5000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[type];

  const icon = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg animate-slide-up max-w-md`}
      role="alert"
    >
      <span className="text-xl font-bold">{icon}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors font-bold text-lg leading-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
