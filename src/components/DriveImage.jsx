import { useState, memo } from 'react';
import { toDriveImageURL, isDriveURL } from '../lib/drive.js';

const FALLBACK_SRC = '/images/ridge-peak.jpg';
const SIZES_DEFAULT = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

function buildSrcSet(src) {
  if (!src || !isDriveURL(src)) return undefined;
  return [
    `${toDriveImageURL(src, 400)} 400w`,
    `${toDriveImageURL(src, 800)} 800w`,
    `${toDriveImageURL(src, 1200)} 1200w`,
    `${toDriveImageURL(src, 1800)} 1800w`,
    `${toDriveImageURL(src, 2400)} 2400w`
  ].join(', ');
}

/**
 * Premium image component:
 *  - Responsive srcSet for Drive-hosted images
 *  - Lazy + async decode
 *  - Soft fade-in when loaded
 *  - Local fallback if the upstream image fails (Drive throttle, missing file, etc.)
 *  - Passes through non-Drive sources (Supabase, /images, https) untouched
 */
function DriveImage({
  src,
  alt = '',
  fallback = FALLBACK_SRC,
  width = 1800,
  sizes = SIZES_DEFAULT,
  className = '',
  style,
  loading = 'lazy',
  fetchpriority,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const effective = failed
    ? fallback
    : src
      ? toDriveImageURL(src, width)
      : fallback;

  return (
    <img
      src={effective}
      srcSet={failed ? undefined : buildSrcSet(src)}
      sizes={isDriveURL(src) ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchpriority={fetchpriority}
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => { if (!failed) setFailed(true); }}
      className={`transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={style}
      {...rest}
    />
  );
}

export default memo(DriveImage);
