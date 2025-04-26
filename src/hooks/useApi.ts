import { GlobTool } from "@/lib/tools";
import { useProjectStore } from "@/store/projectStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Message } from "@/types";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

const TOOLS = [
    new GlobTool("/Users/andrew/repos/splat.ai")
]

export function useGetModelsApi() {
    const { apiUrl, setAvailableModels } = useSettingsStore();

    const getModels = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const { models } = await response.json();
            setAvailableModels(
                models.map((m: { name: string }) => m.name.replace(":latest", ""))
            );
        } catch (error) {
            console.error("Error fetching models:", error);
        }
    };

    return getModels;
}

export function useStreamingModelPullApi(abortControllerRef: MutableRefObject<AbortController | null>, setProgress: any) {
    const { apiUrl } = useSettingsStore();
    const getModels = useGetModelsApi();

    const pullModel = async (newModelName: string) => {
        try {
            const response = await fetch(`${apiUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newModelName, stream: true }),
                signal: abortControllerRef.current?.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                const lines = text.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.completed && data.total) {
                            console.log(`Download progress: ${((data.completed / data.total) * 100).toFixed(0)}%`);
                            setProgress(Number((data.completed / data.total) * 100))
                        }
                    } catch (e) {
                        console.error("Error parsing JSON:", e);
                    }
                }
            }

            // Refresh the model list after pulling
            await getModels();

            return true;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log("Request aborted by user");
            } else {
                console.error("Error pulling model:", error);
            }
            return false;
        }
    };


    return pullModel;

}

export function useStreamingChatApi(keepStreamingRef: any) {
    const abortControllerRef = useRef<AbortController | null>(null);
    const [toolCalled, setToolCalled] = useState(false)
    const [messages, setMessages] = useState<Message[]>([]);
    const { projects, selectedProjectId } = useProjectStore();
    const { selectedModel, apiUrl } = useSettingsStore(
        useShallow((state) => ({
            selectedModel: state.selectedModel,
            apiUrl: state.apiUrl
        }))
    );

    useEffect(() => {
        if (!keepStreamingRef.current) {
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
        }
    }, [keepStreamingRef.current]);

    useEffect(() => {
        // If the last call is a tool response, push that back to the LLM.
        if (toolCalled && messages.length > 0) {
            setToolCalled(false)
            console.log("sending tool results back to model")
            sendMessage()
        } else {
            console.log("m" + JSON.stringify(messages))
        }
    }, [toolCalled])

    const sendMessage = async (newMessage?: Message) => {
        const assistantMessageId = crypto.randomUUID();
        abortControllerRef.current = new AbortController();
        if (!keepStreamingRef.current)
            keepStreamingRef.current = true;
        let selectedProject;
        if (selectedProjectId) {
            selectedProject = projects.find(p => p.id === selectedProjectId)
        }

        let newMessages = [...messages];
        console.log("nm" + JSON.stringify(newMessages))
        if (newMessage) {
            newMessages.push(newMessage)
        }
        // Add the system message if this is the first message and one is set.
        if (selectedProject?.systemPrompt && selectedProject.systemPrompt.length > 1 && newMessages.length === 1) {
            const newSystemPrompt = selectedProject.systemPrompt
            newMessages.unshift({
                id: crypto.randomUUID(),
                content: newSystemPrompt,
                role: "system",
                complete: true,
                timestamp: new Date()
            })
        }
        const model = selectedProject?.model || selectedModel;
        const options = selectedProject?.contextLength ? { num_ctx: selectedProject.contextLength } : {}

        setMessages(newMessages);

        const tools = TOOLS.map(t => ({
            "type": "function",
            "function": t.usage(),
        }))
        try {
            const response = await fetch(`${apiUrl}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    model,
                    messages: newMessages,
                    options,
                    tools
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
                        console.log({ json })
                        // json.message?.content.contains(/Action: (\w+): (.*)/)) {
                        if (json.message.tool_calls) {
                            console.log("yes sirreee bob" + JSON.stringify(json.message.tool_calls))
                            const toolCall = json.message.tool_calls[0].function
                            // XXX: HANDLE ERROR CASE
                            const tool = TOOLS.find(t => t.name === toolCall.name) || TOOLS[0]
                            const results = await tool.use(toolCall.arguments)
                            setMessages((prev) => {
                                const newMessages = [...prev];
                                const messageIndex = newMessages.findIndex(
                                    (msg) => msg.id === assistantMessageId
                                );

                                if (messageIndex !== -1) {
                                    newMessages[messageIndex] = {
                                        ...newMessages[messageIndex],
                                        role: "tool",
                                        toolAction: tool.action,
                                        content: `Using the ${tool.name} tool results, help the user: ${JSON.stringify(results)}`,
                                        complete: true,
                                        inputTokens: json?.prompt_eval_count,
                                        tokens: json?.eval_count,
                                        tokensPerSecond: Number((json.eval_count / json.eval_duration * 10 ** 9).toFixed(1))
                                    };
                                }

                                return newMessages;

                            });
                            setToolCalled(true)
                        } else {
                            console.log("other..." + JSON.stringify(messages))
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
                                    };
                                    if (json.done) {
                                        newMessages[messageIndex] = {
                                            ...newMessages[messageIndex],
                                            complete: true,
                                            inputTokens: json?.prompt_eval_count,
                                            tokens: json?.eval_count,
                                            tokensPerSecond: Number((json.eval_count / json.eval_duration * 10 ** 9).toFixed(1))
                                        };
                                    }
                                }

                                return newMessages;
                            });
                            if (json.done) {
                            }
                        }

                        if (json.done) {
                            break;
                        }
                    } catch (e) {
                        console.error("Error parsing JSON:", e);
                    }
                }
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log("Request aborted by user");
                return;
            }
            console.error("Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: assistantMessageId,
                    role: "assistant",
                    content: "Sorry, there was an error processing your request. Please ensure Ollama is running and try again.",
                    timestamp: new Date(),
                    complete: true,
                },
            ]);
            console.log("finally...")
            abortControllerRef.current = null;
            keepStreamingRef.current = false;
        } finally {

        }
    };
    return { messages, setMessages, sendMessage };
}
