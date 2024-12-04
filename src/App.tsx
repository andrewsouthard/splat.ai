import { useState, useRef, useEffect } from "react";
import { load, Store } from "@tauri-apps/plugin-store";
import { RefreshCcw, Menu, PlusCircle, Square } from "lucide-react";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { moveWindow, Position } from "@tauri-apps/plugin-positioner";
import "./App.css";
import { ScrollContainer } from "./components/ScrollContainer";
import ChatMessage from "./components/ChatMessage";
import { Conversation, Message } from "./types";

async function setup() {
  moveWindow(Position.TopRight);
  await register("Option+Space", () => {
    console.log("Shortcut triggered");
  });
}
setup();

const getBlankConversation = () => ({
  id: crypto.randomUUID(),
  messages: [],
  summary: "New Conversation",
});

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const keepStreamingRef = useRef(true);
  const storeRef = useRef<Store>({} as Store);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [inputMessage, setInputMessage] = useState("");

  const stopResponse = () => {
    console.log("stopping");
    keepStreamingRef.current = false;
  };

  const addConversation = () => {
    const newConvo = getBlankConversation();
    setConversations([...conversations, newConvo]);
    switchConversation(newConvo.id);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const activeConvo = conversations.find(
      (c) => c.id === activeConversationId
    );
    if (activeConvo?.messages.length === 0) {
      // set the summary of the active conversation to the input message via setConversations
      // this will trigger a re-render of the conversation list
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            c.summary = inputMessage.trim();
          }
          return c;
        })
      );
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
          model: "llama3.2",
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

  useEffect(() => {
    async function setup() {
      const store = await load("store.json", { autoSave: true });
      if (store) {
        storeRef.current = store;
        const convos = await store.get<{ value: Conversation[] }>(
          "conversations"
        );
        if (convos) {
          setConversations(convos.value);
        } else {
          setConversations([getBlankConversation()]);
        }
        const ac = await store.get<{ value: string }>("activeConversationId");
        if (ac) setActiveConversationId(ac.value);
        return () => {
          storeRef.current?.set("conversations", conversations);
          storeRef.current?.set("activeConversationId", activeConversationId);
        };
      }
    }
    setup();
  }, []);

  const switchConversation = (id: string) => {
    // Save current messages to current conversation
    const activeConvo = conversations.find(
      (c) => c.id === activeConversationId
    );
    const newActiveConvo = conversations.find((c) => c.id === id);
    if (activeConvo) {
      activeConvo.messages = messages;
    }
    // Update conversations array
    setConversations((prev) =>
      prev ? prev.map((c) => (c.id === activeConvo?.id ? activeConvo : c)) : []
    );

    // Switch to new conversation
    setActiveConversationId(id);

    // Load messages from new conversation
    const newMessages = newActiveConvo?.messages || [];
    setMessages(newMessages);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {isMenuOpen ? (
        <div
          onMouseLeave={() => setIsMenuOpen(false)}
          className={`p-4 fixed top-0 left-0 w-64 h-screen bg-white shadow-lg transition-transform duration-100 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {conversations
            .map((convo, index) => (
              <button
                key={index}
                onClick={() => switchConversation(convo.id)}
                className={`w-full p-3 text-left border-b flex items-center gap-2 rounded-sm ${
                  convo.id === activeConversationId
                    ? "bg-blue-500 text-white"
                    : ""
                }`}
              >
                <div className="flex-grow">{convo.summary}</div>
              </button>
            ))
            .reverse()}
          <button
            onClick={addConversation}
            className="w-full p-3 text-left hover:bg-gray-100 border-b flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            <span>New Conversation</span>
          </button>
          <ul>
            {conversations.map((convo, index) => (
              <li key={index}>
                <button onClick={() => switchConversation(convo.id)}>
                  <div>{convo.summary}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          className="fixed left-4 top-4 p-2 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 z-50 opacity-0 transition-opacity hover:opacity-100"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
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
      <div className={`p-4 bg-white border-t block relative`}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          className="flex-grow p-2 border rounded-lg w-full resize-none overflow-hidden"
          rows={1}
          style={{ minHeight: "44px" }}
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
