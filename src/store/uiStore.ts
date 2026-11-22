import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  errorMessage: string | null;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  errorMessage: null,
  setLoading: (isLoading) => set({ isLoading }),
  setError: (errorMessage) => set({ errorMessage }),
}));
