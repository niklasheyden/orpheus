import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

export interface ToastMessage {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  showToast: (toast: ToastMessage) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showToast = (newToast: ToastMessage) => {
    setToast(newToast);
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setToast(null), 300);
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 transition-all duration-300 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <div className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border ${
            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
            toast.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
            toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
            'bg-sky-500/10 border-sky-500/20'
          }`}>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-emerald-400' :
                toast.type === 'error' ? 'text-red-400' :
                toast.type === 'warning' ? 'text-amber-400' :
                'text-sky-400'
              }`}>
                {toast.title}
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;