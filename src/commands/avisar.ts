import { SlashCommandBuilder } from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { addInfraction } from '../lib/moderation'
import { getAuthLevel } from '../lib/permissions'

export const command: UnifiedCommand = {
    name: 'avisar',
    aliases: ['warn'],
    level: 20,
    description: 'Registra un aviso/advertencia a un usuario.',
    data: new SlashCommandBuilder()
        .setName('avisar')
        .setDescription('Registra un aviso/advertencia a un usuario.')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a avisar').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón del aviso').setRequired(true)),

    async execute(ctx) {
        const target = ctx.getUser('usuario', 0)
        if (!target) {
            return ctx.reply({ content: '❌ Debes indicar un usuario. Ejemplo: `!sw avisar @usuario spam repetido`', ephemeral: true })
        }

        const reason = ctx.isSlash
            ? ctx.getString('razon', 1)
            : (ctx.args.slice(1).join(' ') || null)

        if (!reason) {
            return ctx.reply({ content: '❌ Debes indicar una razón. Ejemplo: `!sw avisar @usuario spam repetido`', ephemeral: true })
        }

        const targetMember = await ctx.guild.members.fetch(target.id).catch(() => null)
        if (targetMember && getAuthLevel(targetMember) >= getAuthLevel(ctx.member!)) {
            return ctx.reply({ content: '❌ No puedes actuar sobre alguien con un nivel de autorización igual o mayor al tuyo.', ephemeral: true })
        }

        addInfraction({
            guildId: ctx.guild.id,
            userId: target.id,
            moderatorId: ctx.user.id,
            type: 'warn',
            reason,
        })

        await target.send(`⚠️ Has recibido un aviso en **${ctx.guild.name}**.\nRazón: ${reason}`).catch(() => {})

        await ctx.reply({ content: `✅ <@${target.id}> ha sido avisado/a.` })
    },
}
