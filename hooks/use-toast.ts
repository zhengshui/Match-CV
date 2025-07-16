import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const toasts: Toast[] = [];
let toastId = 0;

export function useToast() {
  const [, setForceUpdate] = useState(0);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = String(toastId++);
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
    };
    
    toasts.push(newToast);
    setForceUpdate(prev => prev + 1);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        setForceUpdate(prev => prev + 1);
      }
    }, 3000);
    
    return newToast;
  }, []);

  return {
    toast,
    toasts,
  };
}