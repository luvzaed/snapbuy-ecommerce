import fs from 'node:fs';

const layout = {
  User: ['id', 'email', 'name', 'password', 'phone', 'address', 'role', 'createdAt', 'updatedAt'],
  Product: ['id', 'name', 'price', 'stock', 'image', 'description', 'category', 'rating', 'reviewCount', 'imageVector', 'createdAt', 'updatedAt'],
  Order: ['id', 'total', 'status', 'shipping', 'userId', 'createdAt', 'updatedAt'],
  OrderItem: ['id', 'quantity', 'price', 'orderId', 'productId'],
  Newsletter: ['id', 'email', 'createdAt'],
  Review: ['id', 'rating', 'comment', 'userId', 'productId', 'createdAt', 'updatedAt'],
};
const literal = value => "'" + value.replaceAll("'", "''") + "'";
const parts = Object.entries(layout).map(([table, cols]) => `  SELECT ${literal(table)} AS table_name,
    (SELECT jsonb_agg(column_name ORDER BY ordinal_position)
     FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${literal(table)}) AS column_names,
    COALESCE(jsonb_agg(jsonb_build_object(
      ${cols.map(col => `${literal(col)}, t."${col}"::text`).join(',\n      ')}
    ) ORDER BY t.id), '[]'::jsonb) AS records
  FROM public."${table}" AS t`);
fs.writeFileSync('EXPORT-SNAPBUY.sql', `-- Read-only export of the six Snapbuy application tables. This does not change Supabase.
-- Run this entire query in Supabase SQL Editor, then export ALL SIX result rows as CSV.
-- Save as snapbuy-export.csv. Keep the file private: it contains account and order data.
WITH source_metadata AS (
  SELECT COALESCE(jsonb_agg(tablename ORDER BY tablename), '[]'::jsonb) AS source_tables
  FROM pg_tables WHERE schemaname = 'public'
), payloads AS (
${parts.join('\n  UNION ALL\n')}
)
SELECT table_name,
  'snapbuy-postgres-text-v1' AS format,
  source_tables::text AS source_tables,
  column_names::text AS column_names,
  jsonb_array_length(records) AS row_count,
  records::text AS records,
  md5(records::text) AS content_md5
FROM payloads CROSS JOIN source_metadata
ORDER BY table_name;
`);
