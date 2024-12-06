import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
    apiUrl: string;
    selectedModel: string;
    availableModels: string[];
    setApiUrl: (url: string) => void;
    setSelectedModel: (model: string) => void;
    setAvailableModels: (models: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            apiUrl: "http://localhost:11434",
            selectedModel: "",
            availableModels: [],
            setApiUrl: (url: string) => set({ apiUrl: url }),
            setSelectedModel: (model: string) => set({ selectedModel: model }),
            setAvailableModels: (models: string[]) => set({ availableModels: models }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);
