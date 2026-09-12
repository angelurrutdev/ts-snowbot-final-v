import { SlashCommandBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { getLatestVideo } from '../lib/youtube'
import { buildVideoNotificationPayload } from '../lib/youtubeNotify'

export const command: UnifiedCommand = {
    name: 'test-video-latest',
    description: 'Muestra el aviso tal cual se vería si el bot lo mandara solo, con el último video subido.',
    data: new SlashCommandBuilder()
        .setName('test-video-latest')
        .setDescription('Muestra el aviso tal cual se vería si el bot lo mandara solo, con el último video subido.'),

    async execute(ctx) {
        // Ephemeral (solo lo ves tú) a propósito: el aviso real se manda
        // aparte, como mensaje normal del canal, para que se vea IDÉNTICO
        // a como se vería el aviso automático (sin el "usó /test-video-latest"
        // pegado encima).
        await ctx.deferReply({ ephemeral: true })
        try {
            const video = await getLatestVideo()
            await (ctx.channel as import('discord.js').SendableChannels).send(buildVideoNotificationPayload(video))
            await ctx.editReply('✅ Aviso de prueba enviado en el canal.')
        } catch (error) {
            console.error('[YOUTUBE] Error en /test-video-latest:', error)
            await ctx.editReply(`❌ No se pudo obtener el último video.\n\`${(error as Error).message}\``)
        }
    },
}
