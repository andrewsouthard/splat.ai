import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`flex items-start space-x-3 ${
        role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`px-4 py-2 rounded-xl max-w-[90%] ${
          role === "user"
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-800 border"
        }`}
      >
        <article className="prose lg:prose-xl">
          <Markdown
            components={{ code: CodeBlock }}
            className="max-w-full"
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </Markdown>
        </article>
      </div>
    </div>
  );
}
