import toast from "react-hot-toast";

export const showToast = {
    success: (message: string) => {
        toast.success(message, {
            style: {
                background: '#10B981',
                color: '#fff',
            },
        });
    },

    error: (message: string) => {
        toast.error(message, {
            style: {
                background: '#EF4444',
                color: '#fff',
            },
        });
    },

    loading: (message: string) => {
        return toast.loading(message);
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(promise, messages);
    },

    custom: (message: string, icon?: string) => {
        toast(message, {
            icon: icon || '👏',
        });
    },
};
