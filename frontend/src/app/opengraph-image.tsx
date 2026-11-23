import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt =
  'DigiRoute — Sovereign Micro-Addressing & DIGIPIN Navigation';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

/**
 * Open Graph Social Card Route Handler (/opengraph-image)
 *
 * Serves the production social card from public/opengraph-image.png
 */
export default async function Image() {
  try {
    const filePath = join(process.cwd(), 'public', 'opengraph-image.png');
    const imageBuffer = await readFile(filePath);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to load opengraph-image.png from public folder:', error);
    return new Response('OpenGraph image not found', { status: 404 });
  }
}
