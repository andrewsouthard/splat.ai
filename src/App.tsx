import { useState, useRef, useEffect } from "react";
import { RefreshCcw, Square } from "lucide-react";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { moveWindow, Position } from "@tauri-apps/plugin-positioner";
import "./App.css";
import { ScrollContainer } from "./components/ScrollContainer";
import ChatMessage from "./components/ChatMessage";
import Toolbar from "./components/Toolbar";
import { useSettingsStore } from "./store/settingsStore";
import { useConversationStore } from "./store/conversationStore";
import { Message } from "./types";
import { useShallow } from "zustand/react/shallow";
import ConversationsMenu from "./components/ConversationsMenu";

async function setup() {
  moveWindow(Position.TopRight);
  await register("Option+Space", () => {
    console.log("Shortcut triggered");
  });
}
setup();

export default function App() {
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
  const [isLoading, setIsLoading] = useState(false);
  const keepStreamingRef = useRef(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { selectedModel } = useSettingsStore();

  // setMessages to the conversationMessages when the conversation changes
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

  // Need to write messages to conversationMessages when they change and setMessages
  useEffect(() => {
    if (messages.length > 0) {
      setConversationMessages(messages);
    }
  }, [messages]);

  const toggleSidebar = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const stopResponse = () => {
    console.log("stopping");
    keepStreamingRef.current = false;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const activeConvo = conversations.find(
      (c) => c.id === activeConversationId
    );
    if (activeConvo && messages.length === 0) {
      // set the summary of the active conversation to the input message via setConversations
      // this will trigger a re-render of the conversation list
      updateConversationSummary(activeConvo.id, inputMessage.trim());
    }

    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    keepStreamingRef.current = true;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
      complete: true,
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInputMessage("");

    try {
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        complete: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (keepStreamingRef.current) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);

            setMessages((prev) => {
              const newMessages = [...prev];
              const messageIndex = newMessages.findIndex(
                (msg) => msg.id === assistantMessageId
              );

              if (messageIndex !== -1) {
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  content:
                    newMessages[messageIndex].content +
                    (json?.message?.content ?? ""),
                  complete: json.done,
                };
              }

              return newMessages;
            });

            if (json.done) {
              break;
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Response was stopped by user");
      } else {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: "assistant",
            content:
              "Sorry, there was an error processing your request. Please ensure Ollama is running and try again.",
            timestamp: new Date(),
            complete: true,
          },
        ]);
      }
    } finally {
      keepStreamingRef.current = false;
      setIsLoading(false);
    }
  };

  const switchConversation = (id: string) => {
    const newConvo = conversations.find((c) => c.id === id);
    setActiveConversationId(id);
    setMessages(newConvo?.messages || []);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Toolbar toggleSidebar={toggleSidebar} />
      <ConversationsMenu
        isMenuOpen={isMenuOpen}
        toggleSidebar={toggleSidebar}
      />
      <ScrollContainer messages={messages} className="p-4 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} role={msg.role} content={msg.content} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="relative">
            <RefreshCcw className="animate-spin" />
          </div>
        )}
      </ScrollContainer>
      {/* Input Area */}
      <div className={`p-4 bg-white border-t block relative max-h-[25%]`}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
              const target = e.target as HTMLTextAreaElement;
              target.style.height = `44px`;
            }
          }}
          placeholder="Type your message..."
          className="flex-grow p-2 border rounded-lg w-full min-h-11 resize-none overflow-y-scroll max-h-full outline-none"
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
        {isLoading && (
          <button
            onClick={stopResponse}
            className="absolute top-8 right-8"
            title="Stop"
          >
            <Square className="h-3 w-3 bg-black rounded-sm" />
          </button>
        )}
      </div>
    </div>
  );
}
