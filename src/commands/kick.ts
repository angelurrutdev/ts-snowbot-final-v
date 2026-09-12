import { SlashCommandBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { addInfraction } from '../lib/moderation'
import { getAuthLevel } from '../lib/permissions'

export const command: UnifiedCommand = {
    name: 'kick',
    level: 70,
    description: 'Expulsa a un usuario del servidor (puede volver a entrar).',
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa a un usuario del servidor (puede volver a entrar).')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón de la expulsión').setRequired(false)),

    async execute(ctx) {
        const target = ctx.getUser('usuario', 0)
        if (!target) {
            return ctx.reply({ content: '❌ Debes indicar un usuario. Ejemplo: `!sw kick @usuario razón`', ephemeral: true })
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

        await target.send(`👢 Has sido expulsado de **${ctx.guild.name}**.\nRazón: ${reason}`).catch(() => {})
        await targetMember.kick(reason).catch(() => null)

        addInfraction({
            guildId: ctx.guild.id,
            userId: target.id,
            moderatorId: ctx.user.id,
            type: 'kick',
            reason,
        })

        await ctx.reply({ content: `✅ <@${target.id}> ha sido expulsado/a.` })
    },
}
