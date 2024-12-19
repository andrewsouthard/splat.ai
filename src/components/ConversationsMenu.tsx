import { PlusCircle } from "lucide-react";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/shallow";
import { useEffect } from "react";

interface ConversationsMenuProps {
  isMenuOpen: boolean;
  toggleSidebar: () => void;
}

export default function ConversationsMenu({
  isMenuOpen,
  toggleSidebar,
}: ConversationsMenuProps) {
  const {
    conversations,
    setActiveConversationId,
    activeConversationId,
    addConversation,
  } = useConversationStore(
    useShallow((state) => ({
      conversations: state.conversations,
      setActiveConversationId: state.setActiveConversationId,
      activeConversationId: state.activeConversationId,
      addConversation: state.addConversation,
    }))
  );

  useEffect(() => {
    if (conversations.length === 0) {
      addConversation();
    }
  }, [conversations]);

  return (
    <div
      onMouseLeave={toggleSidebar}
      className={`p-4 fixed top-0 left-0 w-64 h-screen bg-white shadow-lg transition-transform duration-100 ease-in-out overflow-y-scroll ${
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {conversations
        .map((convo, index) => (
          <button
            key={index}
            onClick={() => setActiveConversationId(convo.id)}
            className={`w-full p-3 text-left border-b flex items-center gap-2 rounded-sm ${
              convo.id === activeConversationId ? "bg-blue-500 text-white" : ""
            }`}
          >
            <div className="flex-grow">{convo.summary}</div>
          </button>
        ))
        .reverse()}
      <button
        onClick={addConversation}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <PlusCircle className="h-5 w-5" />
        <span>New Conversation</span>
      </button>
    </div>
  );
}
