/**
 * Google Drive URL helpers.
 *
 * Accepts any Drive share URL and returns a direct viewable image URL.
 * Supported input formats:
 *   - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   - https://drive.google.com/file/d/FILE_ID/preview
 *   - https://drive.google.com/open?id=FILE_ID
 *   - https://drive.google.com/uc?id=FILE_ID
 *   - https://drive.google.com/thumbnail?id=FILE_ID
 *   - raw FILE_ID (33+ alphanumeric chars)
 *
 * Returns the `thumbnail` endpoint by default — most reliable for direct image
 * embedding (the `uc?id=` endpoint is increasingly rate-limited by Google).
 */

const FILE_ID_RX = /(?:\/file\/d\/|[?&](?:id|file)=)([a-zA-Z0-9_-]{20,})/;

export function extractDriveId(url) {
  if (!url) return null;
  const s = String(url).trim();
  const m = s.match(FILE_ID_RX);
  if (m) return m[1];
  // Raw ID (no URL prefix)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;
  return null;
}

/**
 * Convert a Drive URL → reliable direct image URL.
 * Width default 2000px works for hero & card images. Mobile auto-downscales.
 */
export function toDriveImageURL(url, width = 2000) {
  if (!url) return '';
  const id = extractDriveId(url);
  if (!id) return url; // Pass through non-Drive URLs unchanged (Supabase, local /images, etc.)
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
}

/** Shorter direct image URL — used inside the trek card on mobile */
export function toDriveImageURLSmall(url) {
  return toDriveImageURL(url, 1200);
}

/** Return the original Drive share-view URL — for admin reference */
export function toDriveViewURL(url) {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/file/d/${id}/view`;
}

export function isDriveURL(url) {
  return !!extractDriveId(url);
}
