import { EmbedBuilder } from 'discord.js'
import type { YoutubeVideo, YoutubeVideoType } from './youtube'

// Si no defines la variable correspondiente en el .env, se usa este texto.
const DEFAULT_TEMPLATES: Record<YoutubeVideoType, string> = {
    video: '📺 **{canal}** subió un video nuevo!\n{url}',
    short: '🔥 **{canal}** subió un Short!\n{url}',
    live: '🔴 **{canal}** está en VIVO ahora mismo!\n{url}',
}

// Nombre de la variable de entorno que moldea el mensaje de cada tipo.
const ENV_VARS: Record<YoutubeVideoType, string> = {
    video: 'YOUTUBE_MSG_VIDEO',
    short: 'YOUTUBE_MSG_SHORT',
    live: 'YOUTUBE_MSG_LIVE',
}

const EMBED_COLORS: Record<YoutubeVideoType, number> = {
    video: 0xff0000,
    short: 0xff0050,
    live: 0xed2020,
}

const FOOTERS: Record<YoutubeVideoType, string> = {
    video: 'YouTube',
    short: 'YouTube Shorts',
    live: 'YouTube • En vivo',
}

/** Reemplaza {canal}, {titulo} y {url} en la plantilla con los datos reales. */
function fillTemplate(template: string, video: YoutubeVideo): string {
    return template
        .replaceAll('{canal}', video.channelTitle)
        .replaceAll('{titulo}', video.title)
        .replaceAll('{url}', video.url)
}

/**
 * Construye el mismo payload (content + embed) que se manda automáticamente
 * cuando el watcher detecta contenido nuevo. El texto ("content") sale de
 * la plantilla que definas en el .env según el tipo detectado — video,
 * short o directo — así que puedes moldear cada uno sin tocar código.
 * Placeholders disponibles: {canal}, {titulo}, {url}
 */
export function buildVideoNotificationPayload(video: YoutubeVideo) {
    const template = process.env[ENV_VARS[video.type]] || DEFAULT_TEMPLATES[video.type]
    const content = fillTemplate(template, video)

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS[video.type])
        .setAuthor({ name: video.channelTitle })
        .setTitle(video.title)
        .setURL(video.url)
        .setImage(video.thumbnailUrl)
        .setFooter({ text: FOOTERS[video.type] })
        .setTimestamp(new Date(video.publishedAt))

    return { content, embeds: [embed] }
}
