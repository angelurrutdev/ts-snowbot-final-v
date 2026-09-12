import type { SendableChannels } from 'discord.js'
import type { GlobClient } from '../types/index'
import { getLatestVideo } from './youtube'
import { buildVideoNotificationPayload } from './youtubeNotify'
import { readCache, writeCache } from './youtubeCache'

const DEFAULT_INTERVAL_MINUTES = 5

/**
 * Revisa cada cierto tiempo si el canal de YouTube configurado subió un
 * video nuevo y, si es así, lo avisa solo en YOUTUBE_NOTIFY_CHANNEL_ID.
 *
 * Al primer arranque, si todavía no existe youtube-cache.json, lo crea con
 * el video actual del canal SIN avisarlo — así nunca hay que "sembrar" nada
 * a mano: el bot simplemente no avisa retroactivamente todo el historial
 * la primera vez que se prende, y de ahí en adelante detecta lo nuevo solo.
 */
export function startYoutubeWatcher(client: GlobClient): void {
    const channelId = process.env.YOUTUBE_NOTIFY_CHANNEL_ID
    if (!channelId) {
        console.log('[YOUTUBE] YOUTUBE_NOTIFY_CHANNEL_ID no definido en .env: el aviso automático queda apagado (solo /test-video-latest sigue funcionando)')
        return
    }

    const intervalMinutes = Number(process.env.YOUTUBE_POLL_MINUTES) || DEFAULT_INTERVAL_MINUTES

    const check = async () => {
        try {
            const video = await getLatestVideo()
            const cache = readCache()

            if (!cache) {
                writeCache({ lastVideoId: video.videoId })
                console.log(`[YOUTUBE] Cache inicial creada con el video actual (${video.videoId}); no se avisa retroactivamente`)
                return
            }

            if (cache.lastVideoId === video.videoId) return

            const channel = await client.channels.fetch(channelId)
            if (!channel || !channel.isTextBased()) {
                console.log('[YOUTUBE] YOUTUBE_NOTIFY_CHANNEL_ID no apunta a un canal de texto válido')
                return
            }

            await (channel as SendableChannels).send(buildVideoNotificationPayload(video))
            writeCache({ lastVideoId: video.videoId })
            console.log(`[YOUTUBE] Aviso enviado (${video.type}): ${video.title}`)
        } catch (error) {
            console.error('[YOUTUBE] Error revisando videos nuevos:', error)
        }
    }

    check()
    setInterval(check, intervalMinutes * 60_000)
    console.log(`[YOUTUBE] Vigilando el canal cada ${intervalMinutes} minuto(s)`)
}
