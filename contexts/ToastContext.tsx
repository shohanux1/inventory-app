import React, { createContext, useState, useContext, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, action?: { label: string; onPress: () => void }) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: '',
    type: 'info' as ToastType,
    action: undefined as { label: string; onPress: () => void } | undefined,
  });

  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info',
    action?: { label: string; onPress: () => void }
  ) => {
    setToastConfig({
      visible: true,
      message,
      type,
      action,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={hideToast}
        action={toastConfig.action}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}