import { useEffect, useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";

export default function Settings() {
    const {
        apiUrl,
        availableModels,
        selectedModel,
        setApiUrl,
        setSelectedModel,
        setAvailableModels,
    } = useSettingsStore();
    const [setConversations, addConversation ] = useConversationStore(
        useShallow((state) => [
          state.setConversations,
          state.addConversation,
        ])
      );
    const [newModelName, setNewModelName] = useState("");
    const [isPullingModel, setIsPullingModel] = useState(false);

    useEffect(() => {
        const getModels = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/tags`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const { models } = await response.json();
                setAvailableModels(
                    models.map((m: { name: string }) => m.name.replace(":latest", ""))
                );
            } catch (error) {
                console.error("Error fetching models:", error);
            }
        };
        getModels();
    }, [apiUrl]);

    useEffect(() => {
        if (
            availableModels.length > 0 &&
            !(selectedModel && availableModels.includes(selectedModel))
        ) {
            setSelectedModel(availableModels[0]);
        }
    }, [availableModels]);

    const clearConversations = () => {
        setConversations([]);
        addConversation();
    };

    const pullModel = async () => {
        if (!newModelName) return;
        
        setIsPullingModel(true);
        try {
            const response = await fetch(`${apiUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'appliction/json',

                },
                body: JSON.stringify({ name: newModelName, stream: false }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Refresh the model list after pulling
            const modelsResponse = await fetch(`${apiUrl}/api/tags`);
            if (modelsResponse.ok) {
                const { models } = await modelsResponse.json();
                setAvailableModels(
                    models.map((m: { name: string }) => m.name.replace(":latest", ""))
                );
            }
            
            setNewModelName("");
        } catch (error) {
            console.error("Error pulling model:", error);
        } finally {
            setIsPullingModel(false);
        }
    };

    return (
        <div className="bg-gray-200 p-4 h-screen w-full">
            <div className="mb-4">
                <label htmlFor="new-model-input">Pull New Model</label>
                <div className="flex items-center">
                    <input
                        id="new-model-input"
                        type="text"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="e.g., llama3.2"
                        className="ml-2 border rounded p-1 flex-grow"
                    />
                    <button
                        onClick={pullModel}
                        disabled={isPullingModel || !newModelName}
                        className="ml-2 bg-blue-500 text-white px-4 py-1 rounded disabled:opacity-50"
                    >
                        {isPullingModel ? "Pulling..." : "Pull"}
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="url-input">API</label>
                <input
                    id="url-input"
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="ml-2 border rounded p-1"
                />
            </div>
            <button onClick={clearConversations}>Delete All Conversations</button>
        </div>
    );
}