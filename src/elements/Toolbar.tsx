import { useEffect, useState } from "react";
import { Trash2, MailPlus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore } from "@/store/settingsStore";
import { listen } from "@tauri-apps/api/event";
import { Message } from "@/types";

const Toolbar = () => {
  const [
    addConversation,
    deleteActiveConversation,
    currentConversationMessages,
  ] = useConversationStore(
    useShallow((state) => [
      state.addConversation,
      state.deleteActiveConversation,
      state.conversationMessages(),
    ])
  );
  const [toggleSearchConversation] = useSettingsStore(
    useShallow((state) => [state.toggleSearchConversation])
  );
  const [latestMessage, setLatestMessage] = useState<Message>();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    const lastMessage =
      currentConversationMessages[currentConversationMessages.length - 1];
    if (
      latestMessage?.id !== lastMessage?.id &&
      lastMessage?.complete &&
      lastMessage?.inputTokens
    ) {
      setLatestMessage(lastMessage);
    } else if (lastMessage == null) {
      setLatestMessage(undefined);
    }
  }, [currentConversationMessages]);

  useEffect(() => {
    const unlisten = listen("find", () => {
      toggleSearchConversation();
    });
    return () => {
      unlisten.then((unlistenFn) => unlistenFn());
    };
  }, []);

  const removeConversation = async () => {
    // Creates a confirmation Ok/Cancel dialog
    const confirmation = await confirm(
      "Are you sure you want to delete this conversation?",
      { title: "Delete Conversation?", kind: "warning" }
    );

    if (confirmation) {
      deleteActiveConversation();
    }
  };

  const toggleTooltip = () => {
    if (tooltipOpen) {
      setTooltipOpen(false);
    } else if (latestMessage) {
      setTooltipOpen(true);
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
        <TooltipProvider>
          <Tooltip delayDuration={0} open={tooltipOpen}>
            <TooltipTrigger
              asChild
              onMouseEnter={toggleTooltip}
              onMouseLeave={toggleTooltip}
            >
              <button className="ml-4 mr-1">
                <Info className="h-5 w-5 stroke-width-1" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Conversation Tokens:{" "}
                {(latestMessage?.inputTokens ?? 0) +
                  (latestMessage?.tokens ?? 0)}
              </p>
              <p>Tokens/s: {latestMessage?.tokensPerSecond ?? 0}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Toolbar;
