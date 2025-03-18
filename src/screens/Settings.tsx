import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";
import { open } from "@tauri-apps/plugin-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProjectSettings from "@/elements/ProjectSettings";
import { useGetModelsApi, useStreamingModelPullApi } from "@/hooks/useApi";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GLOBAL_SHORTCUT_OPTIONS = ["None", "Option+Space", "Ctrl+Option+Space"];

export default function Settings() {
  const {
    apiUrl,
    globalShortcut,
    availableModels,
    selectedModel,
    setApiUrl,
    setSelectedModel,
    setGlobalShortcut,
  } = useSettingsStore();
  const [setConversations, addConversation] = useConversationStore(
    useShallow((state) => [state.setConversations, state.addConversation])
  );
  const [newModelName, setNewModelName] = useState("");
  const [isPullingModel, setIsPullingModel] = useState(false);
  const [pullProgress, setPullProgress] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pullModel = useStreamingModelPullApi(
    abortControllerRef,
    setPullProgress
  );
  const getModels = useGetModelsApi();

  useEffect(() => {
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

  const onPullModel = async () => {
    if (!newModelName) return;
    setIsPullingModel(true);
    try {
      await pullModel(newModelName);
      toast(`${newModelName} successfully pulled.`);
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
  };

  const onChangeShortcut = (value: string) => {
    setGlobalShortcut(value);
    toast(`Global shortcut set to ${value}. Please restart the app.`);
  };

  return (
    <div className="bg-gray-200 p-4 h-screen w-full">
      <Tabs
        defaultValue="general"
        className="w-full flex flex-col items-center"
      >
        <TabsList className="w-fit-content mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="w-full flex flex-col px-8">
          <div className="w-fit-content">
            <Label className="font-bold" htmlFor="new-model-input">
              Pull New Model
            </Label>
            <p className="text-xs">
              A full list of models can be found{" "}
              <button className="underline" onClick={openModelsPage}>
                here
              </button>
              .
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-start">
                <div>
                  <Input
                    id="new-model-input"
                    type="text"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="e.g., llama2"
                    className="bg-white w-[300px] mt-1"
                  />
                  {isPullingModel ? (
                    <Progress
                      value={pullProgress}
                      className="w-[300px] rounded mt-1"
                    />
                  ) : (
                    <div className="h-2 mt-1" />
                  )}
                </div>
                {newModelName && (
                  <Button
                    onClick={onPullModel}
                    disabled={isPullingModel}
                    className="ml-1 mt-[3px] bg-blue-500 hover:bg-blue-600"
                  >
                    Pull
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label className="font-bold" htmlFor="uri-input">
              API
            </Label>
            <Input
              placeholder="API"
              name="url-input"
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="bg-white w-[300px] mt-1"
            />
          </div>
          <div className="flex flex-col my-4">
            <Label htmlFor="shortcut-input" className="font-bold mt-1 mb-2">
              Keyboard shortcut
            </Label>
            <Select
              name="shortcut-input"
              value={globalShortcut}
              onValueChange={onChangeShortcut}
            >
              <SelectTrigger className="bg-white w-[180px]">
                <SelectValue placeholder="Select keybord shortcut" />
              </SelectTrigger>
              <SelectContent>
                {GLOBAL_SHORTCUT_OPTIONS.map((keyCombo) => (
                  <SelectItem key={keyCombo} value={keyCombo}>
                    {keyCombo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="mt-2 bg-blue-500 hover:bg-blue-600 w-fit"
            onClick={clearConversations}
          >
            Delete All Conversations
          </Button>
        </TabsContent>
        <TabsContent value="projects" className="w-full">
          <ProjectSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
