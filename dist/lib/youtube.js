"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestVideo = getLatestVideo;
exports.getRecentVideos = getRecentVideos;
exports.getLatestByType = getLatestByType;
const API_BASE = 'https://www.googleapis.com/youtube/v3';
// YouTube considera Short a todo lo de 3 minutos o menos. No existe un
// campo oficial "esShort" en la API, así que esto es lo más cercano.
const SHORT_MAX_SECONDS = 180;
/**
 * Todo canal de YouTube tiene una "uploads playlist" que contiene, en orden,
 * todos sus videos subidos (normales, Shorts y directos por igual — YouTube
 * no los separa). Su ID se deriva del channel ID cambiando el prefijo "UC"
 * por "UU" — así nos ahorramos una llamada extra a channels.list solo para
 * conseguir ese playlist ID.
 */
function getUploadsPlaylistId(channelId) {
    if (!channelId.startsWith('UC')) {
        throw new Error(`[YOUTUBE] YOUTUBE_CHANNEL_ID inválido (debe empezar con "UC..."): ${channelId}`);
    }
    return `UU${channelId.slice(2)}`;
}
function getEnv() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!apiKey)
        throw new Error('[YOUTUBE] YOUTUBE_API_KEY no definido en .env');
    if (!channelId)
        throw new Error('[YOUTUBE] YOUTUBE_CHANNEL_ID no definido en .env');
    return { apiKey, channelId };
}
/** Convierte una duración ISO 8601 ("PT4M13S") a segundos. */
function parseIsoDuration(iso) {
    const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
    if (!match)
        return 0;
    const [, h, m, s] = match;
    return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}
/** Trae los `scanLimit` uploads más recientes (newest-first) del canal configurado. */
async function fetchRecentItems(scanLimit) {
    const { apiKey, channelId } = getEnv();
    const uploadsPlaylistId = getUploadsPlaylistId(channelId);
    const url = `${API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${scanLimit}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`[YOUTUBE] Error de la API (${res.status}): ${body}`);
    }
    const data = await res.json();
    const items = (data.items ?? []).map((item) => ({
        videoId: item.snippet.resourceId.videoId,
        snippet: item.snippet,
    }));
    if (!items.length)
        throw new Error('[YOUTUBE] El canal no tiene videos o el YOUTUBE_CHANNEL_ID es incorrecto');
    return { apiKey, items };
}
/** Trae duración + estado de "en vivo" de varios videos en una sola llamada (hasta 50 IDs). */
async function fetchDetails(apiKey, videoIds) {
    const url = `${API_BASE}/videos?part=snippet,contentDetails,liveStreamingDetails&id=${videoIds.join(',')}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`[YOUTUBE] Error de la API (${res.status}): ${body}`);
    }
    const data = await res.json();
    return new Map((data.items ?? []).map((d) => [d.id, d]));
}
function classify(details) {
    const liveBroadcastContent = details?.snippet?.liveBroadcastContent ?? 'none';
    const durationSeconds = parseIsoDuration(details?.contentDetails?.duration ?? 'PT0S');
    if (liveBroadcastContent === 'live')
        return 'live';
    if (durationSeconds > 0 && durationSeconds <= SHORT_MAX_SECONDS)
        return 'short';
    return 'video';
}
function toVideo(videoId, snippet, type) {
    const thumbnails = snippet.thumbnails ?? {};
    const thumbnailUrl = thumbnails.maxres?.url ?? thumbnails.standard?.url ?? thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url;
    return {
        videoId,
        type,
        title: snippet.title,
        description: snippet.description ?? '',
        channelTitle: snippet.channelTitle,
        thumbnailUrl,
        publishedAt: snippet.publishedAt,
        url: type === 'short' ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`,
    };
}
/**
 * Devuelve el upload más reciente del canal configurado (sin importar el
 * tipo), ya clasificado en `type`. Dos llamadas (2 unidades de cuota).
 */
async function getLatestVideo() {
    const { apiKey, items } = await fetchRecentItems(1);
    const item = items[0];
    const detailsById = await fetchDetails(apiKey, [item.videoId]);
    const type = classify(detailsById.get(item.videoId));
    return toVideo(item.videoId, item.snippet, type);
}
/**
 * Trae los últimos `scanLimit` uploads (newest-first) ya clasificados.
 * A diferencia de `getLatestVideo()` (que solo trae 1), esto le permite al
 * watcher revisar varios uploads a la vez y no saltarse ninguno si subes
 * más de una cosa entre dos revisiones (por ejemplo un Short y un video
 * casi al mismo tiempo). Sigue siendo solo 2 llamadas a la API.
 */
async function getRecentVideos(scanLimit = 10) {
    const { apiKey, items } = await fetchRecentItems(scanLimit);
    const detailsById = await fetchDetails(apiKey, items.map(item => item.videoId));
    const videos = [];
    for (const item of items) {
        const details = detailsById.get(item.videoId);
        if (!details)
            continue;
        videos.push(toVideo(item.videoId, item.snippet, classify(details)));
    }
    return videos;
}
/**
 * Recorre los últimos `scanLimit` uploads (newest-first) y devuelve el
 * primero que coincida con el tipo pedido ('video' | 'short' | 'live').
 * Sigue siendo solo 2 llamadas a la API sin importar cuántos revise.
 */
async function getLatestByType(type, scanLimit = 25) {
    const { apiKey, items } = await fetchRecentItems(scanLimit);
    const detailsById = await fetchDetails(apiKey, items.map(item => item.videoId));
    for (const item of items) {
        const details = detailsById.get(item.videoId);
        if (!details)
            continue;
        const itemType = classify(details);
        if (itemType === type)
            return toVideo(item.videoId, item.snippet, itemType);
    }
    throw new Error(`[YOUTUBE] No se encontró ningún "${type}" entre los últimos ${scanLimit} uploads del canal`);
}
