import { create } from 'zustand';

interface ToastState {
    visible: boolean;
    message: string;
    duration: number;
    showToast: (message: string, duration?: number) => void;
    hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
    visible: false,
    message: '',
    duration: 2500,
    showToast: (message, duration = 2500) => {
        set({ visible: true, message, duration });
    },
    hideToast: () => {
        set({ visible: false });
    },
}));
