import React, { useEffect, useState } from "react";
import { Toast as ToastType } from "../types";
import { Check, AlertCircle, Info, X } from "lucide-react";

interface ToastProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-10 right-0 left-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastType;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300); // Wait for animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <Check size={14} className="text-green-500" />;
      case "error":
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return <Info size={14} className="text-blue-500" />;
    }
  };

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-2.5 
        bg-surface border border-border rounded-full shadow-xl 
        text-sm font-medium text-text backdrop-blur-md
        transition-all duration-300 ease-out transform
        ${isExiting ? "opacity-0 translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-2 fade-in"}
      `}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <span>{toast.message}</span>
      <button
        onClick={handleDismiss}
        className="ml-2 text-muted hover:text-text transition-colors p-0.5 rounded-full hover:bg-background"
      >
        <X size={12} />
      </button>
    </div>
  );
};
