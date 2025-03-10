import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

type SearchMode = "none" | "single" | "all";

interface SettingsState {
    apiUrl: string;
    globalShortcut: string;
    selectedModel: string;
    availableModels: string[];
    searchConversationMode: SearchMode;
    setApiUrl: (url: string) => void;
    setGlobalShortcut: (shortcut: string) => void;
    setSelectedModel: (model: string) => void;
    setAvailableModels: (models: string[]) => void;
    setSearchConversationMode: (mode: SearchMode) => void;
    toggleSingleConversationMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            apiUrl: "http://localhost:11434",
            globalShortcut: "None",
            selectedModel: "",
            availableModels: [],
            searchConversationMode: "none",
            setApiUrl: (url: string) => set({ apiUrl: url }),
            setGlobalShortcut: (shortcut: string) => set({ globalShortcut: shortcut }),
            setSelectedModel: (model: string) => set({ selectedModel: model }),
            setAvailableModels: (models: string[]) => set({ availableModels: models }),
            setSearchConversationMode: (mode: SearchMode) => set({ searchConversationMode: mode }),
            toggleSingleConversationMode: () => set((state) => ({
                searchConversationMode: state.searchConversationMode === 'none' ? 'single' : "none"
            }))
        }), {
        name: 'settings-storage',
        storage: createJSONStorage(() => window.localStorage),
    }
    )
);
