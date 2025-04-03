import { useRef, useState, KeyboardEvent, useEffect } from "react";
import { Blend, Bot, Folder, Image, Square, X } from "lucide-react";
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
import { useProjectStore } from "@/store/projectStore";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

interface InputAreaProps {
  sendMessage: (message: string, images?: string[]) => void;
  isLoading: boolean;
  stopResponse: () => void;
  onResize: () => void;
}

enum ChatTargetType {
  Project = 1,
  Model = 2,
}

interface ChatTarget {
  name: string;
  value: string;
  type: ChatTargetType;
}

interface MessageAttachment {
  fileType: string;
  contents: string;
}

const bottomButtonClasses =
  "h-8 flex-row flex items-center hover:shadow-sm py-0 rounded hover:bg-gray-100";

export default function InputArea({
  sendMessage,
  isLoading,
  stopResponse,
  onResize,
}: InputAreaProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [chatTargets, setChatTargets] = useState<ChatTarget[]>([]);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const { projects, selectedProjectId, selectProject } = useProjectStore(
    useShallow((state) => ({
      projects: state.projects,
      selectedProjectId: state.selectedProjectId,
      selectProject: state.selectProject,
    }))
  );

  const { selectedModel, availableModels, setSelectedModel } =
    useSettingsStore();
  const selectedChatTargetId = selectedProjectId || selectedModel;

  useEffect(() => {
    const projs = projects.map((p) => ({
      value: p.id,
      name: p.name,
      type: ChatTargetType.Project,
    }));
    const models = availableModels.map((m) => ({
      value: m,
      name: m,
      type: ChatTargetType.Model,
    }));
    setChatTargets(projs.concat(models));
  }, [projects, availableModels]);

  const onSendMessage = () => {
    if (!inputMessage.trim()) return;
    const imagesToSend = attachments
      .filter((a) => a.fileType === "image")
      .map((a) => a.contents.split(",")[1]);
    sendMessage(inputMessage, imagesToSend);
    setAttachments([]);
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
    onResize();
  };

  const onChangeChatTarget = (value: string) => {
    const newTarget = chatTargets.find((t) => t.value == value);
    if (!newTarget) return;
    if (newTarget.type === ChatTargetType.Model) {
      selectProject("");
      setSelectedModel(newTarget.value);
    } else {
      selectProject(newTarget.value);
      setSelectedModel("");
    }
  };

  const addImageFromFile = async () => {
    const file = await open({
      filters: [
        {
          name: "imageFilter",
          extensions: ["svg", "png", "jpg", "jpeg", "heic"],
        },
      ],
      multiple: false,
      directory: false,
    });
    if (typeof file === "string") {
      const fileContents = await readFile(file);
      const img = await uint8ArrayToBase64(fileContents);
      setAttachments((a) => [...a, { contents: img, fileType: "image" }]);
      onResize();
    }
  };

  const uint8ArrayToBase64 = async (arr: Uint8Array) => {
    const blob = new Blob([arr]);

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result.toString());
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className={`px-4 pt-2 bg-white border-t flex w-full flex-col border`}>
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
        ></textarea>
      </div>
      {attachments &&
        attachments.length > 0 &&
        attachments.map((a) => {
          if (a.fileType !== "image") return null;
          return (
            <div className="relative w-fit group">
              <img
                src={`${a.contents}`}
                className="max-h-[200px] max-w-[150px]"
              />
              <button
                onClick={() =>
                  setAttachments(attachments.filter((att) => att !== a))
                }
                className="absolute top-1 right-1 p-1 bg-white/80 rounded-full hover:cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      <div className="flex items-center text-sm">
        <div className={clsx(bottomButtonClasses, "pr-1")}>
          <Select
            value={selectedChatTargetId}
            onValueChange={onChangeChatTarget}
          >
            <SelectTrigger className="w-auto border-0 focus:border-0 focus:ring-0 shadow-none [&>svg]:mt-1 [&>svg]:ml-1 -mr-1">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="flex flex-row">
              {chatTargets.map((chatTarget) => (
                <SelectItem
                  key={chatTarget.value}
                  value={chatTarget.value.toString()}
                >
                  <div className="flex flex-row">
                    {chatTarget.type === ChatTargetType.Project ? (
                      <Blend className="w-5 h-5 -ml-0.5 mr-2 -mt-0.25" />
                    ) : (
                      <Bot className="h-5 w-5 mr-2 -mt-0.25 -ml-0.5" />
                    )}
                    {chatTarget.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          disabled={attachments.length > 0}
          onClick={addImageFromFile}
          className={clsx(bottomButtonClasses, "px-2", "mr-3", "ml-1")}
          title="Image"
        >
          <Image
            className="h-5 w-5"
            color={attachments.length > 0 ? "#ccc" : "black"}
          />
        </button>
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
