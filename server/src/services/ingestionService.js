import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule.default || pdfParseModule);

/**
 * Normalizes ChatGPT and Claude export JSON structures into a clean markdown transcript.
 */
export function normalizeChatExport(jsonData) {
  try {
    let parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    // Handle single conversation object wrapped in array
    if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'object') {
      parsed = parsed[0];
    }

    const transcriptLines = [];

    // Case 1: Simple array of messages: [ { sender/role: 'User', text/content: '...' } ]
    if (Array.isArray(parsed)) {
      transcriptLines.push('# Chat Conversation Export\n');
      parsed.forEach((msg, idx) => {
        const role = msg.sender || msg.role || msg.author || `Speaker ${idx + 1}`;
        const text = msg.text || msg.content || msg.message || (typeof msg === 'string' ? msg : JSON.stringify(msg));
        transcriptLines.push(`### [${role}]\n${text}\n`);
      });
      return transcriptLines.join('\n');
    }

    // Case 2: Claude export structure: { name/title: '...', chat_messages: [...] }
    if (parsed.chat_messages && Array.isArray(parsed.chat_messages)) {
      const title = parsed.name || parsed.title || 'Claude Chat Export';
      transcriptLines.push(`# ${title}\n`);
      parsed.chat_messages.forEach((msg) => {
        const role = msg.sender === 'human' ? 'User' : msg.sender === 'assistant' ? 'Claude' : msg.sender || 'Participant';
        let text = msg.text || '';
        if (!text && Array.isArray(msg.content)) {
          text = msg.content.map(c => c.text || c.string || '').join('\n');
        }
        transcriptLines.push(`### [${role}]\n${text}\n`);
      });
      return transcriptLines.join('\n');
    }

    // Case 3: ChatGPT official dump structure: { title: '...', mapping: { ... } }
    if (parsed.mapping && typeof parsed.mapping === 'object') {
      const title = parsed.title || 'ChatGPT Export';
      transcriptLines.push(`# ${title}\n`);

      const nodes = Object.values(parsed.mapping);
      nodes.forEach((node) => {
        if (node.message && node.message.content && node.message.content.parts) {
          const role = node.message.author?.role === 'user' ? 'User' : node.message.author?.role === 'assistant' ? 'ChatGPT' : 'System';
          const partsText = node.message.content.parts.filter(p => typeof p === 'string').join('\n');
          if (partsText.trim()) {
            transcriptLines.push(`### [${role}]\n${partsText}\n`);
          }
        }
      });
      return transcriptLines.join('\n');
    }

    // Fallback for custom JSON object
    return `# Chat Export\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
  } catch (e) {
    throw new Error(`Failed to parse chat export JSON: ${e.message}`);
  }
}

/**
 * Ingests a file buffer or string based on artifact type.
 */
export async function parseArtifactContent(fileBuffer, mimeType, originalName, requestedType) {
  const type = requestedType?.toLowerCase() || 'markdown';

  // 1. PDF Text Extraction
  if (type === 'pdf' || mimeType === 'application/pdf' || originalName?.endsWith('.pdf')) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('PDF file is empty.');
    }

    let extractedText = '';
    try {
      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text ? pdfData.text.trim() : '';
      }
    } catch (e) {
      // Fallback: If pdf-parse fails because file is raw text/markdown named .pdf
      const rawText = fileBuffer.toString('utf-8').trim();
      if (rawText) {
        extractedText = rawText;
      }
    }

    if (!extractedText) {
      const rawText = fileBuffer.toString('utf-8').trim();
      if (rawText) {
        extractedText = rawText;
      } else {
        throw new Error('PDF contains no text layers or readable text (OCR is not enabled).');
      }
    }

    return {
      normalizedContent: extractedText,
      detectedType: 'pdf'
    };
  }

  // 2. Chat Export (JSON or Markdown)
  if (type === 'chat' || mimeType === 'application/json' || originalName?.endsWith('.json')) {
    const rawString = fileBuffer ? fileBuffer.toString('utf-8') : '';
    const normalized = normalizeChatExport(rawString);
    return {
      normalizedContent: normalized,
      detectedType: 'chat'
    };
  }

  // 3. Markdown / Plain Text / Code
  const rawString = fileBuffer ? fileBuffer.toString('utf-8') : '';
  if (!rawString || rawString.trim().length === 0) {
    throw new Error('File content is empty.');
  }

  return {
    normalizedContent: rawString.trim(),
    detectedType: type === 'code' ? 'code' : 'markdown'
  };
}
