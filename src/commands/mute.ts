import { SlashCommandBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { addInfraction } from '../lib/moderation'
import { getAuthLevel } from '../lib/permissions'
import { CONFIG } from '../consts'

export const command: UnifiedCommand = {
    name: 'mute',
    level: 70,
    description: 'Silencia a un usuario (no puede hablar hasta que se le desmutee).',
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silencia a un usuario (no puede hablar hasta que se le desmutee).')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a mutear').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón del muteo').setRequired(false)),

    async execute(ctx) {
        if (!CONFIG.muteRoleId) {
            return ctx.reply({ content: '❌ No hay un rol de mute configurado (CONFIG.muteRoleId).', ephemeral: true })
        }

        const target = ctx.getUser('usuario', 0)
        if (!target) {
            return ctx.reply({ content: '❌ Debes indicar un usuario. Ejemplo: `!sw mute @usuario razón`', ephemeral: true })
        }

        const reason = ctx.isSlash
            ? (ctx.getString('razon', 1) ?? 'Sin razón especificada')
            : (ctx.args.slice(1).join(' ') || 'Sin razón especificada')

        const targetMember = await ctx.guild.members.fetch(target.id).catch(() => null)
        if (!targetMember) {
            return ctx.reply({ content: '❌ No encontré a ese usuario en el servidor.', ephemeral: true })
        }

        if (getAuthLevel(targetMember) >= getAuthLevel(ctx.member!)) {
            return ctx.reply({ content: '❌ No puedes actuar sobre alguien con un nivel de autorización igual o mayor al tuyo.', ephemeral: true })
        }

        if (targetMember.roles.cache.has(CONFIG.muteRoleId)) {
            return ctx.reply({ content: '❌ Ese usuario ya está muteado.', ephemeral: true })
        }

        await targetMember.roles.add(CONFIG.muteRoleId, reason).catch(() => null)

        addInfraction({
            guildId: ctx.guild.id,
            userId: target.id,
            moderatorId: ctx.user.id,
            type: 'mute',
            reason,
        })

        await ctx.reply({ content: `✅ <@${target.id}> ha sido muteado/a permanentemente.` })
    },
}
