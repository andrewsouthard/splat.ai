import { useState, useRef, useEffect } from "react";
import ScrollContainer from "@/elements/ScrollContainer";
import ChatMessage from "@/elements/ChatMessage";
import { useConversationStore } from "@/store/conversationStore";
import { Message } from "@/types";
import { useShallow } from "zustand/react/shallow";
import ConversationsMenu from "@/elements/ConversationsMenu";
import { debounce } from "lodash-es";
import InputArea from "@/elements/InputArea";
import { useStreamingChatApi } from "@/hooks/useApi";
import useGlobalShortcut from "@/hooks/useGlobalShortcut";

export default function Home({ isMenuOpen }: { isMenuOpen: boolean }) {
  const [
    conversations,
    activeConversationId,
    setActiveConversationId,
    setConversationMessages,
    updateConversationSummary,
  ] = useConversationStore(
    useShallow((state) => [
      state.conversations,
      state.activeConversationId,
      state.setActiveConversationId,
      state.setConversationMessages,
      state.updateConversationSummary,
    ])
  );
  const debouncedSetMessages = debounce(setConversationMessages);
  const [isLoading, setIsLoading] = useState(false);
  const keepStreamingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, setMessages, sendMessage } =
    useStreamingChatApi(keepStreamingRef);
  useGlobalShortcut();

  useEffect(() => {
    if (!conversations.length) {
      return;
    }
    if (!activeConversationId) {
      switchConversation(conversations[0].id);
    } else {
      switchConversation(activeConversationId);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) switchConversation(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    debouncedSetMessages(messages);
  }, [messages]);

  const stopResponse = () => {
    keepStreamingRef.current = false;
  };

  const onSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    const activeConvo = conversations.find(
      (c) => c.id === activeConversationId
    );
    if (activeConvo && messages.length === 0) {
      // set the summary of the active conversation to the input message via setConversations
      // this will trigger a re-render of the conversation list
      const summary = message.trim().substring(0, 100);
      updateConversationSummary(activeConvo.id, summary);
    }

    try {
      setIsLoading(true);
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
        complete: true,
      };
      await sendMessage(newMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const switchConversation = (id: string) => {
    const newConvo = conversations.find((c) => c.id === id);
    setActiveConversationId(id);
    setMessages(newConvo?.messages || []);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex-row flex flex-grow overflow-y-hidden relative">
      <ConversationsMenu isMenuOpen={isMenuOpen} />
      <div className="flex flex-col overflow-y-hidden mt-1 w-full">
        <ScrollContainer
          messages={messages}
          className="mt-auto p-4 space-y-4 flex-col"
        >
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="relative flex items-center p-4 w-fit rounded-xl bg-white">
              <span className="w-2 h-2 mr-1 rounded-full bg-gray-800 animate-dot1"></span>
              <span className="w-2 h-2 mr-1 rounded-full bg-gray-800 animate-dot2"></span>
              <span className="w-2 h-2 mx-0 rounded-full bg-gray-800 animate-dot3"></span>
            </div>
          )}
        </ScrollContainer>
        <InputArea
          sendMessage={onSendMessage}
          isLoading={isLoading}
          stopResponse={stopResponse}
        />
      </div>
    </div>
  );
}
