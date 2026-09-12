import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'

export const command: UnifiedCommand = {
    name: 'ping',
    level: 20,
    description: 'Comprueba que el bot está vivo y muestra la latencia.',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Comprueba que el bot está vivo y muestra la latencia.'),

    async execute(ctx) {
        const latency = Date.now() - ctx.createdTimestamp

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`Latencia: \`${latency}ms\`\nAPI: \`${Math.round(ctx.client.ws.ping)}ms\``)
            .setColor('Blue')

        await ctx.reply({ embeds: [embed] })
    },
}
