/**
 * One-time migration script: external images → Supabase Storage
 *
 * Usage:
 *   npx tsx src/lib/storage/migrate-images.ts
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * What it does:
 *   1. Scans all news_articles for cover_image_url and inline images in content
 *   2. Downloads each external image
 *   3. Processes through the optimization pipeline
 *   4. Uploads to the appropriate Storage bucket
 *   5. Creates a media_library record
 *   6. Updates the article to point to the new Storage URL
 *   7. Generates a migration report
 *
 * Run as a standalone script — NOT an automated migration.
 * Safe to re-run: skips URLs that already point to Supabase Storage.
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { basename } from 'path';
import type { Database } from '@/lib/supabase/database.types';
import type { MediaBucket } from '@/@types/media';
import { generateVariants, getImageDimensions } from './optimize';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MigrationResult {
  articleId: string;
  articleSlug: string;
  field: 'cover_image_url' | 'content';
  originalUrl: string;
  newUrl?: string;
  status: 'success' | 'skipped' | 'failed';
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExternalUrl(url: string): boolean {
  return url.startsWith('http') && !url.includes(SUPABASE_URL);
}

/**
 * Block private/loopback/metadata IP ranges to prevent SSRF.
 */
function isSafeUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (!['http:', 'https:'].includes(protocol)) return false;
    if (
      hostname === 'localhost' ||
      /^127\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^169\.254\./.test(hostname) ||
      hostname === '0.0.0.0'
    ) return false;
    return true;
  } catch {
    return false;
  }
}

function extractImageUrls(content: string): string[] {
  const urls: string[] = [];
  // Match src="..." in img tags
  const imgSrcRegex = /src="(https?:\/\/[^"]+)"/g;
  let match;
  while ((match = imgSrcRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  // Match markdown images ![alt](url)
  const mdImgRegex = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g;
  while ((match = mdImgRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return [...new Set(urls)];
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  if (!isSafeUrl(url)) {
    throw new Error(`Blocked URL (private/internal address not allowed): ${url}`);
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'ACTA-News-Migration/1.0' },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const mimeType = contentType.split(';')[0].trim();

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract and sanitize filename from URL — strip directory components and
  // allow only safe characters to prevent path traversal / command injection.
  const rawName = basename(new URL(url).pathname);
  const filename = rawName.replace(/[^a-zA-Z0-9._-]/g, '_') || `image-${randomUUID()}.jpg`;

  return { buffer, mimeType, filename };
}

function guessBucket(field: 'cover_image_url' | 'content'): MediaBucket {
  return field === 'cover_image_url' ? 'article-covers' : 'article-content';
}

async function migrateUrl(
  url: string,
  bucket: MediaBucket,
  uploadedBy: string
): Promise<string> {
  const { buffer, mimeType, filename } = await downloadImage(url);

  // Generate path — use only the sanitized extension from the filename
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const rawExt = filename.split('.').pop() ?? 'jpg';
  const ext = /^[a-zA-Z0-9]{1,5}$/.test(rawExt) ? rawExt : 'jpg';
  const uuid = randomUUID();
  const path = `${year}/${month}/${uuid}.${ext}`;

  // Compute hash
  const contentHash = createHash('sha256').update(buffer).digest('hex');

  // Get dimensions
  const { width, height } = await getImageDimensions(buffer, mimeType);

  // Generate variants
  const variants = await generateVariants(buffer, mimeType);

  // Upload original
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // Upload variants
  const variantPaths: Record<string, string> = {};
  for (const variant of variants) {
    const variantPath = path.replace(/\.[^.]+$/, `-${variant.key}.webp`);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(variantPath, variant.buffer, { contentType: 'image/webp', upsert: false });
    if (!error) variantPaths[variant.key] = variantPath;
  }

  // Insert media_library record
  await supabase.from('media_library').insert({
    bucket,
    path,
    original_name: filename,
    mime_type: mimeType,
    size_bytes: buffer.byteLength,
    width: width || null,
    height: height || null,
    variants: variantPaths,
    content_hash: contentHash,
    uploaded_by: uploadedBy,
  });

  // Return new public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚀 Starting image migration…\n');

  const results: MigrationResult[] = [];

  // Fetch all articles
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('id, slug, cover_image_url, content');

  if (error) {
    console.error('Failed to fetch articles:', error.message);
    process.exit(1);
  }

  console.log(`Found ${articles.length} articles to process\n`);

  for (const article of articles) {
    // --- Cover image ---
    if (article.cover_image_url && isExternalUrl(article.cover_image_url)) {
      const result: MigrationResult = {
        articleId: article.id,
        articleSlug: article.slug,
        field: 'cover_image_url',
        originalUrl: article.cover_image_url,
        status: 'failed',
      };

      try {
        console.log(`  Migrating cover: ${article.slug}`);
        const newUrl = await migrateUrl(article.cover_image_url, 'article-covers', 'migration-script');

        await supabase
          .from('news_articles')
          .update({ cover_image_url: newUrl })
          .eq('id', article.id);

        result.newUrl = newUrl;
        result.status = 'success';
        const safeSlug = article.slug.replace(/[\r\n]/g, '_');
        console.log(`  ✓ ${safeSlug} cover → [new storage URL]`);
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        const safeSlug = article.slug.replace(/[\r\n]/g, '_');
        console.error(`  ✗ ${safeSlug} cover: ${result.error}`);
      }

      results.push(result);
    }

    // --- Inline content images ---
    const contentUrls = extractImageUrls(article.content).filter(isExternalUrl);

    for (const url of contentUrls) {
      const result: MigrationResult = {
        articleId: article.id,
        articleSlug: article.slug,
        field: 'content',
        originalUrl: url,
        status: 'failed',
      };

      try {
        console.log(`  Migrating content image: ${url.slice(0, 60)}…`);
        const newUrl = await migrateUrl(url, 'article-content', 'migration-script');

        // Replace URL in content
        const newContent = article.content.replaceAll(url, newUrl);
        await supabase
          .from('news_articles')
          .update({ content: newContent })
          .eq('id', article.id);

        // Update local copy for subsequent replacements in same article
        article.content = newContent;

        result.newUrl = newUrl;
        result.status = 'success';
        const safeSlug2 = article.slug.replace(/[\r\n]/g, '_');
        console.log(`  ✓ Replaced in ${safeSlug2}`);
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        const safeSlug2 = article.slug.replace(/[\r\n]/g, '_');
        console.error(`  ✗ ${safeSlug2} content image: ${result.error}`);
      }

      results.push(result);
    }
  }

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------
  const succeeded = results.filter((r) => r.status === 'success');
  const failed = results.filter((r) => r.status === 'failed');
  const skipped = results.filter((r) => r.status === 'skipped');

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total processed : ${results.length}`);
  console.log(`✓ Succeeded     : ${succeeded.length}`);
  console.log(`✗ Failed        : ${failed.length}`);
  console.log(`→ Skipped       : ${skipped.length}`);

  if (failed.length > 0) {
    console.log('\nFailed URLs:');
    for (const r of failed) {
      const safeSlug = r.articleSlug.replace(/[\r\n]/g, '_');
      console.log(`  [${safeSlug}] [url redacted]`);
      console.log(`    Error: ${r.error}`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
