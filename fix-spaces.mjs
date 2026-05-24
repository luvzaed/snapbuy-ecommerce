import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllFiles(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) results.push(...getAllFiles(fullPath));
        else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) results.push(fullPath);
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results;
}

const files = getAllFiles('.');
let fixedCount = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  
  // Check if it's corrupted by my previous script
  // Look for telltale signs like 'import×' or 'export×' or 'const×'
  if (content.includes('import×') || content.includes('const×') || content.includes('export×') || content.includes('use× client')) {
    
    // Reverse the space corruption
    let fixed = content.replaceAll('× ', ' ');
    
    // Some lines had multiple spaces that became × × × .
    // .replaceAll('× ', ' ') handles all of them sequentially because it replaces the exact string '× '.
    // Let's double check if there are any remaining edge cases.
    // What if there was a line break? Line breaks weren't replaced.
    
    // Restore the multiplication sign for "Adet" specifically if it was broken
    fixed = fixed.replaceAll('Adet: {item.quantity}   ₺', 'Adet: {item.quantity} × ₺');
    fixed = fixed.replaceAll('Adet: {item.quantity}  ₺', 'Adet: {item.quantity} × ₺');
    
    // Restore the check for "import { " which might have become "import {" 
    // Actually `import× {× ` -> `import { ` which is correct.
    
    writeFileSync(file, fixed, 'utf8');
    console.log(`Fixed spaces in: ${file}`);
    fixedCount++;
  }
}

console.log(`Total files space-fixed: ${fixedCount}`);
