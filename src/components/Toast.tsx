import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

export function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-success-50 border-success-500 text-success-800',
    error: 'bg-error-50 border-error-500 text-error-800',
    info: 'bg-primary-50 border-primary-500 text-primary-800',
  };

  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border-l-4 ${styles[toast.type]} px-4 py-3 shadow-lg animate-slide-up`}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
