import { SlashCommandBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'

export const command: UnifiedCommand = {
    name: 'unban',
    level: 80,
    description: 'Revierte el baneo de un usuario a partir de su ID.',
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Revierte el baneo de un usuario a partir de su ID.')
        .setDMPermission(false)
        .addStringOption(opt => opt.setName('id').setDescription('ID del usuario a desbanear').setRequired(true)),

    async execute(ctx) {
        const userId = ctx.isSlash ? ctx.getString('id', 0, true)! : ctx.args[0]

        if (!userId || !/^\d{17,20}$/.test(userId)) {
            return ctx.reply({ content: '❌ Debes indicar una ID de usuario válida. Ejemplo: `!sw unban 123456789012345678`', ephemeral: true })
        }

        const banned = await ctx.guild.bans.fetch(userId).catch(() => null)
        if (!banned) {
            return ctx.reply({ content: '❌ Ese usuario no está baneado en este servidor.', ephemeral: true })
        }

        await ctx.guild.members.unban(userId).catch(() => null)

        await ctx.reply({ content: `✅ <@${userId}> ha sido desbaneado/a.` })
    },
}
