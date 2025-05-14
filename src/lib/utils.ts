import { Message, MessageAttachment } from "@/types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { convertBase64ToPlaintext } from "./inputHelpers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type AttachmentsByType = [string[], MessageAttachment[]]

export function transformMessageAttachments(message: Message) {
  if (message.attachments && message.attachments.length > 0) {
    try {
      const [images, files]: AttachmentsByType = message.attachments.reduce<AttachmentsByType>((acc, a) => {
        if (a.fileType.startsWith("image")) {
          acc[0].push(a.contents.split(",")[1]);
        } else {
          acc[1].push(a);
        }
        return acc;
      }, [[], []]);
      // Put the files in markdown blocks
      const filesToText = files.map(f => `
    \`\`\`${f.fileType.replace("^text\/", "")}
    ${convertBase64ToPlaintext(f.contents)}
    \`\`\`
    `).join("\n")

      // Add all files to content
      return {
        ...message,
        content: message.content + filesToText,
        attachments: [],
        images,
      };
    } catch (e) {
      console.error("Error transforming!", e)
      return message;
    }
  } else {
    return message;
  }
}