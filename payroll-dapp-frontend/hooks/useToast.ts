// src/hooks/useToast.ts
import toast from 'react-hot-toast';

export const useToast = () => {
    const loading = (msg: string) => toast.loading(msg);
    const success = (msg: string) => toast.success(msg);
    const error = (msg: string) => toast.error(msg);
    const dismiss = (id: string) => toast.dismiss(id);

    return { loading, success, error, dismiss };
};