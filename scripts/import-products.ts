import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function importProducts() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Read CSV file
  const csvPath = path.join(__dirname, '..', 'data', 'products.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  // Skip header row
  const rows = lines.slice(1);

  console.log(`\n📦 Found ${rows.length} products to import...\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const row of rows) {
    // Parse CSV - handle commas in descriptions
    const parts = row.split(',');

    // CSV columns: name, price, description, image, category, stock
    const name = parts[0].trim();
    const price = parseFloat(parts[1].trim());
    const description = parts[2].trim();
    // Image URL contains commas in query params, so we need to reconstruct it
    // Find the URL (starts with https://)
    const remaining = parts.slice(3).join(',');
    const urlMatch = remaining.match(/(https:\/\/[^,]+(?:&[^,]+)*)/);
    const image = urlMatch ? urlMatch[1].trim() : '';
    
    // After the URL, get category and stock
    const afterUrl = remaining.substring(remaining.indexOf(image) + image.length);
    const extraParts = afterUrl.split(',').filter(p => p.trim() !== '');
    const category = extraParts[0]?.trim() || 'General';
    const stock = parseInt(extraParts[1]?.trim() || '0', 10);

    if (!name || !price || !image) {
      console.log(`⚠️  Skipping invalid row: ${name || 'unnamed'}`);
      skipCount++;
      continue;
    }

    try {
      // Check if product already exists
      const existing = await pool.query(
        'SELECT id FROM "Product" WHERE name = $1',
        [name]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Already exists: ${name}`);
        skipCount++;
        continue;
      }

      await pool.query(
        `INSERT INTO "Product" (name, price, description, image, category, stock, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [name, price, description, image, category, stock]
      );

      console.log(`✅ Added: ${name} ($${price}) [${category}]`);
      successCount++;
    } catch (error: unknown) {
      console.error(`❌ Error adding ${name}:`, (error as Error).message);
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Imported: ${successCount} products`);
  console.log(`⏭️  Skipped: ${skipCount} products`);
  console.log(`📊 Total: ${rows.length} products`);
  console.log(`========================================\n`);

  await pool.end();
}

importProducts().catch(console.error);
