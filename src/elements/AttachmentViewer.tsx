import { useState, useEffect } from "react";
import clsx from "clsx";
import ImageAttachment from "./ImageAttachment";
import FileAttachment from "./FileAttachment";
import { MessageAttachment } from "@/types";

interface AttachmentViewerProps {
  attachment: MessageAttachment;
  className?: string;
}

export default function AttachmentViewer({
  attachment,
  className,
}: AttachmentViewerProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOverlayOpen(false);
      }
    };

    if (isOverlayOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOverlayOpen]);

  if (!attachment) return null;

  const isImage = attachment.fileType.startsWith("image/");

  return (
    <>
      <div
        className={clsx("relative cursor-pointer", className)}
        onClick={() => setIsOverlayOpen(true)}
      >
        {isImage ? (
          <ImageAttachment
            imageSrc={attachment.contents}
            className="rounded-xl border border-gray-100"
            maxHeight="200px"
            maxWidth="200px"
            showCloseButton={false}
          />
        ) : (
          <FileAttachment
            attachment={attachment}
            className="rounded-xl border border-gray-100"
            maxHeight="200px"
            maxWidth="200px"
            showCloseButton={false}
          />
        )}
      </div>

      {/* Overlay */}
      {isOverlayOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOverlayOpen(false);
            }
          }}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto flex justify-center">
            {isImage ? (
              <ImageAttachment
                imageSrc={attachment.contents}
                onClose={() => setIsOverlayOpen(false)}
                className="rounded-xl"
                maxHeight="80vh"
                maxWidth="100%"
                showCloseButton={true}
              />
            ) : (
              <FileAttachment
                attachment={attachment}
                onClose={() => setIsOverlayOpen(false)}
                className="rounded-xl"
                maxHeight="80vh"
                maxWidth="100%"
                showCloseButton={true}
                previewLines={50}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
