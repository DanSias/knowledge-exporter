/**
 * HTML to Markdown conversion
 */

import TurndownService from 'turndown';

/**
 * Convert HTML to clean Markdown
 * Preserves headings, lists, code blocks, links, and formatting
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  const turndownService = new TurndownService({
    headingStyle: 'atx', // Use # for headings
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });

  // Custom rules for better output
  turndownService.addRule('strikethrough', {
    filter: ['del', 's'] as any,
    replacement: (content) => `~~${content}~~`,
  });

  // Handle pre-formatted code blocks
  turndownService.addRule('pre', {
    filter: 'pre',
    replacement: (content, node) => {
      const codeNode = node.querySelector('code');
      if (codeNode) {
        const language = codeNode.className.match(/language-(\w+)/)?.[1] || '';
        return `\n\n\`\`\`${language}\n${codeNode.textContent}\n\`\`\`\n\n`;
      }
      return `\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
    },
  });

  const markdown = turndownService.turndown(html);

  // Clean up excessive newlines
  return markdown
    .replace(/\n{4,}/g, '\n\n\n') // Max 2 blank lines
    .trim();
}
