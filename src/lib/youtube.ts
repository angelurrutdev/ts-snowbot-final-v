const API_BASE = 'https://www.googleapis.com/youtube/v3'

export type YoutubeVideoType = 'video' | 'short' | 'live'

export interface YoutubeVideo {
    videoId: string
    type: YoutubeVideoType
    title: string
    description: string
    channelTitle: string
    thumbnailUrl: string
    publishedAt: string
    url: string
}

// YouTube considera Short a todo lo de 3 minutos o menos. No existe un
// campo oficial "esShort" en la API, así que esto es lo más cercano.
const SHORT_MAX_SECONDS = 180

/**
 * Todo canal de YouTube tiene una "uploads playlist" que contiene, en orden,
 * todos sus videos subidos (normales, Shorts y directos por igual — YouTube
 * no los separa). Su ID se deriva del channel ID cambiando el prefijo "UC"
 * por "UU" — así nos ahorramos una llamada extra a channels.list solo para
 * conseguir ese playlist ID.
 */
function getUploadsPlaylistId(channelId: string): string {
    if (!channelId.startsWith('UC')) {
        throw new Error(`[YOUTUBE] YOUTUBE_CHANNEL_ID inválido (debe empezar con "UC..."): ${channelId}`)
    }
    return `UU${channelId.slice(2)}`
}

function getEnv() {
    const apiKey = process.env.YOUTUBE_API_KEY
    const channelId = process.env.YOUTUBE_CHANNEL_ID
    if (!apiKey) throw new Error('[YOUTUBE] YOUTUBE_API_KEY no definido en .env')
    if (!channelId) throw new Error('[YOUTUBE] YOUTUBE_CHANNEL_ID no definido en .env')
    return { apiKey, channelId }
}

/** Convierte una duración ISO 8601 ("PT4M13S") a segundos. */
function parseIsoDuration(iso: string): number {
    const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso)
    if (!match) return 0
    const [, h, m, s] = match
    return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0)
}

interface RawItem {
    videoId: string
    snippet: any
}

/** Trae los `scanLimit` uploads más recientes (newest-first) del canal configurado. */
async function fetchRecentItems(scanLimit: number): Promise<{ apiKey: string; items: RawItem[] }> {
    const { apiKey, channelId } = getEnv()
    const uploadsPlaylistId = getUploadsPlaylistId(channelId)

    const url = `${API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${scanLimit}&key=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`[YOUTUBE] Error de la API (${res.status}): ${body}`)
    }

    const data = await res.json() as any
    const items: RawItem[] = (data.items ?? []).map((item: any) => ({
        videoId: item.snippet.resourceId.videoId,
        snippet: item.snippet,
    }))
    if (!items.length) throw new Error('[YOUTUBE] El canal no tiene videos o el YOUTUBE_CHANNEL_ID es incorrecto')

    return { apiKey, items }
}

/** Trae duración + estado de "en vivo" de varios videos en una sola llamada (hasta 50 IDs). */
async function fetchDetails(apiKey: string, videoIds: string[]): Promise<Map<string, any>> {
    const url = `${API_BASE}/videos?part=snippet,contentDetails,liveStreamingDetails&id=${videoIds.join(',')}&key=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`[YOUTUBE] Error de la API (${res.status}): ${body}`)
    }
    const data = await res.json() as any
    return new Map((data.items ?? []).map((d: any) => [d.id, d]))
}

function classify(details: any): YoutubeVideoType {
    const liveBroadcastContent: string = details?.snippet?.liveBroadcastContent ?? 'none'
    const durationSeconds = parseIsoDuration(details?.contentDetails?.duration ?? 'PT0S')

    if (liveBroadcastContent === 'live') return 'live'
    if (durationSeconds > 0 && durationSeconds <= SHORT_MAX_SECONDS) return 'short'
    return 'video'
}

function toVideo(videoId: string, snippet: any, type: YoutubeVideoType): YoutubeVideo {
    const thumbnails = snippet.thumbnails ?? {}
    const thumbnailUrl: string =
        thumbnails.maxres?.url ?? thumbnails.standard?.url ?? thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url

    return {
        videoId,
        type,
        title: snippet.title,
        description: snippet.description ?? '',
        channelTitle: snippet.channelTitle,
        thumbnailUrl,
        publishedAt: snippet.publishedAt,
        url: type === 'short' ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`,
    }
}

/**
 * Devuelve el upload más reciente del canal configurado (sin importar el
 * tipo), ya clasificado en `type`. Dos llamadas (2 unidades de cuota).
 */
export async function getLatestVideo(): Promise<YoutubeVideo> {
    const { apiKey, items } = await fetchRecentItems(1)
    const item = items[0]
    const detailsById = await fetchDetails(apiKey, [item.videoId])
    const type = classify(detailsById.get(item.videoId))
    return toVideo(item.videoId, item.snippet, type)
}

/**
 * Trae los últimos `scanLimit` uploads (newest-first) ya clasificados.
 * A diferencia de `getLatestVideo()` (que solo trae 1), esto le permite al
 * watcher revisar varios uploads a la vez y no saltarse ninguno si subes
 * más de una cosa entre dos revisiones (por ejemplo un Short y un video
 * casi al mismo tiempo). Sigue siendo solo 2 llamadas a la API.
 */
export async function getRecentVideos(scanLimit = 10): Promise<YoutubeVideo[]> {
    const { apiKey, items } = await fetchRecentItems(scanLimit)
    const detailsById = await fetchDetails(apiKey, items.map(item => item.videoId))

    const videos: YoutubeVideo[] = []
    for (const item of items) {
        const details = detailsById.get(item.videoId)
        if (!details) continue
        videos.push(toVideo(item.videoId, item.snippet, classify(details)))
    }
    return videos
}

/**
 * Recorre los últimos `scanLimit` uploads (newest-first) y devuelve el
 * primero que coincida con el tipo pedido ('video' | 'short' | 'live').
 * Sigue siendo solo 2 llamadas a la API sin importar cuántos revise.
 */
export async function getLatestByType(type: YoutubeVideoType, scanLimit = 25): Promise<YoutubeVideo> {
    const { apiKey, items } = await fetchRecentItems(scanLimit)
    const detailsById = await fetchDetails(apiKey, items.map(item => item.videoId))

    for (const item of items) {
        const details = detailsById.get(item.videoId)
        if (!details) continue

        const itemType = classify(details)
        if (itemType === type) return toVideo(item.videoId, item.snippet, itemType)
    }

    throw new Error(`[YOUTUBE] No se encontró ningún "${type}" entre los últimos ${scanLimit} uploads del canal`)
}
