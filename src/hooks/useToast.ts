import { useCallback } from 'react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export const useToast = () => {
  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const options = duration ? { duration } : {};

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      case 'info':
      default:
        toast.info(message, options);
        break;
    }
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    toast.success(message, duration ? { duration } : {});
  }, []);

  const showError = useCallback((message: string, duration?: number) => {
    toast.error(message, duration ? { duration } : {});
  }, []);

  const showWarning = useCallback((message: string, duration?: number) => {
    toast.warning(message, duration ? { duration } : {});
  }, []);

  const showInfo = useCallback((message: string, duration?: number) => {
    toast.info(message, duration ? { duration } : {});
  }, []);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
