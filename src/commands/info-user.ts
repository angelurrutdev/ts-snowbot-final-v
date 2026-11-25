import {
    AuditLogEvent,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type GuildMember,
    type User,
} from 'discord.js'
import type { UnifiedCommand } from '../types/index'
import { getMemberInviteRecord } from '../lib/inviteTracker'
import { getUserInfractions } from '../lib/moderation'
import { getAuthLevel } from '../lib/permissions'
import { formatDiscordTimestamp, getTwitchAuditInfo, truncateList } from '../lib/userInfo'

const FLAG_LABELS: Record<string, string> = {
    Staff: 'Discord Staff',
    Partner: 'Partner',
    Hypesquad: 'HypeSquad Events',
    BugHunterLevel1: 'Bug Hunter I',
    BugHunterLevel2: 'Bug Hunter II',
    HypeSquadOnlineHouse1: 'Bravery',
    HypeSquadOnlineHouse2: 'Brilliance',
    HypeSquadOnlineHouse3: 'Balance',
    PremiumEarlySupporter: 'Early Supporter',
    VerifiedDeveloper: 'Verified Bot Dev',
    ActiveDeveloper: 'Active Developer',
    VerifiedBot: 'Bot Verificado',
    CertifiedModerator: 'Moderator Alumni',
}

const KEY_PERMS: Array<[bigint, string]> = [
    [PermissionFlagsBits.Administrator, 'Administrador'],
    [PermissionFlagsBits.ManageGuild, 'Gestionar servidor'],
    [PermissionFlagsBits.BanMembers, 'Banear miembros'],
    [PermissionFlagsBits.KickMembers, 'Expulsar miembros'],
    [PermissionFlagsBits.ModerateMembers, 'Aislar miembros'],
    [PermissionFlagsBits.ManageMessages, 'Gestionar mensajes'],
    [PermissionFlagsBits.ManageRoles, 'Gestionar roles'],
    [PermissionFlagsBits.ManageChannels, 'Gestionar canales'],
    [PermissionFlagsBits.ManageNicknames, 'Gestionar apodos'],
    [PermissionFlagsBits.MentionEveryone, 'Mencionar @everyone'],
]

async function resolveTargetUser(ctx: Parameters<UnifiedCommand['execute']>[0]): Promise<{ user: User | null; error?: string }> {
    const mentionedUser = ctx.getUser('usuario', 0)
    if (mentionedUser) {
        const full = await ctx.client.users.fetch(mentionedUser.id, { force: true }).catch(() => mentionedUser)
        return { user: full }
    }

    const rawInput = ctx.isSlash
        ? ctx.getString('id', 0)
        : (ctx.args[0] ?? null)

    if (rawInput) {
        const cleanId = rawInput.replace(/[<@!>]/g, '').trim()
        if (!/^\d{17,20}$/.test(cleanId)) {
            return { user: null, error: '❌ ID de usuario inválida. Usa una ID numérica de 17 a 20 dígitos o menciona al usuario.' }
        }
        const fetched = await ctx.client.users.fetch(cleanId, { force: true }).catch(() => null)
        if (!fetched) {
            return { user: null, error: `❌ No se encontró ningún usuario de Discord con la ID \`${cleanId}\`.` }
        }
        return { user: fetched }
    }

    const self = await ctx.client.users.fetch(ctx.user.id, { force: true }).catch(() => ctx.user)
    return { user: self }
}

async function resolveInviterLine(member: GuildMember | null, user: User, guild: GuildMember['guild']): Promise<string> {
    if (user.bot) {
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 25 }).catch(() => null)
        const entry = logs?.entries.find(e => e.targetId === user.id)
        if (entry?.executor) {
            return `Añadido por: <@${entry.executor.id}> (\`${entry.executor.tag}\`)\nFecha: ${formatDiscordTimestamp(entry.createdTimestamp)}`
        }
        return 'Bot añadido sin registro visible en Audit Log.'
    }

    const record = getMemberInviteRecord(guild.id, user.id)
    if (record) {
        const who = record.inviterId
            ? `<@${record.inviterId}> (\`${record.inviterTag ?? record.inviterId}\`)`
            : 'Desconocido'
        return [
            `**Invitado por:** ${who}`,
            `**Código:** \`${record.code ?? 'desconocido'}\``,
            `**Registrado:** ${formatDiscordTimestamp(record.joinedAt)}`,
        ].join('\n')
    }

    if (!member) return 'No está en el servidor (sin registro de invitación).'
    return 'Sin registro (solo se guarda quién invitó a ingresos nuevos desde la activación del tracker; Discord no expone invitadores históricos).'
}

function buildTwitchField(userId: string, member: GuildMember | null): string {
    const audit = getTwitchAuditInfo(userId)
    const subRoleId = process.env.TWITCH_SUB_ROLE_ID
    const hasSubRole = !!(subRoleId && member?.roles.cache.has(subRoleId))

    if (!audit) {
        return [
            '**Twitch vinculado:** Sin vínculo en `twitch-audit.db` *(Discord no expone conexiones de perfil a bots)*',
            `**Rol Sub Twitch (Discord):** ${subRoleId ? (hasSubRole ? 'Sí' : 'No') : 'No configurado'}`,
        ].join('\n')
    }

    const twitchLink = audit.twitchCurrentName
        ? `[\`${audit.twitchCurrentName}\`](https://www.twitch.tv/${encodeURIComponent(audit.twitchCurrentName)})`
        : 'No vinculado'

    const lines = [
        `**Canal:** ${twitchLink}`,
        `**Twitch ID:** \`${audit.twitchUserId ?? 'N/A'}\``,
        `**Suscriptor (DB):** ${audit.isSubscriber ? 'Sí' : 'No'} | **Rol Sub Discord:** ${subRoleId ? (hasSubRole ? 'Sí' : 'No') : 'N/A'}`,
    ]

    if (audit.nameHistory.length) {
        lines.push(`**Nombres previos:** ${audit.nameHistory.map(n => `\`${n}\``).join(', ')}`)
    }
    if (audit.lastNickname) {
        lines.push(`**Último apodo auditado:** \`${audit.lastNickname}\``)
    }
    const updatedMs = Date.parse(audit.lastUpdatedAt)
    if (!Number.isNaN(updatedMs)) {
        lines.push(`**Última actualización:** ${formatDiscordTimestamp(updatedMs)}`)
    }
    return lines.join('\n')
}

export const command: UnifiedCommand = {
    name: 'info-user',
    aliases: ['userinfo', 'whois'],
    level: 20,
    description: 'Muestra toda la información detallada de un usuario (Twitch, roles, foto, invitación, moderación, etc.).',
    data: new SlashCommandBuilder()
        .setName('info-user')
        .setDescription('Muestra toda la información detallada de un usuario.')
        .setDMPermission(false)
        .addUserOption(opt => opt
            .setName('usuario')
            .setDescription('Usuario del servidor a consultar')
            .setRequired(false))
        .addStringOption(opt => opt
            .setName('id')
            .setDescription('ID numérica de Discord (útil para usuarios fuera del servidor)')
            .setRequired(false)),

    async execute(ctx) {
        if (!ctx.guild) {
            return ctx.reply({ content: '❌ Este comando solo funciona dentro del servidor.', ephemeral: true })
        }

        await ctx.deferReply()

        const resolved = await resolveTargetUser(ctx)
        if (!resolved.user) {
            return ctx.editReply({ content: resolved.error ?? '❌ No se pudo resolver el usuario.' })
        }
        const user = resolved.user
        const member = await ctx.guild.members.fetch({ user: user.id, force: true }).catch(() => null)
        const banInfo = !member ? await ctx.guild.bans.fetch(user.id).catch(() => null) : null

        const globalAvatar = user.displayAvatarURL({ size: 1024 })
        const serverAvatar = member?.avatar ? member.displayAvatarURL({ size: 1024 }) : null
        const bannerUrl = user.bannerURL({ size: 1024 })
        const decorationUrl = user.avatarDecorationURL({ size: 1024 })

        const flags = user.flags?.toArray().map(f => FLAG_LABELS[f] ?? f) ?? []
        const identityLines = [
            `**Mención:** <@${user.id}>`,
            `**ID:** \`${user.id}\``,
            `**Usuario:** \`${user.username}\``,
            `**Nombre global:** \`${user.globalName ?? 'Ninguno'}\``,
            `**Apodo servidor:** \`${member?.nickname ?? 'Ninguno'}\``,
            `**Tipo:** ${user.bot ? 'Bot' : user.system ? 'Sistema' : 'Usuario'}`,
            `**Color acento:** \`${user.hexAccentColor ?? 'Ninguno'}\``,
            `**Insignias:** ${flags.length ? flags.join(', ') : 'Ninguna'}`,
        ]

        const photoLinks = [`[Avatar global](${globalAvatar})`]
        if (serverAvatar && serverAvatar !== globalAvatar) photoLinks.push(`[Avatar servidor](${serverAvatar})`)
        if (decorationUrl) photoLinks.push(`[Decoración](${decorationUrl})`)
        if (bannerUrl) photoLinks.push(`[Banner](${bannerUrl})`)

        const dateLines = [
            `**Cuenta creada:** ${formatDiscordTimestamp(user.createdTimestamp)}`,
            `**Unido al servidor:** ${member?.joinedTimestamp ? formatDiscordTimestamp(member.joinedTimestamp) : 'No está en el servidor'}`,
            `**Boost:** ${member?.premiumSinceTimestamp ? formatDiscordTimestamp(member.premiumSinceTimestamp) : 'No'}`,
        ]

        const inviterText = await resolveInviterLine(member, user, ctx.guild)
        const twitchText = buildTwitchField(user.id, member)

        const infractions = getUserInfractions(ctx.guild.id, user.id)
        const activeInf = infractions.filter(i => i.active).length
        const modLines: string[] = []
        if (banInfo) {
            modLines.push(`**Estado:** 🔨 Baneado (\`${banInfo.reason ?? 'Sin razón'}\`)`)
        } else if (!member) {
            modLines.push('**Estado:** Fuera del servidor (no baneado)')
        }
        modLines.push(`**Infracciones:** ${infractions.length} total (${activeInf} activas)`)
        if (infractions.length) {
            const latest = infractions[infractions.length - 1]
            modLines.push(`**Última:** \`${latest.type}\` por <@${latest.moderatorId}> — ${latest.reason} (${formatDiscordTimestamp(latest.createdAt)})`)
        }

        const embed = new EmbedBuilder()
            .setColor(member?.displayColor || user.accentColor || 0x5865F2)
            .setAuthor({ name: `${user.tag} — Información detallada`, iconURL: serverAvatar ?? globalAvatar })
            .setThumbnail(serverAvatar ?? globalAvatar)
            .addFields(
                { name: '🪪 Identidad', value: identityLines.join('\n'), inline: false },
                { name: '🖼️ Fotos y enlaces', value: photoLinks.join(' • '), inline: false },
                { name: '📅 Fechas', value: dateLines.join('\n'), inline: false },
                { name: '🎟️ Invitación', value: inviterText, inline: false },
                { name: '🟣 Twitch vinculado', value: twitchText, inline: false },
            )

        if (member) {
            const roles = member.roles.cache
                .filter(r => r.id !== ctx.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.toString())

            const perms = KEY_PERMS
                .filter(([bit]) => member.permissions.has(bit))
                .map(([, label]) => label)

            const securityLines = [
                `**Nivel SnowBot:** \`${getAuthLevel(member)}\``,
                `**Propietario:** ${ctx.guild.ownerId === member.id ? 'Sí' : 'No'} | **Admin:** ${member.permissions.has(PermissionFlagsBits.Administrator) ? 'Sí' : 'No'}`,
                `**Rol más alto:** ${member.roles.highest} (\`${member.displayHexColor}\`)`,
                `**Aislado (Timeout):** ${member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now() ? formatDiscordTimestamp(member.communicationDisabledUntilTimestamp) : 'No'}`,
                `**Verificación pendiente:** ${member.pending ? 'Sí' : 'No'}`,
                `**Canal de voz:** ${member.voice.channel ? `${member.voice.channel}` : 'Desconectado'}`,
                `**Permisos clave:** ${perms.length ? perms.join(', ') : 'Estándar'}`,
            ]

            embed.addFields(
                { name: '🛡️ Servidor y Seguridad', value: securityLines.join('\n'), inline: false },
                { name: `🎭 Roles (${roles.length})`, value: truncateList(roles, 1020, 'Sin roles'), inline: false },
            )
        }

        embed.addFields({ name: '⚖️ Moderación', value: modLines.join('\n'), inline: false })

        if (bannerUrl) {
            embed.setImage(bannerUrl)
        }

        embed
            .setFooter({ text: `Consultado por ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
            .setTimestamp()

        await ctx.editReply({ embeds: [embed] })
    },
}
