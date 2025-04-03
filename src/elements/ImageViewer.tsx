import { useState, useEffect } from "react";
import clsx from "clsx";

interface ImageViewerProps {
  image?: string;
  className?: string;
}

export default function ImageViewer({ image, className }: ImageViewerProps) {
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

  if (!image) return null;

  return (
    <>
      <div
        className={clsx("relative cursor-pointer", className)}
        onClick={() => setIsOverlayOpen(true)}
      >
        <img
          src={`data:image/png;base64,${image}`}
          className="max-w-xs max-h-xs rounded-xl border border-gray-100"
          alt="Image"
        />
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
            <img
              src={`data:image/png;base64,${image}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
              alt="Image"
            />
          </div>
        </div>
      )}
    </>
  );
}
