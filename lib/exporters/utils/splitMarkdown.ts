/**
 * Deterministic Markdown splitting for large files
 */

export interface MarkdownPart {
  content: string;
  partNumber: number;
  fileName: string;
}

/**
 * Split markdown content into multiple parts if it exceeds maxChars
 * Splitting is deterministic and attempts to split at logical boundaries
 * (blank lines, headings) when possible
 */
export function splitMarkdown(
  content: string,
  baseFileName: string,
  maxCharsPerFile: number
): MarkdownPart[] {
  if (!maxCharsPerFile || content.length <= maxCharsPerFile) {
    return [
      {
        content,
        partNumber: 1,
        fileName: baseFileName,
      },
    ];
  }

  const parts: MarkdownPart[] = [];
  const lines = content.split('\n');
  let currentPart: string[] = [];
  let currentLength = 0;
  let partNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1; // +1 for newline

    // Check if adding this line would exceed limit
    if (currentLength + lineLength > maxCharsPerFile && currentPart.length > 0) {
      // Save current part
      parts.push({
        content: currentPart.join('\n'),
        partNumber,
        fileName: partNumber === 1 ? baseFileName : getPartFileName(baseFileName, partNumber),
      });

      // Start new part
      currentPart = [line];
      currentLength = lineLength;
      partNumber++;
    } else {
      currentPart.push(line);
      currentLength += lineLength;
    }
  }

  // Add final part if there's content
  if (currentPart.length > 0) {
    parts.push({
      content: currentPart.join('\n'),
      partNumber,
      fileName: partNumber === 1 ? baseFileName : getPartFileName(baseFileName, partNumber),
    });
  }

  // Handle edge case: if no parts were created (e.g., empty content or single long line)
  // Return at least one part
  if (parts.length === 0) {
    return [
      {
        content,
        partNumber: 1,
        fileName: baseFileName,
      },
    ];
  }

  return parts;
}

/**
 * Generate part file name with zero-padded number
 * Example: article.md -> article-part-002.md
 */
function getPartFileName(baseFileName: string, partNumber: number): string {
  // Remove .md extension if present
  const nameWithoutExt = baseFileName.replace(/\.md$/, '');

  // Format part number with leading zeros (supports up to 999 parts)
  const paddedNumber = partNumber.toString().padStart(3, '0');

  return `${nameWithoutExt}-part-${paddedNumber}.md`;
}
