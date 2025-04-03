import { X } from "lucide-react";

interface ImageAttachmentProps {
  imageSrc: string;
  onClose?: () => void;
  className?: string;
  maxHeight?: string;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export default function ImageAttachment({
  imageSrc,
  onClose = () => {},
  className = "",
  maxHeight = "200px",
  maxWidth = "150px",
  showCloseButton = true,
}: ImageAttachmentProps) {
  return (
    <div className={`relative w-fit group ${className}`}>
      <img
        src={imageSrc}
        className={`max-h-[${maxHeight}] max-w-[${maxWidth}] rounded-xl`}
        alt="Attachment"
      />
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
