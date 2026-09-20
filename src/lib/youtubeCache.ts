import * as fs from 'fs'
import * as path from 'path'

const CACHE_PATH = path.join(process.cwd(), 'youtube-cache.json')

export interface YoutubeCache {
    /** IDs de los últimos uploads ya avisados (los más recientes al final). */
    announcedIds: string[]
}

/** Formato viejo del cache (solo guardaba el último video avisado). */
interface LegacyYoutubeCache {
    lastVideoId: string
}

export function readCache(): YoutubeCache | null {
    try {
        const raw = fs.readFileSync(CACHE_PATH, 'utf-8')
        const parsed = JSON.parse(raw) as Partial<YoutubeCache & LegacyYoutubeCache>

        if (Array.isArray(parsed.announcedIds)) {
            return { announcedIds: parsed.announcedIds }
        }

        // Migración automática desde el formato viejo ({ lastVideoId }).
        if (typeof parsed.lastVideoId === 'string' && parsed.lastVideoId) {
            return { announcedIds: [parsed.lastVideoId] }
        }

        return null
    } catch {
        return null
    }
}

export function writeCache(cache: YoutubeCache): void {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8')
}
