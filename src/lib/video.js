/**
 * Works out what kind of video a pasted link is, so videos.json only needs a single "url" per video.
 *
 *   YouTube     https://www.youtube.com/watch?v=ID · https://youtu.be/ID · https://www.youtube.com/shorts/ID
 *   Instagram   https://www.instagram.com/reel/CODE/ · /p/CODE/ · /tv/CODE/
 *   Facebook    https://www.facebook.com/<page>/videos/123… · /reel/123… · https://fb.watch/…
 *   Own file    videos/my-video.mp4   (a file inside /public/videos)
 */
const YT_ID = /^[\w-]{11}$/;

export function parseVideo(entry) {
  const raw = (entry.url ?? '').trim();
  if (!raw) return null;

  // Own MP4 / WebM file
  if (/\.(mp4|webm|mov)$/i.test(raw) && !/^https?:\/\//i.test(raw)) {
    return { kind: 'file', file: raw, portrait: entry.orientation === 'portrait' };
  }

  let u;
  try { u = new URL(raw); } catch { return null; }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  const parts = u.pathname.split('/').filter(Boolean);

  // YouTube
  if (host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    let id = null, shorts = false;
    if (host === 'youtu.be') id = parts[0];
    else if (parts[0] === 'shorts') { id = parts[1]; shorts = true; }
    else if (parts[0] === 'embed' || parts[0] === 'live') id = parts[1];
    else id = u.searchParams.get('v');
    if (!id || !YT_ID.test(id)) return null;
    return {
      kind: 'youtube',
      portrait: shorts || entry.orientation === 'portrait',
      embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      watch: `https://www.youtube.com/watch?v=${id}`,
      label: shorts ? 'YouTube Short' : 'YouTube',
    };
  }

  // Instagram (reels, posts, IGTV) – public posts only
  if (host === 'instagram.com') {
    const i = parts.findIndex((p) => ['reel', 'reels', 'p', 'tv'].includes(p));
    const code = i >= 0 ? parts[i + 1] : null;
    if (!code) return null;
    return {
      kind: 'instagram',
      portrait: entry.orientation !== 'landscape',
      embed: `https://www.instagram.com/${parts[i] === 'p' ? 'p' : 'reel'}/${code}/embed/`,
      watch: `https://www.instagram.com/${parts[i] === 'p' ? 'p' : 'reel'}/${code}/`,
      label: 'Instagram Reel',
    };
  }

  // Facebook (videos and reels) – public posts only
  if (host === 'facebook.com' || host === 'fb.watch' || host === 'fb.com') {
    return {
      kind: 'facebook',
      portrait: entry.orientation === 'portrait' || parts.includes('reel'),
      embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}&show_text=false&autoplay=true`,
      watch: raw,
      label: 'Facebook',
    };
  }

  return null;
}
