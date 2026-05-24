/**
 * CSV Import Script for Products
 * --------------------------------
 * Usage:
 *   npx ts-node --esm import-products.ts
 *   OR using tsx (recommended):
 *   npx tsx import-products.ts
 *
 * Install tsx if needed:
 *   npm install -D tsx
 *
 * The CSV must have columns: name, price, image, description
 */

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Update this path to your actual CSV file location
const CSV_FILE_PATH = path.resolve(
  'C:\Users\zedal\flipkart_com-ecommerce_sample.csv',
);

interface CsvRow {
  name: string;
  price: string;
  image: string;
  description: string;
  [key: string]: string;
}

function parseCSV(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    let headers: string[] = [];

    const rl = createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    rl.on('line', (line: string) => {
      if (!line.trim()) return;
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      if (headers.length === 0) {
        headers = values;
      } else {
        const row: CsvRow = {} as CsvRow;
        headers.forEach((h, i) => (row[h] = values[i] ?? ''));
        rows.push(row);
      }
    });

    rl.on('close', () => resolve(rows));
    rl.on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`);
    console.error(
      `📂 Place your CSV file next to this script or update CSV_FILE_PATH.`,
    );
    process.exit(1);
  }

  console.log(`📂 Reading CSV from: ${CSV_FILE_PATH}`);
  const rows = await parseCSV(CSV_FILE_PATH);
  console.log(`📊 Found ${rows.length} rows to import...`);

  let success = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.product_name || row.name || '';
    const price = parseFloat(
      row.discounted_price || row.retail_price || row.price || '0',
    );
    const image = row.image || row.image_link || '';
    const description = row.description || row.about_product || '';

    if (!name || isNaN(price)) {
      skipped++;
      continue;
    }

    try {
      await prisma.product.create({
        data: { name, price, image, description },
      });
      success++;
    } catch {
      skipped++;
    }
  }

  console.log(`✅ Imported: ${success} products`);
  console.log(`⏭️  Skipped: ${skipped} rows (missing name/price)`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
