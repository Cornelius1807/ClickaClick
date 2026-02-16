import { create } from 'zustand';
import type { Session, DeviceType, ChatMessage } from '@/types';

interface AppStore {
  // Session
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;

  // Device selection
  deviceSelected: DeviceType | null;
  setDeviceSelected: (device: DeviceType) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  isSEQShown: boolean;
  setIsSEQShown: (shown: boolean) => void;

  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;

  fontScale: number;
  setFontScale: (scale: number) => void;

  // Scrolled after welcome
  scrolledPastWelcome: boolean;
  setScrolledPastWelcome: (scrolled: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),

  deviceSelected: null,
  setDeviceSelected: (device) => set({ deviceSelected: device }),

  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  isSEQShown: false,
  setIsSEQShown: (shown) => set({ isSEQShown: shown }),

  darkMode: false,
  setDarkMode: (dark) => set({ darkMode: dark }),

  fontScale: 1,
  setFontScale: (scale) => set({ fontScale: Math.max(0.8, Math.min(2, scale)) }),

  scrolledPastWelcome: false,
  setScrolledPastWelcome: (scrolled) =>
    set({ scrolledPastWelcome: scrolled }),
}));
