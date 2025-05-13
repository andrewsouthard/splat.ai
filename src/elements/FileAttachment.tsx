import { convertBase64ToPlaintext } from "@/lib/inputHelpers";
import { X } from "lucide-react";

interface FileAttachmentProps {
  fileContent: string;
  onClose?: () => void;
  className?: string;
  maxHeight?: string;
  maxWidth?: string;
  showCloseButton?: boolean;
  previewLines?: number;
}

export default function FileAttachment({
  fileContent,
  onClose = () => {},
  className = "",
  maxHeight = "200px",
  maxWidth = "300px",
  showCloseButton = true,
  previewLines = 5,
}: FileAttachmentProps) {
  // Get the first few lines of the file content
  const previewContent = convertBase64ToPlaintext(fileContent)
    .split("\n")
    .slice(0, previewLines)
    .join("\n");

  return (
    <div className={`relative w-fit group ${className}`}>
      <div
        className={`max-h-[${maxHeight}] max-w-[${maxWidth}] rounded-xl bg-black p-4 font-mono text-sm text-white overflow-auto`}
      >
        <pre className="whitespace-pre-wrap">{previewContent}</pre>
      </div>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
