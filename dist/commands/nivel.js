"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const consts_1 = require("../consts");
const permissions_1 = require("../lib/permissions");
exports.command = {
    name: 'nivel',
    aliases: ['level'],
    level: 20,
    description: 'Muestra tu nivel de autorización calculado y qué rol te lo está dando.',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('nivel')
        .setDescription('Muestra tu nivel de autorización calculado y qué rol te lo está dando.'),
    async execute(ctx) {
        const member = ctx.member;
        if (!member) {
            return ctx.reply({ content: '❌ Este comando solo se puede usar dentro del servidor.', ephemeral: true });
        }
        const isAdmin = member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
        const nivel = (0, permissions_1.getAuthLevel)(member);
        // Reconstruye qué está aportando cada fuente (usuario y cada rol) para
        // poder ver de un vistazo si el mapeo de roles coincide con la realidad.
        const fuentes = [];
        const nivelPorId = consts_1.CONFIG.authorizations[member.id];
        if (typeof nivelPorId === 'number') {
            fuentes.push(`• Tu ID de usuario (\`${member.id}\`) → nivel ${nivelPorId}`);
        }
        for (const role of member.roles.cache.values()) {
            const nivelRol = consts_1.CONFIG.authorizations[role.id];
            if (typeof nivelRol === 'number') {
                fuentes.push(`• Rol **${role.name}** (\`${role.id}\`) → nivel ${nivelRol}`);
            }
        }
        const rolesSinMapear = member.roles.cache
            .filter(r => r.id !== ctx.guild.id && typeof consts_1.CONFIG.authorizations[r.id] !== 'number')
            .map(r => `${r.name} (\`${r.id}\`)`);
        const lineas = [
            `**Nivel calculado:** ${nivel}`,
            `**Administrador de Discord:** ${isAdmin ? 'Sí (nivel 100 automático)' : 'No'}`,
            `**adminOnly (bot):** ${consts_1.CONFIG.adminOnly ? 'activado ⚠️ (solo Administradores pueden usar comandos)' : 'desactivado (se usan los niveles)'}`,
            '',
            fuentes.length ? '**Roles/ID que te dan nivel:**' : '**No tienes ningún rol ni ID configurado en `authorizations`.**',
            ...fuentes,
        ];
        if (rolesSinMapear.length) {
            lineas.push('', '**Roles tuyos que NO están en `authorizations`:**', `• ${rolesSinMapear.join(', ')}`);
        }
        await ctx.reply({ content: lineas.join('\n'), ephemeral: true });
    },
};
