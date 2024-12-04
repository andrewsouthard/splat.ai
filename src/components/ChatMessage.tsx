import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { bundledLanguages, createHighlighter } from "shiki";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

// Initialize Shiki highlighter
const highlighter = await createHighlighter({
  langs: Object.keys(bundledLanguages),
  themes: ["github-dark", "github-light"],
});

const CodeBlock = {
  code({
    inline,
    className,
    children,
  }: {
    node?: any;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  }) {
    if (inline || !highlighter) {
      console.log("no highlighter", inline, highlighter);
      return <code className={className}>{children}</code>;
    }

    const match = /language-(\w+)/.exec(className || "");
    const lang = match ? match[1] : "text";

    try {
      const isInline = String(children).split("\n").length <= 1;
      if (isInline) {
        //Fix inline classes here
        return <code className={className}>{children}</code>;
      } else {
        const code = String(children).replace(/\n$/, "");
        const highlighted = highlighter.codeToHtml(code, {
          lang,
          theme: "github-dark",
        });

        return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
      }
    } catch (error) {
      console.error("Highlighting error:", error);
      return <code className={className}>{children}</code>;
    }
  },
};

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
            components={CodeBlock}
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
