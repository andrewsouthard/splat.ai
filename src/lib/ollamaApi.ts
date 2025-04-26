import { useSettingsStore } from "@/store/settingsStore"

export async function toggleModel(modelName: string, action: "load" | "unload") {
    const apiUrl = useSettingsStore.getState().apiUrl;
    const options = {
        "model": modelName,
        "messages": [],
        "keep_alive": 300
    }
    if (action === 'unload') {
        options.keep_alive = 0;
    }
    await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
    }
    )
}