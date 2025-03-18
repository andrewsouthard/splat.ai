import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
    apiUrl: string;
    globalShortcut: string;
    selectedModel: string;
    availableModels: string[];
    isSearchingConversation: boolean;
    setApiUrl: (url: string) => void;
    setGlobalShortcut: (shortcut: string) => void;
    setSelectedModel: (model: string) => void;
    setAvailableModels: (models: string[]) => void;
    toggleSearchConversation: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            apiUrl: "http://localhost:11434",
            globalShortcut: "None",
            selectedModel: "",
            availableModels: [],
            isSearchingConversation: false,
            setApiUrl: (url: string) => set({ apiUrl: url }),
            setGlobalShortcut: (shortcut: string) => set({ globalShortcut: shortcut }),
            setSelectedModel: (model: string) => set({ selectedModel: model }),
            setAvailableModels: (models: string[]) => set({ availableModels: models }),
            toggleSearchConversation: () => set((state) => ({
                isSearchingConversation: !state.isSearchingConversation
            }))
        }), {
        name: 'settings-storage',
        storage: createJSONStorage(() => window.localStorage),
    }
    )
);
