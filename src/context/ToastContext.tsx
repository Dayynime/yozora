import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextType {
  showToast: (text: string, actionText?: string, onAction?: () => void, duration?: number) => void;
  hideToast: (id: string) => void;
  toasts: ToastMessage[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (text: string, actionText?: string, onAction?: () => void, duration: number = 3500) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = {
        id,
        text,
        actionText,
        onAction,
        duration,
      };

      setToasts((prev) => [...prev.slice(-2), newToast]); // keep max 2

      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
