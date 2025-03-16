import { useEffect } from "react";
import { Trash2, MailPlus } from "lucide-react";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore } from "@/store/settingsStore";
import { listen } from "@tauri-apps/api/event";

const Toolbar = () => {
  const [addConversation, deleteActiveConversation] = useConversationStore(
    useShallow((state) => [
      state.addConversation,
      state.deleteActiveConversation,
    ])
  );
  const [toggleSearchConversation] = useSettingsStore(
    useShallow((state) => [state.toggleSearchConversation])
  );

  useEffect(() => {
    const unlisten = listen("find", () => {
      toggleSearchConversation();
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
    <div className="flex justify-between items-center p-2 h-[60px] shadow-sm bg-gray-100 text-blue-500">
      <div className="flex items-center ml-auto">
        <button onClick={addConversation}>
          <MailPlus className="h-5 w-5 stroke-width-1" />
        </button>
        <button className="ml-4" onClick={removeConversation}>
          <Trash2 className="h-5 w-5 stroke-width-1" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
