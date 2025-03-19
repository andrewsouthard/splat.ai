import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import CodeBlock from "./CodeBlock";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Message } from "@/types";
import "katex/dist/katex.min.css";

interface ChatMessageProps {
  message: Message;
}

// Finds all math content not in code blocks and transforms it so it can be
// correctly displayed
const processMathContent = (content: string) => {
  const lines = content.split("\n");
  let insideCodeBlock = false;

  return lines
    .map((line) => {
      if (line.trim().startsWith("```")) {
        insideCodeBlock = !insideCodeBlock;
      }

      if (insideCodeBlock) {
        return line;
      }

      const parts = line.split(/(\\\[.*?\\\]|\\\(.*?\\\))/g);

      return parts
        .map((part) => {
          if (part.startsWith("\\[") && part.endsWith("\\]")) {
            const math = part.substring(2, part.length - 2);
            return `$${math}$`;
          } else if (part.startsWith("\\(") && part.endsWith("\\)")) {
            const math = part.substring(2, part.length - 2);
            return `$${math}$`;
          }
          return part;
        })
        .join("");
    })
    .join("\n");
};

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "system") return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={clsx("flex items-start space-x-3", {
              "justify-end": message.role === "user",
              "justify-start": message.role === "assistant",
            })}
          >
            <div
              className={clsx("px-4 py-2 rounded-xl max-w-[100%]", {
                "bg-blue-500 text-white": message.role === "user",
                "bg-gray-100 text-gray-800 border":
                  message.role === "assistant",
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
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {processMathContent(message.content)}
                </Markdown>
              </article>
            </div>
          </div>
        </TooltipTrigger>
        {message.complete && message.inputTokens && (
          <TooltipContent>
            <>
              <p>Input Tokens: {message.inputTokens}</p>
              <p>Output Tokens: {message.tokens}</p>
              <p>Tokens/s: {message.tokensPerSecond}</p>
            </>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
