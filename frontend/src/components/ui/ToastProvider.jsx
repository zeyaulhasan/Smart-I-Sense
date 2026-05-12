import { createContext, useContext, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts((prev) => {
      const next = [...prev, { id, type, message, duration }];
      return next.length > 5 ? next.slice(-5) : next;
    });
    return id;
  }, []);

  const contextValue = useMemo(() => ({
    success: (msg, dur) => addToast('success', msg, dur),
    error:   (msg, dur) => addToast('error', msg, dur),
    warning: (msg, dur) => addToast('warning', msg, dur),
    info:    (msg, dur) => addToast('info', msg, dur),
    dismiss,
  }), [addToast, dismiss]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-auto">
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <Toast key={t.id} {...t} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
