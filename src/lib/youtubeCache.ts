import * as fs from 'fs'
import * as path from 'path'

const CACHE_PATH = path.join(process.cwd(), 'youtube-cache.json')

interface YoutubeCache {
    lastVideoId: string
}

export function readCache(): YoutubeCache | null {
    try {
        const raw = fs.readFileSync(CACHE_PATH, 'utf-8')
        return JSON.parse(raw) as YoutubeCache
    } catch {
        return null
    }
}

export function writeCache(cache: YoutubeCache): void {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8')
}
