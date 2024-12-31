import { useRef, useState, KeyboardEvent } from "react";
import { Blend, Square } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { useShallow } from "zustand/react/shallow";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { clsx } from "clsx";

interface InputAreaProps {
    sendMessage: (message: string) => void;
    isLoading: boolean;
    stopResponse: () => void;
}

const bottomButtonClasses = 'h-8 flex-row flex items-center hover:shadow-sm py-0 rounded hover:bg-gray-100';

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

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = "auto";
        target.style.height = `${target.scrollHeight}px`;
    }

    return (
        <div className={`px-4 pt-2 bg-white border-t block flex w-full flex-col border`}>
            <div className="relative">
                <textarea
                    ref={inputRef}
                    autoFocus
                    id="text-input"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Type your message..."
                    className="flex-grow p-2 w-full min-h-11 resize-none overflow-y-scroll max-h-full outline-none"
                    rows={1}
                    onInput={onInput}

                >
                </textarea>
            </div>
            <div className="flex items-center text-sm">
                <div className={clsx(bottomButtonClasses,"px-1")}>
                    <Blend className="pl-1 w-5 h-5 -mr-1 mt-0.5" />
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-auto border-0 focus:border-0 focus:ring-0 shadow-none [&>svg]:mt-1 [&>svg]:ml-1 -mr-1">
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
                        className={clsx(bottomButtonClasses, "ml-1", "px-4")}
                        title="Stop"
                    >
                        <Square className="ml-1 h-3 w-3 bg-neutral-950 rounded mr-2" />
                        <span className="text-neutral-950">Stop</span>
                    </button>
                )}
            </div>

        </div>
    );
}
