import { PanelLeft, Trash2, Settings, MailPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";

interface ToolbarProps {
  toggleSidebar: () => void;
}

const Toolbar = ({ toggleSidebar }: ToolbarProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    apiUrl,
    availableModels,
    selectedModel,
    setApiUrl,
    setSelectedModel,
    setAvailableModels,
  } = useSettingsStore();
  const [setConversations, addConversation, deleteActiveConversation] = useConversationStore(
    useShallow((state) => [
      state.setConversations,
      state.addConversation,
      state.deleteActiveConversation
    ])
  );

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

  const removeConversation = () => {
    deleteActiveConversation();
  }

  return (
    <div className="flex justify-between items-center p-2 bg-[rgba(84,84,84,1)">
      <button onClick={toggleSidebar} className="flex items-center h-5 w-5">
        <PanelLeft className="h-5 w-5 stroke-width-1" />
      </button>

      <button className="ml-auto mr-1" onClick={addConversation}>
        <MailPlus className="h-5 w-5 stroke-width-1" />
      </button>
      <button className="mx-4" onClick={removeConversation}>
        <Trash2 className="h-5 w-5 stroke-width-1" />
      </button>
      <button
        onClick={() => setShowSettings((prev) => !prev)}
        className="flex items-center"
      >
        <Settings className="h-5 w-5 stroke-width-1" />
      </button>

      {showSettings && (
        <div className="absolute top-12 right-0 bg-white shadow-lg p-4 rounded">
          <div className="mb-4">
            <label htmlFor="model-select">Model</label>
            <select
              className="ml-2 border rounded p-1"
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {availableModels.map((model: string) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
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
          <button onClick={clearConversations}>Clear Conversations</button>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
