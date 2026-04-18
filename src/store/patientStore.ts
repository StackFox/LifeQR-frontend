import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'DOCTOR' | 'PATIENT';
    hospitalId?: string;
    isVerifiedDoctor?: boolean;
    avatarUri?: string;
}

interface PatientStoreState {
    offlinePayload: any | null;
    user: User | null;
    setOfflinePayload: (data: any) => void;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const usePatientStore = create<PatientStoreState>((set) => ({
    offlinePayload: null,
    user: null,
    setOfflinePayload: (data) => set({ offlinePayload: data }),
    setUser: (user) => set({ user }),
    logout: () => set({ user: null, offlinePayload: null }),
}));
