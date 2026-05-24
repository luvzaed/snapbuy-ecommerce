import { readFileSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join } from 'path';

const historyPath = join(process.env.APPDATA, 'Code', 'User', 'History');
const targetProjectUrl = 'my-app'; 

const targetFiles = [
  '.gitignore',
  'README.md',
  'app/admin/page.tsx',
  'app/api/products/[id]/route.ts',
  'app/api/products/route.ts',
  'app/api/users/[id]/route.ts',
  'app/api/users/route.ts',
  'app/cart/page.tsx',
  'app/dashboard/page.tsx',
  'app/globals.css',
  'app/layout.tsx',
  'app/login/page.tsx',
  'app/page.tsx',
  'app/product/[id]/page.tsx',
  'app/register/page.tsx',
  'app/shop/page.tsx',
  'components/AddToCartButton.tsx',
  'components/Footer.tsx',
  'components/FormInput.tsx',
  'components/Header.tsx',
  'components/ProductCard.tsx',
  'components/VisualSearch.tsx',
  'import-products.ts',
  'lib/auth-context.tsx',
  'lib/types.ts',
  'next.config.ts',
  'package-lock.json',
  'package.json',
  'prisma/schema.prisma'
];

let restoredCount = 0;

try {
  const dirs = readdirSync(historyPath);
  for (const dir of dirs) {
    const entriesFile = join(historyPath, dir, 'entries.json');
    if (!statSync(entriesFile, { throwIfNoEntry: false })) continue;
    
    const entriesData = JSON.parse(readFileSync(entriesFile, 'utf8'));
    const resource = decodeURIComponent(entriesData.resource || '');
    
    if (resource.includes('my-app')) {
      let matchedFile = targetFiles.find(tf => resource.endsWith(tf.replace(/\\/g, '/')));
      if (matchedFile) {
        // Target time: May 24, 2026 19:37:00 UTC
        const threshold = new Date('2026-05-24T19:37:00Z').getTime();
        
        const validEntries = entriesData.entries
            .filter(e => e.timestamp < threshold)
            .sort((a, b) => b.timestamp - a.timestamp);
            
        if (validEntries.length > 0) {
          const latest = validEntries[0];
          const backupFile = join(historyPath, dir, latest.id);
          
          try {
            copyFileSync(backupFile, matchedFile);
            console.log(`Restored ${matchedFile} from VS Code history (timestamp: ${new Date(latest.timestamp).toISOString()})`);
            restoredCount++;
          } catch (err) {
            console.error(`Failed to copy ${backupFile} to ${matchedFile}`);
          }
        }
      }
    }
  }
} catch (e) {
  console.error(e);
}

console.log(`Total files restored: ${restoredCount}`);
