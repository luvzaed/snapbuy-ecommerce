-- Read-only export of the six Snapbuy application tables. This does not change Supabase.
-- Run this entire query in Supabase SQL Editor, then export ALL SIX result rows as CSV.
-- Save as snapbuy-export.csv. Keep the file private: it contains account and order data.
WITH source_metadata AS (
  SELECT COALESCE(jsonb_agg(tablename ORDER BY tablename), '[]'::jsonb) AS source_tables
  FROM pg_tables WHERE schemaname = 'public'
), payloads AS (
  SELECT 'User' AS table_name,
    (SELECT jsonb_agg(column_name ORDER BY ordinal_position)
     FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User') AS column_names,
    COALESCE(jsonb_agg(jsonb_build_object(
      'id', t."id"::text,
      'email', t."email"::text,
      'name', t."name"::text,
      'password', t."password"::text,
      'phone', t."phone"::text,
      'address', t."address"::text,
      'role', t."role"::text,
      'createdAt', t."createdAt"::text,
      'updatedAt', t."updatedAt"::text
    ) ORDER BY t.id), '[]'::jsonb) AS records
  FROM public."User" AS t
  UNION ALL
  SELECT 'Product' AS table_name,
    (SELECT jsonb_agg(column_name ORDER BY ordinal_position)
     FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Product') AS column_names,
    COALESCE(jsonb_agg(jsonb_build_object(
      'id', t."id"::text,
      'name', t."name"::text,
      'price', t."price"::text,
      'stock', t."stock"::text,
      'image', t."image"::text,
      'description', t."description"::text,
      'category', t."category"::text,
      'rating', t."rating"::text,
      'reviewCount', t."reviewCount"::text,
      'imageVector', t."imageVector"::text,
      'createdAt', t."createdAt"::text,
      'updatedAt', t."updatedAt"::text
    ) ORDER BY t.id), '[]'::jsonb) AS records
  FROM public."Product" AS t
  UNION ALL
  SELECT 'Order' AS table_name,
    (SELECT jsonb_agg(column_name ORDER BY ordinal_position)
     FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Order') AS column_names,
    COALESCE(jsonb_agg(jsonb_build_object(
      'id', t."id"::text,
      'total', t."total"::text,
      'status', t."status"::text,
      'shipping', t."shipping"::text,
      'userId', t."userId"::text,
      'createdAt', t."createdAt"::text,
      'updatedAt', t."updatedAt"::text
    ) ORDER BY t.id), '[]'::jsonb) AS records
  FROM public."Order" AS t
  UNION ALL
  SELECT 'OrderItem' AS table_name,
    (SELECT jsonb_agg(column_name ORDER BY ordinal_position)
     FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'OrderItem') AS column_names,
    COALESCE(jsonb_agg(jsonb_build_object(
      'id', t."id"::text,
      'quantity', t."quantity"::text,
      'price', t."price"::text,
      'orderId', t."orderId"::text,
      'productId', t."productId"::text
    ) ORDER BY t.id), '[]'::jsonb) AS records
  FROM public."OrderItem" AS t
  UNION ALL
  SELECT 'Newsletter' AS table_name,
    (SELECT jsonb_agg(column_name ORDER BY ordinal_position)
     FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Newsletter') AS column_names,
    COALESCE(jsonb_agg(jsonb_build_object(
      'id', t."id"::text,
      'email', t."email"::text,
      'createdAt', t."createdAt"::text
    ) ORDER BY t.id), '[]'::jsonb) AS records
  FROM public."Newsletter" AS t
  UNION ALL
  SELECT 'Review' AS table_name,
    (SELECT jsonb_agg(column_name ORDER BY ordinal_position)
     FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Review') AS column_names,
    COALESCE(jsonb_agg(jsonb_build_object(
      'id', t."id"::text,
      'rating', t."rating"::text,
      'comment', t."comment"::text,
      'userId', t."userId"::text,
      'productId', t."productId"::text,
      'createdAt', t."createdAt"::text,
      'updatedAt', t."updatedAt"::text
    ) ORDER BY t.id), '[]'::jsonb) AS records
  FROM public."Review" AS t
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
