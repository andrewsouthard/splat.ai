import { useState, useRef, useEffect } from "react";
import { RefreshCcw, Menu, PlusCircle, Square } from "lucide-react";
import Markdown from "react-markdown";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { moveWindow, Position } from "@tauri-apps/plugin-positioner";
import remarkGfm from "remark-gfm";
import "./App.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  complete: boolean;
}

async function setup() {
  moveWindow(Position.TopRight);
  await register("Option+Space", () => {
    console.log("Shortcut triggered");
  });
}
setup();

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const keepStreamingRef = useRef(true);
  const chatEndRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(0);
  const [inputMessage, setInputMessage] = useState("");

  const stopResponse = () => {
    console.log("stopping");
    keepStreamingRef.current = false;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const assistantMessageId = crypto.randomUUID();
    keepStreamingRef.current = true;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
      complete: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: inputMessage,
          stream: true,
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
                  content: newMessages[messageIndex].content + json.response,
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      keepStreamingRef.current = false;
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {isMenuOpen ? (
        <div
          onMouseLeave={() => setIsMenuOpen(false)}
          className={`p-4 fixed top-0 left-0 w-64 h-screen bg-white shadow-lg transition-transform duration-100 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={() => setMessages([])}
            className="w-full p-3 text-left hover:bg-gray-100 border-b flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            <span>New Conversation</span>
          </button>
          <ul>
            {conversations.map((msg, index) => (
              <li key={index}>
                <button onClick={() => setActiveConversation(index)}>
                  <div
                    className={`typewriter ${
                      msg.role === "assistant" && msg.content ? "typing" : ""
                    }`}
                  >
                    {msg.role === "assistant" ? "Message" : msg.content}
                  </div>
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
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-xl max-w-[90%] ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800 border"
              }`}
            >
              <article className="prose lg:prose-xl">
                <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
              </article>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="relative">
            <RefreshCcw className="animate-spin" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
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
