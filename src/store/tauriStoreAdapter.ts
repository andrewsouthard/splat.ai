import { load } from '@tauri-apps/plugin-store';

// Create a new store or load the existing one,
const tauriStore = await load('splat.json', { autoSave: false });

// Custom storage adapter that uses Tauri's Store API
export default function createTauriStoreAdapter(prefix: string) {
    return {
        getItem: async (name: string): Promise<string | null> => {
            const value = await tauriStore.get(`${prefix}-${name}`)
            return value !== null ? String(value) : null
        },
        setItem: async (name: string, value: string): Promise<void> => {
            await tauriStore.set(`${prefix}-${name}`, value)
            await tauriStore.save()
        },
        removeItem: async (name: string): Promise<void> => {
            await tauriStore.delete(`${prefix}-${name}`)
            await tauriStore.save()
        },
    }
}
