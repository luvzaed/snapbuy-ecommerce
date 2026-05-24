import { readFileSync, writeFileSync } from 'fs';

const logPath = 'C:\\Users\\zedal\\.gemini\\antigravity\\brain\\87f1fc09-48c2-49d3-a2a5-b5b73e2c2ca8\\.system_generated\\logs\\transcript.jsonl';
const lines = readFileSync(logPath, 'utf8').split('\n');

function extractFileContent(content) {
  const parts = content.split('The following code has been modified to include a line number before every line');
  if (parts.length < 2) return null;
  
  let code = parts[1].split('The above content shows the entire, complete file contents')[0];
  // Remove line numbers "123: "
  code = code.replace(/^\d+:\s/gm, '');
  return code.trim() + '\n';
}

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const entry = JSON.parse(line);
    
    if (entry.type === 'TOOL_RESPONSE' && entry.content) {
      if (entry.content.includes('lib/types.ts')) {
        const code = extractFileContent(entry.content);
        if (code) {
          writeFileSync('lib/types.ts', code, 'utf8');
          console.log('Restored lib/types.ts from transcript! Length:', code.length);
        }
      }
      if (entry.content.includes('lib/auth-context.tsx')) {
        const code = extractFileContent(entry.content);
        if (code) {
          writeFileSync('lib/auth-context.tsx', code, 'utf8');
          console.log('Restored lib/auth-context.tsx from transcript! Length:', code.length);
        }
      }
    }
  } catch (e) {}
}
