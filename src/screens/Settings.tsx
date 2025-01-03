import { useEffect, useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";
import { open } from "@tauri-apps/plugin-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProjectSettings from "@/elements/ProjectSettings";
import { Checkbox } from "@/components/ui/checkbox";

export default function Settings() {
    const {
        apiUrl,
        availableModels,
        selectedModel,
        setApiUrl,
        setSelectedModel,
        setAvailableModels,
    } = useSettingsStore();
    const [setConversations, addConversation] = useConversationStore(
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

    const openModelsPage = async () => {
        try {
            await open("https://ollama.ai/models");
        } catch (error) {
            console.error("Error opening models page:", error);
        }
    }

    return (
        <div className="bg-gray-200 p-4 h-screen w-full">
            <Tabs defaultValue="general" className="w-full flex flex-col items-center">
                <TabsList className="w-fit-content mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="w-full flex flex-col px-8">
                    <div className="mb-4 w-fit-content">
                        <Label className="font-bold" htmlFor="new-model-input">Pull New Model</Label>
                        <div className="flex items-center">
                            <Input
                                id="new-model-input"
                                type="text"
                                value={newModelName}
                                onChange={(e) => setNewModelName(e.target.value)}
                                placeholder="e.g., llama3.2"
                                className="bg-white w-[300px] mt-1"
                            />
                            {newModelName &&
                                <Button
                                    variant="ghost"
                                    onClick={pullModel}
                                    disabled={isPullingModel}
                                    className="ml-2 disabled:opacity-50"
                                >
                                    {isPullingModel ? "Pulling..." : "Pull"}
                                </Button>}
                        </div>
                        <p className="mt-2 ml-1 text-xs">A full list of models can be found <button className="underline" onClick={openModelsPage}>here</button>.</p>
                    </div>
                    <div>
                        <Label className="font-bold" htmlFor="uri-input">API</Label>
                        <Input
                            placeholder="API"
                            name="url-input"
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            className="bg-white w-[300px] mt-1"
                        />
                    </div>
                    <div className="flex items-center space-x-2 my-4">
                        <Label
                            htmlFor="terms"
                            className="mt-1 mr-8 font-normal text-medium text-black"
                        >
                            Enable Option+Space as keyboard shortcut 
                        </Label>
                        <Checkbox id="terms" className="bg-white" />
                    </div>
                    <Button className="mt-4 bg-blue-500 hover:bg-blue-600 mx-auto w-fit" onClick={clearConversations}>Delete All Conversations</Button>
                </TabsContent>
                <TabsContent value="projects" className="w-full">
                    <ProjectSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}