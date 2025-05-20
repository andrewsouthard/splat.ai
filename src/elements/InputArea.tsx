import { useRef, useState, KeyboardEvent, useEffect } from "react";
import { Blend, Bot, Paperclip, Square } from "lucide-react";
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
import { toast } from "sonner";
import { useProjectStore } from "@/store/projectStore";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import ImageAttachment from "./ImageAttachment";
import { toggleModel } from "@/lib/ollamaApi";
import {
  detectMimeTypeFromSignature,
  estimateTokenCount,
  uint8ArrayToBase64,
} from "@/lib/inputHelpers";
import { MessageAttachment } from "@/types";
import FileAttachment from "./FileAttachment";

interface InputAreaProps {
  sendMessage: (message: string, attachments?: MessageAttachment[]) => void;
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

const SUPPORTED_IMAGE_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/gif",
];

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
  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

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

    sendMessage(inputMessage, attachments);
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
  };

  const onChangeChatTarget = async (value: string) => {
    const newTarget = chatTargets.find((t) => t.value == value);
    if (!newTarget) return;
    const oldModel =
      projects?.find((p) => p.id === selectedProjectId)?.model || selectedModel;

    // Unload the old model
    await toggleModel(oldModel, "unload");
    if (newTarget.type === ChatTargetType.Model) {
      selectProject("");
      setSelectedModel(newTarget.value);
    } else {
      selectProject(newTarget.value);
      setSelectedModel("");
    }
    const newModel =
      projects?.find((p) => p.id === newTarget.value)?.model || newTarget.value;
    // Load the new model into memory but don't wait for completion
    toggleModel(newModel, "load");
  };

  const addAttachmentsFromFile = async () => {
    const files = await open({
      multiple: true,
      directory: false,
    });
    const attachmentsList: MessageAttachment[] = [];
    if (!files) return;
    for (let file of files) {
      if (typeof file !== "string") continue;
      const fileContents = await readFile(file);
      const contents = await uint8ArrayToBase64(fileContents);
      const parts = contents.split(";");
      // Extract the MIME type from the first part
      let fileType = parts[0].split(":")[1];
      // Try to get the type from the Uint8Array
      if (fileType === "application/octet-stream") {
        const mimeType = detectMimeTypeFromSignature(fileContents);
        if (mimeType) {
          fileType = mimeType;
        }
      }

      attachmentsList.push({ contents, fileType });
    }
    addNewAttachments(attachmentsList);
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const { items } = e.clipboardData;
    if (items.length > 0) e.preventDefault();
    const newAttachments: MessageAttachment[] = [];

    for (let item of Array.from(items)) {
      let contents: string, fileType: string;
      const file = item.getAsFile();
      if (file) {
        console.log("file type is " + file?.type);
        console.log("file is" + file);
        fileType = file.type;
        contents = await new Promise((resolve, reject) => {
          try {
            const reader = new FileReader();
            reader.onload = (e) => {
              const res = e.target?.result;
              if (res) {
                resolve(res.toString());
              } else {
                toast(`Could not read file`);
                resolve("");
              }
            };
            reader.readAsDataURL(file);
          } catch (e) {
            toast(`Could not open file`);
            reject(e);
          }
        });
      } else {
        fileType = "text";
        contents = await new Promise((resolve) => {
          try {
            // If getAsString doesn't return in < 100ms, timeout.
            // This happens for some items, not sure why
            const clear = setTimeout(() => {
              resolve("");
            }, 100);
            item.getAsString((data) => {
              clearTimeout(clear);
              if (data) {
                resolve(data);
              } else {
                toast(`Could not read attachment!`);
                resolve("");
              }
            });
          } catch (e) {
            console.error(e);
            toast(`Failed to add attachment! ${e}`);
            resolve("");
          }
        });
      }
      if (contents && contents.length > 0) {
        newAttachments.push({ contents, fileType });
      }
    }
    addNewAttachments(newAttachments);
  };

  const addNewAttachments = (attachmentsToAdd: MessageAttachment[]) => {
    const newAttachments: MessageAttachment[] = [];
    attachmentsToAdd.forEach((a) => {
      const tokens = estimateTokenCount(a.contents);
      const projectMaxTokens = selectedProject?.contextLength ?? 8_000;
      if (a.fileType.startsWith("text")) {
        if (tokens < projectMaxTokens) {
          newAttachments.push(a);
        } else {
          toast("File too large, please try another.");
          console.error("File too big");
          console.error(a);
        }
      } else if (
        a.fileType.startsWith("image") &&
        SUPPORTED_IMAGE_TYPES.includes(a.fileType)
      ) {
        newAttachments.push(a);
      } else {
        toast(`Unsupported file type: ${a.fileType}`);
        console.error("Unknown file type");
        console.error(a);
      }
    });
    setAttachments((a) => a.concat(newAttachments));
    onResize();
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
          onPaste={onPaste}
          placeholder="Type your message..."
          className="flex-grow p-2 w-full min-h-11 resize-none overflow-y-scroll max-h-full outline-none"
          rows={1}
          onInput={onInput}
        ></textarea>
      </div>
      <div className="flex flex-row">
        {attachments &&
          attachments.length > 0 &&
          attachments.map((a) => {
            if (a.fileType.startsWith("image")) {
              return (
                <ImageAttachment
                  key={a.contents}
                  imageSrc={a.contents}
                  onClose={() =>
                    setAttachments(attachments.filter((att) => att !== a))
                  }
                />
              );
            } else if (a.fileType.startsWith("text")) {
              return (
                <FileAttachment
                  attachment={a}
                  onClose={() =>
                    setAttachments(attachments.filter((att) => att !== a))
                  }
                />
              );
            }
          })}
      </div>
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
                      <Blend className="w-5 h-5 -ml-0.25 mr-2 -mt-0.25" />
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
          onClick={addAttachmentsFromFile}
          className={clsx(bottomButtonClasses, "px-2", "mr-3", "ml-0")}
          title="Attachments"
        >
          <Paperclip
            className="h-5 w-5 -rotate-45"
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
