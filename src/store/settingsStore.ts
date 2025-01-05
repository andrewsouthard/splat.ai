import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
    apiUrl: string;
    globalShortcut: string;
    selectedModel: string;
    availableModels: string[];
    setApiUrl: (url: string) => void;
    setGlobalShortcut: (shortcut: string) => void;
    setSelectedModel: (model: string) => void;
    setAvailableModels: (models: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            apiUrl: "http://localhost:11434",
            globalShortcut: "None",
            selectedModel: "",
            availableModels: [],
            setApiUrl: (url: string) => set({ apiUrl: url }),
            setGlobalShortcut: (shortcut: string) => set({ globalShortcut: shortcut }),
            setSelectedModel: (model: string) => set({ selectedModel: model }),
            setAvailableModels: (models: string[]) => set({ availableModels: models }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);
