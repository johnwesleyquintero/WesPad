import { useState, useCallback } from "react";
import { Toast } from "../types";

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToasts((prev) => [
        ...prev,
        { id: Date.now().toString(), message, type },
      ]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};
