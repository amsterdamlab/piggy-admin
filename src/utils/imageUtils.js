/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - IMAGE UTILS
   Centralized image URL resolution with local assets & CDN fallback
   ========================================================================== */

const CDN_BASE_URL = 'https://piggy-app-v2-gvm.vercel.app';
const FALLBACK_PLACEHOLDER = 'https://placehold.co/100x100/151B28/FF4B8B?text=Piggy';

/**
 * Resolves an image URL for display in Piggy Admin.
 * Supports:
 * - Direct HTTP/HTTPS URLs (e.g. from GitHub Raw, CDNs, Supabase Storage, etc.)
 * - Data URLs and Blobs
 * - Relative platform assets (e.g. "assets/piggies/stage2/et2-2.jpg" or "/assets/...")
 */
export function resolveImageUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Remove leading slash for consistency
  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

  // In the admin app, local static assets are served from root (e.g. /assets/piggies/...)
  return `/${cleanPath}`;
}

/**
 * Gets a reliable remote CDN fallback for standard platform assets.
 */
export function getFallbackImageUrl(url) {
  if (!url) return FALLBACK_PLACEHOLDER;
  const trimmed = String(url).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${CDN_BASE_URL}/${cleanPath}`;
}

/**
 * Standard preset images available in the Piggy ecosystem.
 */
export const PIGGY_PRESET_IMAGES = [
  { id: 'et1-1', label: 'E1 #1 (15kg)', path: 'assets/piggies/stage1/et1-1.jpg', stage: 'Etapa 1' },
  { id: 'et1-2', label: 'E1 #2 (15kg)', path: 'assets/piggies/stage1/et1-2.jpg', stage: 'Etapa 1' },
  { id: 'et1-3', label: 'E1 #3 (15kg)', path: 'assets/piggies/stage1/et1-3.jpg', stage: 'Etapa 1' },
  { id: 'et1-4', label: 'E1 #4 (15kg)', path: 'assets/piggies/stage1/et1-4.jpg', stage: 'Etapa 1' },
  { id: 'et1-5', label: 'E1 #5 (15kg)', path: 'assets/piggies/stage1/et1-5.jpg', stage: 'Etapa 1' },

  { id: 'et2-1', label: 'E2 #1 (35kg)', path: 'assets/piggies/stage2/et2-1.jpg', stage: 'Etapa 2' },
  { id: 'et2-2', label: 'E2 #2 (35kg)', path: 'assets/piggies/stage2/et2-2.jpg', stage: 'Etapa 2' },
  { id: 'et2-3', label: 'E2 #3 (55kg)', path: 'assets/piggies/stage2/et2-3.jpg', stage: 'Etapa 2' },
  { id: 'et2-4', label: 'E2 #4 (55kg)', path: 'assets/piggies/stage2/et2-4.jpg', stage: 'Etapa 2' },
  { id: 'et2-5', label: 'E2 #5 (55kg)', path: 'assets/piggies/stage2/et2-5.jpg', stage: 'Etapa 2' },

  { id: 'et3-1', label: 'E3 #1 (65kg)', path: 'assets/piggies/stage3/et3-1.jpg', stage: 'Etapa 3' },
  { id: 'et3-2', label: 'E3 #2 (65kg)', path: 'assets/piggies/stage3/et3-2.jpg', stage: 'Etapa 3' },
  { id: 'et3-3', label: 'E3 #3 (75kg)', path: 'assets/piggies/stage3/et3-3.jpg', stage: 'Etapa 3' },
  { id: 'et3-4', label: 'E3 #4 (90kg)', path: 'assets/piggies/stage3/et3-4.jpg', stage: 'Etapa 3' },
  { id: 'et3-5', label: 'E3 #5 (110kg)', path: 'assets/piggies/stage3/et3-5.jpg', stage: 'Etapa 3' },
];
