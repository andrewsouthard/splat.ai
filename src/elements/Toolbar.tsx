import { PanelLeft, Trash2, Settings, MailPlus } from "lucide-react";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";
import { Dispatch, SetStateAction } from "react";

interface ToolbarProps {
  toggleSidebar: () => void;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
}

const Toolbar = ({ toggleSidebar, setShowSettings }: ToolbarProps) => {
  const [addConversation, deleteActiveConversation] = useConversationStore(
    useShallow((state) => [
      state.addConversation,
      state.deleteActiveConversation
    ])
  );


  const removeConversation = () => {
    deleteActiveConversation();
  }


  return (
    <div className="flex justify-between items-center p-2 bg-gray-100 text-blue-500">
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
        onClick={() => setShowSettings((prev: boolean) => !prev)}
        className="flex items-center"
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toolbar;
