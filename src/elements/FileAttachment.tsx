import { convertBase64ToPlaintext } from "@/lib/inputHelpers";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import "./CodeBlock.css";
import { MessageAttachment } from "@/types";

interface FileAttachmentProps {
  attachment: MessageAttachment;
  onClose?: () => void;
  className?: string;
  maxHeight?: string;
  maxWidth?: string;
  showCloseButton?: boolean;
  previewLines?: number;
}

export default function FileAttachment({
  attachment,
  onClose = () => {},
  className = "",
  maxHeight = "200px",
  maxWidth = "300px",
  showCloseButton = true,
  previewLines = 5,
}: FileAttachmentProps) {
  const [highlighted, setHighlighted] = useState("<span />");

  useEffect(() => {
    async function highlight() {
      const content = convertBase64ToPlaintext(attachment.contents)
        .split("\n")
        .slice(0, previewLines)
        .join("\n");

      const lang = attachment.fileType.replace("text/", "");
      const highlightedCode = await codeToHtml(content, {
        lang: lang ?? "text",
        theme: "one-dark-pro",
      });
      setHighlighted(highlightedCode);
    }
    highlight();
  }, [attachment, previewLines]);

  return (
    <div className={`relative w-fit group ${className}`}>
      <div
        className={`max-h-[${maxHeight}] max-w-[${maxWidth}] rounded-xl overflow-auto`}
      >
        <div
          className="text-left break-words overflow-x-hidden [&_pre]:whitespace-pre-wrap [&_code]:whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
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
