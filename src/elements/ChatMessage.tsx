import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import clsx from 'clsx';

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={clsx(
        'flex items-start space-x-3', {
        'justify-end': role === 'user',
        'justify-start': role === 'assistant'
      }
      )}
    >
      <div
        className={clsx(
          'px-4 py-2 rounded-xl max-w-[90%]', {
          'bg-blue-500 text-white': role === 'user',
          'bg-white text-gray-800 border': role === 'assistant'
        }
        )}
      >
        {/* The data-theme attribute is used to set the theme for the Markdown content */}
        <article className="prose lg:prose-xl" data-theme={role === "user" ? "light" : "dark"}>
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
