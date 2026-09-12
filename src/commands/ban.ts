import { SlashCommandBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { addInfraction } from '../lib/moderation'
import { getAuthLevel } from '../lib/permissions'

export const command: UnifiedCommand = {
    name: 'ban',
    level: 80,
    description: 'Banea permanentemente a un usuario del servidor.',
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea permanentemente a un usuario del servidor.')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banear').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón del baneo').setRequired(false)),

    async execute(ctx) {
        const target = ctx.getUser('usuario', 0)
        if (!target) {
            return ctx.reply({ content: '❌ Debes indicar un usuario. Ejemplo: `!sw ban @usuario razón`', ephemeral: true })
        }

        const reason = ctx.isSlash
            ? (ctx.getString('razon', 1) ?? 'Sin razón especificada')
            : (ctx.args.slice(1).join(' ') || 'Sin razón especificada')

        const targetMember = await ctx.guild.members.fetch(target.id).catch(() => null)
        if (targetMember && getAuthLevel(targetMember) >= getAuthLevel(ctx.member!)) {
            return ctx.reply({ content: '❌ No puedes actuar sobre alguien con un nivel de autorización igual o mayor al tuyo.', ephemeral: true })
        }

        await target.send(`🔨 Has sido baneado permanentemente de **${ctx.guild.name}**.\nRazón: ${reason}`).catch(() => {})
        await ctx.guild.members.ban(target.id, { reason }).catch(() => null)

        addInfraction({
            guildId: ctx.guild.id,
            userId: target.id,
            moderatorId: ctx.user.id,
            type: 'ban',
            reason,
        })

        await ctx.reply({ content: `✅ <@${target.id}> ha sido baneado/a permanentemente.` })
    },
}
