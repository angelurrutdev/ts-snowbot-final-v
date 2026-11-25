"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const inviteTracker_1 = require("../lib/inviteTracker");
const moderation_1 = require("../lib/moderation");
const permissions_1 = require("../lib/permissions");
const userInfo_1 = require("../lib/userInfo");
const FLAG_LABELS = {
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
};
const KEY_PERMS = [
    [discord_js_1.PermissionFlagsBits.Administrator, 'Administrador'],
    [discord_js_1.PermissionFlagsBits.ManageGuild, 'Gestionar servidor'],
    [discord_js_1.PermissionFlagsBits.BanMembers, 'Banear miembros'],
    [discord_js_1.PermissionFlagsBits.KickMembers, 'Expulsar miembros'],
    [discord_js_1.PermissionFlagsBits.ModerateMembers, 'Aislar miembros'],
    [discord_js_1.PermissionFlagsBits.ManageMessages, 'Gestionar mensajes'],
    [discord_js_1.PermissionFlagsBits.ManageRoles, 'Gestionar roles'],
    [discord_js_1.PermissionFlagsBits.ManageChannels, 'Gestionar canales'],
    [discord_js_1.PermissionFlagsBits.ManageNicknames, 'Gestionar apodos'],
    [discord_js_1.PermissionFlagsBits.MentionEveryone, 'Mencionar @everyone'],
];
async function resolveTargetUser(ctx) {
    let user = ctx.getUser('usuario', 0);
    if (!user && !ctx.isSlash && ctx.args[0]) {
        const raw = ctx.args[0].replace(/[<@!>]/g, '');
        if (/^\d{17,20}$/.test(raw)) {
            user = await ctx.client.users.fetch(raw, { force: true }).catch(() => null);
        }
    }
    const base = user ?? ctx.user;
    return ctx.client.users.fetch(base.id, { force: true }).catch(() => base);
}
async function resolveInviterLine(member, user, guild) {
    if (user.bot) {
        const logs = await guild.fetchAuditLogs({ type: discord_js_1.AuditLogEvent.BotAdd, limit: 25 }).catch(() => null);
        const entry = logs?.entries.find(e => e.targetId === user.id);
        if (entry?.executor) {
            return `Añadido por: <@${entry.executor.id}> (\`${entry.executor.tag}\`)\nFecha: ${(0, userInfo_1.formatDiscordTimestamp)(entry.createdTimestamp)}`;
        }
        return 'Bot añadido sin registro visible en Audit Log.';
    }
    const record = (0, inviteTracker_1.getMemberInviteRecord)(guild.id, user.id);
    if (record) {
        const who = record.inviterId
            ? `<@${record.inviterId}> (\`${record.inviterTag ?? record.inviterId}\`)`
            : 'Desconocido';
        return [
            `**Invitado por:** ${who}`,
            `**Código:** \`${record.code ?? 'desconocido'}\``,
            `**Registrado:** ${(0, userInfo_1.formatDiscordTimestamp)(record.joinedAt)}`,
        ].join('\n');
    }
    if (!member)
        return 'No está en el servidor (sin registro de invitación).';
    return 'Sin registro (solo se guarda quién invitó a ingresos nuevos desde la activación del tracker; Discord no expone invitadores históricos).';
}
function buildTwitchField(userId, member) {
    const audit = (0, userInfo_1.getTwitchAuditInfo)(userId);
    const subRoleId = process.env.TWITCH_SUB_ROLE_ID;
    const hasSubRole = !!(subRoleId && member?.roles.cache.has(subRoleId));
    if (!audit) {
        return [
            '**Twitch vinculado:** Sin vínculo en `twitch-audit.db` *(Discord no expone conexiones de perfil a bots)*',
            `**Rol Sub Twitch (Discord):** ${subRoleId ? (hasSubRole ? 'Sí' : 'No') : 'No configurado'}`,
        ].join('\n');
    }
    const twitchLink = audit.twitchCurrentName
        ? `[\`${audit.twitchCurrentName}\`](https://www.twitch.tv/${encodeURIComponent(audit.twitchCurrentName)})`
        : 'No vinculado';
    const lines = [
        `**Canal:** ${twitchLink}`,
        `**Twitch ID:** \`${audit.twitchUserId ?? 'N/A'}\``,
        `**Suscriptor (DB):** ${audit.isSubscriber ? 'Sí' : 'No'} | **Rol Sub Discord:** ${subRoleId ? (hasSubRole ? 'Sí' : 'No') : 'N/A'}`,
    ];
    if (audit.nameHistory.length) {
        lines.push(`**Nombres previos:** ${audit.nameHistory.map(n => `\`${n}\``).join(', ')}`);
    }
    if (audit.lastNickname) {
        lines.push(`**Último apodo auditado:** \`${audit.lastNickname}\``);
    }
    const updatedMs = Date.parse(audit.lastUpdatedAt);
    if (!Number.isNaN(updatedMs)) {
        lines.push(`**Última actualización:** ${(0, userInfo_1.formatDiscordTimestamp)(updatedMs)}`);
    }
    return lines.join('\n');
}
exports.command = {
    name: 'info-user',
    aliases: ['userinfo', 'whois'],
    level: 20,
    description: 'Muestra toda la información detallada de un usuario (Twitch, roles, foto, invitación, moderación, etc.).',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('info-user')
        .setDescription('Muestra toda la información detallada de un usuario.')
        .setDMPermission(false)
        .addUserOption(opt => opt
        .setName('usuario')
        .setDescription('Usuario a consultar (por defecto tú)')
        .setRequired(false)),
    async execute(ctx) {
        if (!ctx.guild) {
            return ctx.reply({ content: '❌ Este comando solo funciona dentro del servidor.', ephemeral: true });
        }
        await ctx.deferReply();
        const user = await resolveTargetUser(ctx);
        const member = await ctx.guild.members.fetch({ user: user.id, force: true }).catch(() => null);
        const banInfo = !member ? await ctx.guild.bans.fetch(user.id).catch(() => null) : null;
        const globalAvatar = user.displayAvatarURL({ size: 1024 });
        const serverAvatar = member?.avatar ? member.displayAvatarURL({ size: 1024 }) : null;
        const bannerUrl = user.bannerURL({ size: 1024 });
        const decorationUrl = user.avatarDecorationURL({ size: 1024 });
        const flags = user.flags?.toArray().map(f => FLAG_LABELS[f] ?? f) ?? [];
        const identityLines = [
            `**Mención:** <@${user.id}>`,
            `**ID:** \`${user.id}\``,
            `**Usuario:** \`${user.username}\``,
            `**Nombre global:** \`${user.globalName ?? 'Ninguno'}\``,
            `**Apodo servidor:** \`${member?.nickname ?? 'Ninguno'}\``,
            `**Tipo:** ${user.bot ? 'Bot' : user.system ? 'Sistema' : 'Usuario'}`,
            `**Color acento:** \`${user.hexAccentColor ?? 'Ninguno'}\``,
            `**Insignias:** ${flags.length ? flags.join(', ') : 'Ninguna'}`,
        ];
        const photoLinks = [`[Avatar global](${globalAvatar})`];
        if (serverAvatar && serverAvatar !== globalAvatar)
            photoLinks.push(`[Avatar servidor](${serverAvatar})`);
        if (decorationUrl)
            photoLinks.push(`[Decoración](${decorationUrl})`);
        if (bannerUrl)
            photoLinks.push(`[Banner](${bannerUrl})`);
        const dateLines = [
            `**Cuenta creada:** ${(0, userInfo_1.formatDiscordTimestamp)(user.createdTimestamp)}`,
            `**Unido al servidor:** ${member?.joinedTimestamp ? (0, userInfo_1.formatDiscordTimestamp)(member.joinedTimestamp) : 'No está en el servidor'}`,
            `**Boost:** ${member?.premiumSinceTimestamp ? (0, userInfo_1.formatDiscordTimestamp)(member.premiumSinceTimestamp) : 'No'}`,
        ];
        const inviterText = await resolveInviterLine(member, user, ctx.guild);
        const twitchText = buildTwitchField(user.id, member);
        const infractions = (0, moderation_1.getUserInfractions)(ctx.guild.id, user.id);
        const activeInf = infractions.filter(i => i.active).length;
        const modLines = [];
        if (banInfo) {
            modLines.push(`**Estado:** 🔨 Baneado (\`${banInfo.reason ?? 'Sin razón'}\`)`);
        }
        else if (!member) {
            modLines.push('**Estado:** Fuera del servidor (no baneado)');
        }
        modLines.push(`**Infracciones:** ${infractions.length} total (${activeInf} activas)`);
        if (infractions.length) {
            const latest = infractions[infractions.length - 1];
            modLines.push(`**Última:** \`${latest.type}\` por <@${latest.moderatorId}> — ${latest.reason} (${(0, userInfo_1.formatDiscordTimestamp)(latest.createdAt)})`);
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(member?.displayColor || user.accentColor || 0x5865F2)
            .setAuthor({ name: `${user.tag} — Información detallada`, iconURL: serverAvatar ?? globalAvatar })
            .setThumbnail(serverAvatar ?? globalAvatar)
            .addFields({ name: '🪪 Identidad', value: identityLines.join('\n'), inline: false }, { name: '🖼️ Fotos y enlaces', value: photoLinks.join(' • '), inline: false }, { name: '📅 Fechas', value: dateLines.join('\n'), inline: false }, { name: '🎟️ Invitación', value: inviterText, inline: false }, { name: '🟣 Twitch vinculado', value: twitchText, inline: false });
        if (member) {
            const roles = member.roles.cache
                .filter(r => r.id !== ctx.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.toString());
            const perms = KEY_PERMS
                .filter(([bit]) => member.permissions.has(bit))
                .map(([, label]) => label);
            const securityLines = [
                `**Nivel SnowBot:** \`${(0, permissions_1.getAuthLevel)(member)}\``,
                `**Propietario:** ${ctx.guild.ownerId === member.id ? 'Sí' : 'No'} | **Admin:** ${member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ? 'Sí' : 'No'}`,
                `**Rol más alto:** ${member.roles.highest} (\`${member.displayHexColor}\`)`,
                `**Aislado (Timeout):** ${member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now() ? (0, userInfo_1.formatDiscordTimestamp)(member.communicationDisabledUntilTimestamp) : 'No'}`,
                `**Verificación pendiente:** ${member.pending ? 'Sí' : 'No'}`,
                `**Canal de voz:** ${member.voice.channel ? `${member.voice.channel}` : 'Desconectado'}`,
                `**Permisos clave:** ${perms.length ? perms.join(', ') : 'Estándar'}`,
            ];
            embed.addFields({ name: '🛡️ Servidor y Seguridad', value: securityLines.join('\n'), inline: false }, { name: `🎭 Roles (${roles.length})`, value: (0, userInfo_1.truncateList)(roles, 1020, 'Sin roles'), inline: false });
        }
        embed.addFields({ name: '⚖️ Moderación', value: modLines.join('\n'), inline: false });
        if (bannerUrl) {
            embed.setImage(bannerUrl);
        }
        embed
            .setFooter({ text: `Consultado por ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
            .setTimestamp();
        await ctx.editReply({ embeds: [embed] });
    },
};
