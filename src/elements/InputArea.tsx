import { useRef, useState } from "react";
import { Settings, Square } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { useShallow } from "zustand/react/shallow";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface InputAreaProps {
    sendMessage: (message: string) => void;
    isLoading: boolean;
    stopResponse: () => void;
}

export default function InputArea({ sendMessage, isLoading, stopResponse }: InputAreaProps) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [inputMessage, setInputMessage] = useState("");
    const { selectedModel, availableModels, setSelectedModel } = useSettingsStore(
        useShallow((state) => ({
            selectedModel: state.selectedModel,
            availableModels: state.availableModels,
            setSelectedModel: state.setSelectedModel,
        }))
    );

    const onSendMessage = () => {
        if (!inputMessage.trim()) return;
        sendMessage(inputMessage);
        setInputMessage("");
        if (inputRef.current) {
            inputRef.current.style.height = "44px";
        }
    };

    return (
        <div className={`p-4 bg-white border-t block relative flex w-full flex-col`}>
            <textarea
                ref={inputRef}
                autoFocus
                id="text-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSendMessage();
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
            <div className="flex items-center mt-2 text-sm">
                <Settings className="w-4 h-4 mr-2" />
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableModels.map((model) => (
                            <SelectItem key={model} value={model}>
                                {model}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
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
    );
}
