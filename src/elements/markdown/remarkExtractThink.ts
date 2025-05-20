import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Root, HTML } from 'mdast';
import type { VFile } from 'vfile';

const remarkExtractThink: Plugin<[], Root> = function () {
  return function transformer(tree: Root, file: VFile) {
    let thoughtsContent: string[] = [];

    visit(tree, 'html', (node) => {
      if (node.value.includes('<think>')) {
        // Extract content after <think> tag, even if </think> isn't present yet
        const content = node.value.replace(/<think>/, '').replace(/<\/think>/, '');
        thoughtsContent.push(content);

        // Create HTML for the details element
        const detailsHtml: HTML = {
          type: 'html',
          value: `<details class="p-2 rounded my-2" open>
            <summary class="font-bold cursor-pointer">Thinking</summary>
            <div class="mt-2 pl-2">${content}</div>
          </details>`
        };

        // Replace the think node with the details HTML
        Object.assign(node, detailsHtml);
      }
    });

    file.data.thoughtsContent = thoughtsContent.join('\n');
  };
};

export default remarkExtractThink;