import React, { createContext, useContext, useState } from 'react';

interface ToastContextType {
  showToast: (message: string) => void;
  message: string | null;
  isVisible: boolean;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showToast = (newMessage: string) => {
    setMessage(newMessage);
    setIsVisible(true);

    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setMessage(null), 300); // Clear message after fade out
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast, message, isVisible }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 