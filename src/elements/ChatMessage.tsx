import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import CodeBlock from "./CodeBlock";
import clsx from "clsx";
import { Message } from "@/types";
import "katex/dist/katex.min.css";
import AttachmentViewer from "./AttachmentViewer";
import transformMarkdownMath from "./markdown/transformMarkdownMath";
import remarkExtractThink from "./markdown/remarkExtractThink";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "system") return null;
  const msgContainerClasses = clsx("flex items-start", {
    "justify-end": message.role === "user",
    "justify-start": message.role === "assistant",
  });
  return (
    <div>
      <div className={msgContainerClasses}>
        <div
          className={clsx("px-4 py-2 rounded-xl max-w-[100%]", {
            "bg-blue-500 text-white": message.role === "user",
            "bg-gray-100 text-gray-800 border": message.role === "assistant",
          })}
        >
          {/* The data-theme attribute is used to set the theme for the Markdown content */}
          <article
            className="prose lg:prose-xl"
            data-theme={message.role === "user" ? "light" : "dark"}
          >
            <Markdown
              components={{ code: CodeBlock }}
              className="max-w-full"
              remarkPlugins={[remarkGfm, remarkMath, remarkExtractThink]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
            >
              {transformMarkdownMath(message.content)}
            </Markdown>
          </article>
        </div>
      </div>
      {message.attachments?.map((attachment, index) => (
        <AttachmentViewer
          key={`a-${index}`}
          className={msgContainerClasses}
          attachment={attachment}
        />
      ))}
    </div>
  );
}
