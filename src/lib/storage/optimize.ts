/**
 * Image optimization pipeline.
 *
 * Runs server-side only (Node.js / API route).
 * Uses Sharp to generate multiple size variants, convert to WebP,
 * strip EXIF metadata, and preserve aspect ratio.
 *
 * SVG files are returned as-is (Sharp cannot process them).
 */

import sharp from 'sharp';
import type { ProcessedVariant, VariantSpec } from '@/@types/media';
import { VARIANT_SPECS } from './constants';

/**
 * Process a single image buffer into all named variants.
 *
 * @param input   Raw file buffer from the upload.
 * @param mimeType  Original MIME type — SVGs are skipped.
 * @returns Array of processed variants ready for upload.
 */
export async function generateVariants(
  input: Buffer,
  mimeType: string
): Promise<ProcessedVariant[]> {
  // SVG: return a single "original" variant — Sharp cannot rasterize SVGs.
  if (mimeType === 'image/svg+xml') {
    return [
      {
        key: 'thumb',
        buffer: input,
        width: 0,
        height: 0,
        sizeBytes: input.byteLength,
      },
    ];
  }

  const results: ProcessedVariant[] = [];

  for (const spec of VARIANT_SPECS) {
    const processed = await processVariant(input, spec);
    results.push(processed);
  }

  return results;
}

/**
 * Get the dimensions of the original image.
 */
export async function getImageDimensions(
  input: Buffer,
  mimeType: string
): Promise<{ width: number; height: number }> {
  if (mimeType === 'image/svg+xml') {
    return { width: 0, height: 0 };
  }

  const metadata = await sharp(input).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

async function processVariant(input: Buffer, spec: VariantSpec): Promise<ProcessedVariant> {
  let pipeline = sharp(input)
    // Strip EXIF metadata for privacy — use withMetadata({}) to clear all
    .withMetadata({})
    .rotate(); // Auto-rotate based on EXIF orientation before stripping

  if (spec.height) {
    // Fixed dimensions (e.g. OG image 1200x630)
    pipeline = pipeline.resize(spec.width, spec.height, {
      fit: spec.fit ?? 'cover',
      position: 'centre',
    });
  } else {
    // Width-only resize — preserve aspect ratio
    pipeline = pipeline.resize(spec.width, undefined, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to WebP for all variants
  pipeline = pipeline.webp({ quality: 82, effort: 4 });

  const buffer = await pipeline.toBuffer();
  const metadata = await sharp(buffer).metadata();

  return {
    key: spec.key,
    buffer,
    width: metadata.width ?? spec.width,
    height: metadata.height ?? 0,
    sizeBytes: buffer.byteLength,
  };
}
