import { PanelLeft, Trash2, MailPlus } from "lucide-react";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";

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

      <button className="ml-auto" onClick={addConversation}>
        <MailPlus className="h-5 w-5 stroke-width-1" />
      </button>
      <button className="ml-4" onClick={removeConversation}>
        <Trash2 className="h-5 w-5 stroke-width-1" />
      </button>
    </div>
  );
};

export default Toolbar;
