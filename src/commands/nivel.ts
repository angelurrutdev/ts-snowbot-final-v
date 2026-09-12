import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { CONFIG } from '../consts'
import { getAuthLevel } from '../lib/permissions'

export const command: UnifiedCommand = {
    name: 'nivel',
    aliases: ['level'],
    level: 20,
    description: 'Muestra tu nivel de autorización calculado y qué rol te lo está dando.',
    data: new SlashCommandBuilder()
        .setName('nivel')
        .setDescription('Muestra tu nivel de autorización calculado y qué rol te lo está dando.'),

    async execute(ctx) {
        const member = ctx.member
        if (!member) {
            return ctx.reply({ content: '❌ Este comando solo se puede usar dentro del servidor.', ephemeral: true })
        }

        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator)
        const nivel = getAuthLevel(member)

        // Reconstruye qué está aportando cada fuente (usuario y cada rol) para
        // poder ver de un vistazo si el mapeo de roles coincide con la realidad.
        const fuentes: string[] = []

        const nivelPorId = CONFIG.authorizations[member.id]
        if (typeof nivelPorId === 'number') {
            fuentes.push(`• Tu ID de usuario (\`${member.id}\`) → nivel ${nivelPorId}`)
        }

        for (const role of member.roles.cache.values()) {
            const nivelRol = CONFIG.authorizations[role.id]
            if (typeof nivelRol === 'number') {
                fuentes.push(`• Rol **${role.name}** (\`${role.id}\`) → nivel ${nivelRol}`)
            }
        }

        const rolesSinMapear = member.roles.cache
            .filter(r => r.id !== ctx.guild.id && typeof CONFIG.authorizations[r.id] !== 'number')
            .map(r => `${r.name} (\`${r.id}\`)`)

        const lineas = [
            `**Nivel calculado:** ${nivel}`,
            `**Administrador de Discord:** ${isAdmin ? 'Sí (nivel 100 automático)' : 'No'}`,
            `**adminOnly (bot):** ${CONFIG.adminOnly ? 'activado ⚠️ (solo Administradores pueden usar comandos)' : 'desactivado (se usan los niveles)'}`,
            '',
            fuentes.length ? '**Roles/ID que te dan nivel:**' : '**No tienes ningún rol ni ID configurado en `authorizations`.**',
            ...fuentes,
        ]

        if (rolesSinMapear.length) {
            lineas.push('', '**Roles tuyos que NO están en `authorizations`:**', `• ${rolesSinMapear.join(', ')}`)
        }

        await ctx.reply({ content: lineas.join('\n'), ephemeral: true })
    },
}
