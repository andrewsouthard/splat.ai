import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
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
              className={clsx("px-4 py-2 rounded-xl max-w-[90%]", {
                "bg-blue-500 text-white": message.role === "user",
                "bg-white text-gray-800 border": message.role === "assistant",
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
                  remarkPlugins={[remarkGfm]}
                >
                  {message.content}
                </Markdown>
              </article>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {message.complete && (
            <>
              <p>Input Tokens: {message.inputTokens}</p>
              <p>Output Tokens: {message.tokens}</p>
              <p>Tokens/s: {message.tokensPerSecond}</p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
