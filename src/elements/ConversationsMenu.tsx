import { PlusCircle } from "lucide-react";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/shallow";
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import clsx from "clsx";

interface ConversationsMenuProps {
  isMenuOpen: boolean;
}


export default function ConversationsMenu({
  isMenuOpen,
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
    const unlisten = listen('new-conversation', () => {
      addConversation();
    });
    return () => {
      unlisten.then(unlistenFn => unlistenFn())
    }
  }, [])

  useEffect(() => {
    if (conversations.length === 0) {
      addConversation();
    }
  }, [conversations]);

  const onAddConversation = () => {
    addConversation();
  };

  const onConversationClick = (id: string) => {
    setActiveConversationId(id);
  };

  return (
    <div
      className={
        clsx(`z-10 bg-white shadow-lg overflow-y-scroll max-w-[280px]`, { "h-full w-full": isMenuOpen, "w-0 h-0": !isMenuOpen })
      }
    >
      {conversations
        .map((convo, index) => (
          <button
            key={index}
            onClick={() => onConversationClick(convo.id)}
            className={
              clsx(`w-full p-3 text-left border-b flex items-center gap-2 rounded-sm`, { "bg-blue-500 text-white": convo.id === activeConversationId })
            }
          >
            <div className="flex-grow">{convo.summary}</div>
          </button>
        ))
        .reverse()}
      <button
        onClick={onAddConversation}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <PlusCircle className="h-5 w-5" />
        <span>New Conversation</span>
      </button>
    </div>
  );
}
