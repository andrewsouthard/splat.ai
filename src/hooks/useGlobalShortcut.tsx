import { useEffect } from "react";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { Window } from "@tauri-apps/api/window";
import { useSettingsStore } from "@/store/settingsStore";

export default function useGlobalShortcut() {
    const { globalShortcut } = useSettingsStore()
    useEffect(() => {
        async function setup() {
            await register(globalShortcut, async () => {
                const currentWindow = await Window.getCurrent();
                currentWindow.setFocus();
            });
        }
        if (globalShortcut !== "None") setup();
        () => {
            if (globalShortcut !== "None") unregister(globalShortcut);
        };
    }, [globalShortcut]);
}