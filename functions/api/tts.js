/**
 * Cloudflare Pages Function: /api/tts
 * Serves Neural Audio stream for Vietnamese Math learning app
 */

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const text = url.searchParams.get('text');
  const voice = url.searchParams.get('voice') || 'vi-VN-HoaiMyNeural';

  if (!text || !text.trim()) {
    return new Response(JSON.stringify({ error: 'Text query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Cloudflare Edge Cache lookup
    const cacheKey = new Request(url.toString(), context.request);
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (response) {
      return response;
    }

    // Google Translate TTS fallback stream
    const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(text)}`;
    const fetchRes = await fetch(gUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!fetchRes.ok) {
      return new Response(JSON.stringify({ error: 'Upstream TTS provider error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const audioBuffer = await fetchRes.arrayBuffer();

    response = new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
