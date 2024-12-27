import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Clipboard, Check } from "lucide-react";
import "./CodeBlock.css";

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock = ({ inline, className, children }: CodeBlockProps) => {
  const [highlighted, setHighlighted] = useState("<span />");
  const [copied, setCopied] = useState(false);
  const numLines = String(children).split("\n").length;
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "text";

  useEffect(() => {
    async function highlight() {
      const code = String(children).replace(/\n$/, "");
      const highlightedCode = await codeToHtml(code, {
        lang,
        theme: "one-dark-pro",
      });
      setHighlighted(highlightedCode);
    }
    highlight();
  }, [children]);

  const copyToClipboard = async () => {
    await writeText(children?.toString() || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline || numLines <= 1) {
    return <code className={`inline ${className}`}>{children}</code>;
  } else {
    return (
      <div>
        {numLines >= 3 ? (
          <button
            onClick={copyToClipboard}
            className={`mt-1 flex ml-auto items-center justify-end gap-2 p-1 text-white text-sm text-sans rounded-t ${
              copied ? 'bg-blue-500' : 'bg-blue-400 hover:bg-blue-300'
            }`}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        ) : (
          <div className="mt-4" />
        )}
        <div dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    );
  }
};

export default CodeBlock;
