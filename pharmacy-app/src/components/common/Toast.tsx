import React, { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number; // Auto close time in ms
  onClose: () => void;
};

export default function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors: Record<string, string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600",
  };

  return (
    <div
      className={`fixed top-5 right-5 px-4 py-2 rounded text-white shadow-lg z-50 animate-fade-in ${colors[type]}`}
    >
      {message}
    </div>
  );
}
