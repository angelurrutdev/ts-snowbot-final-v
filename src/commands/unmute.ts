import { SlashCommandBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { CONFIG } from '../consts'

export const command: UnifiedCommand = {
    name: 'unmute',
    level: 70,
    description: 'Quita el silencio a un usuario muteado.',
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Quita el silencio a un usuario muteado.')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a desmutear').setRequired(true)),

    async execute(ctx) {
        if (!CONFIG.muteRoleId) {
            return ctx.reply({ content: '❌ No hay un rol de mute configurado (CONFIG.muteRoleId).', ephemeral: true })
        }

        const target = ctx.getUser('usuario', 0)
        if (!target) {
            return ctx.reply({ content: '❌ Debes indicar un usuario. Ejemplo: `!sw unmute @usuario`', ephemeral: true })
        }

        const targetMember = await ctx.guild.members.fetch(target.id).catch(() => null)
        if (!targetMember) {
            return ctx.reply({ content: '❌ No encontré a ese usuario en el servidor.', ephemeral: true })
        }

        if (!targetMember.roles.cache.has(CONFIG.muteRoleId)) {
            return ctx.reply({ content: '❌ Ese usuario no está muteado.', ephemeral: true })
        }

        await targetMember.roles.remove(CONFIG.muteRoleId).catch(() => null)

        await ctx.reply({ content: `✅ <@${target.id}> ha sido desmuteado/a.` })
    },
}
