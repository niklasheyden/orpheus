import React, { useEffect, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  showToast: (message) => {
    set({ message });
    setTimeout(() => {
      set({ message: null });
    }, 3000);
  },
  hideToast: () => set({ message: null }),
}));

const Toast = () => {
  const { message, hideToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(hideToast, 300); // Wait for fade out animation
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, hideToast]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      } bg-slate-800 border border-slate-700/50 text-white backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;