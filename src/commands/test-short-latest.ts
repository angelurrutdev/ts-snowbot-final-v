import { SlashCommandBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { getLatestByType } from '../lib/youtube'
import { buildVideoNotificationPayload } from '../lib/youtubeNotify'

export const command: UnifiedCommand = {
    name: 'test-short-latest',
    description: 'Muestra el aviso tal cual se vería con el último Short subido al canal configurado.',
    data: new SlashCommandBuilder()
        .setName('test-short-latest')
        .setDescription('Muestra el aviso tal cual se vería con el último Short subido al canal configurado.'),

    async execute(ctx) {
        await ctx.deferReply({ ephemeral: true })
        try {
            const video = await getLatestByType('short')
            await (ctx.channel as import('discord.js').SendableChannels).send(buildVideoNotificationPayload(video))
            await ctx.editReply('✅ Aviso de prueba enviado en el canal.')
        } catch (error) {
            console.error('[YOUTUBE] Error en /test-short-latest:', error)
            await ctx.editReply(`❌ No se pudo obtener el último Short.\n\`${(error as Error).message}\``)
        }
    },
}
