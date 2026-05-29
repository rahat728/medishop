import toast from 'react-hot-toast';

/**
 * Standardized toast notification utility
 */
export const showToast = {
    success: (message: string) => {
        toast.success(message, {
            style: {
                borderRadius: '12px',
                background: '#333',
                color: '#fff',
            },
            duration: 3000,
        });
    },
    error: (message: string) => {
        toast.error(message, {
            style: {
                borderRadius: '12px',
                background: '#ef4444',
                color: '#fff',
            },
            duration: 4000,
        });
    },
    promise: <T>(
        promise: Promise<T>,
        messages: { loading: string; success: string; error: string }
    ) => {
        return toast.promise(
            promise,
            {
                loading: messages.loading,
                success: messages.success,
                error: messages.error,
            },
            {
                style: {
                    borderRadius: '12px',
                },
            }
        );
    },
    loading: (message: string) => {
        return toast.loading(message, {
            style: {
                borderRadius: '12px',
            },
        });
    },
    dismiss: (toastId?: string) => {
        toast.dismiss(toastId);
    },
};
