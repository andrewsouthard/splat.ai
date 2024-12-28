import { useState, useRef, useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import { register } from "@tauri-apps/plugin-global-shortcut";
import ScrollContainer from "@/elements/ScrollContainer";
import ChatMessage from "@/elements/ChatMessage";
import { useSettingsStore } from "@/store/settingsStore";
import { useConversationStore } from "@/store/conversationStore";
import { Message } from "@/types";
import { useShallow } from "zustand/react/shallow";
import ConversationsMenu from "@/elements/ConversationsMenu";
import { Window } from "@tauri-apps/api/window";
import { useCommandN } from "@/hooks/useCommandN";
import { debounce } from "lodash-es";
import InputArea from "@/elements/InputArea";

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
    const keepStreamingRef = useRef(true);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const { selectedModel } = useSettingsStore(
        useShallow((state) => ({
            selectedModel: state.selectedModel,
        }))
    );
    useCommandN();

    useEffect(() => {
        async function setup() {
            await register("Option+Space", async () => {
                const currentWindow = await Window.getCurrent();
                currentWindow.setFocus();
                inputRef.current?.focus();
            });
        }
        setup();
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
        console.log("stopping");
        keepStreamingRef.current = false;
    };

    const sendMessage = async (message: string) => {
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

        setIsLoading(true);

        const assistantMessageId = crypto.randomUUID();
        keepStreamingRef.current = true;

        const newMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: message,
            timestamp: new Date(),
            complete: true,
        };

        const newMessages = [...messages, newMessage];
        setMessages(newMessages);

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
        inputRef.current?.focus();
    };

    return (
        <div className="flex-row flex flex-grow overflow-y-hidden relative">
            <ConversationsMenu
                isMenuOpen={isMenuOpen}
            />
            <div className="flex flex-col overflow-y-hidden mt-1 w-full">
                <ScrollContainer messages={messages} className="mt-auto p-4 space-y-4 flex-col">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} role={msg.role} content={msg.content} />
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="relative">
                            <RefreshCcw className="animate-spin" />
                        </div>
                    )}
                </ScrollContainer>
                <InputArea
                    sendMessage={sendMessage}
                    isLoading={isLoading}
                    stopResponse={stopResponse}
                />
            </div>
        </div>
    );
}
