// Finds all math content not in code blocks and transforms it so it can be
// correctly displayed
export default function transformMarkdownMath(content: string): string {
  if (!content) return "";
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
}
