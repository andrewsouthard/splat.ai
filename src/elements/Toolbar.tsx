import { useEffect } from "react";
import { PanelLeft, Trash2, MailPlus, Search } from "lucide-react";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore } from "@/store/settingsStore";
import { listen } from "@tauri-apps/api/event";

interface ToolbarProps {
  toggleSidebar: () => void;
}

const Toolbar = ({ toggleSidebar }: ToolbarProps) => {
  const [addConversation, deleteActiveConversation] = useConversationStore(
    useShallow((state) => [
      state.addConversation,
      state.deleteActiveConversation,
    ])
  );
  const [toggleSingleConversationMode] = useSettingsStore(
    useShallow((state) => [state.toggleSingleConversationMode])
  );

  useEffect(() => {
    const unlisten = listen("find", () => {
      toggleSingleConversationMode();
    });
    return () => {
      unlisten.then((unlistenFn) => unlistenFn());
    };
  }, []);

  const removeConversation = async () => {
    console.log("removing...");

    // Creates a confirmation Ok/Cancel dialog
    const confirmation = await confirm(
      "Are you sure you want to delete this conversation?",
      { title: "Delete Conversation?", kind: "warning" }
    );

    // Prints boolean to the console
    if (confirmation) {
      deleteActiveConversation();
    }
  };

  return (
    <div className="flex justify-between items-center p-2 bg-gray-100 text-blue-500">
      <button onClick={toggleSidebar} className="flex items-center h-5 w-5">
        <PanelLeft className="h-5 w-5 stroke-width-1" />
      </button>

      <div className="flex items-center ml-auto">
        <button onClick={addConversation}>
          <MailPlus className="h-5 w-5 stroke-width-1" />
        </button>
        <button className="ml-4" onClick={toggleSingleConversationMode}>
          <Search className="h-5 w-5 stroke-width-1" />
        </button>
        <button className="ml-4" onClick={removeConversation}>
          <Trash2 className="h-5 w-5 stroke-width-1" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
