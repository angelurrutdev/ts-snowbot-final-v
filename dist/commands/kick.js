"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const moderation_1 = require("../lib/moderation");
const permissions_1 = require("../lib/permissions");
exports.command = {
    name: 'kick',
    level: 70,
    description: 'Expulsa a un usuario del servidor (puede volver a entrar).',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa a un usuario del servidor (puede volver a entrar).')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón de la expulsión').setRequired(false)),
    async execute(ctx) {
        const target = ctx.getUser('usuario', 0);
        if (!target) {
            return ctx.reply({ content: '❌ Debes indicar un usuario. Ejemplo: `!sw kick @usuario razón`', ephemeral: true });
        }
        const reason = ctx.isSlash
            ? (ctx.getString('razon', 1) ?? 'Sin razón especificada')
            : (ctx.args.slice(1).join(' ') || 'Sin razón especificada');
        const targetMember = await ctx.guild.members.fetch(target.id).catch(() => null);
        if (!targetMember) {
            return ctx.reply({ content: '❌ No encontré a ese usuario en el servidor.', ephemeral: true });
        }
        if ((0, permissions_1.getAuthLevel)(targetMember) >= (0, permissions_1.getAuthLevel)(ctx.member)) {
            return ctx.reply({ content: '❌ No puedes actuar sobre alguien con un nivel de autorización igual o mayor al tuyo.', ephemeral: true });
        }
        await target.send(`👢 Has sido expulsado de **${ctx.guild.name}**.\nRazón: ${reason}`).catch(() => { });
        await targetMember.kick(reason).catch(() => null);
        (0, moderation_1.addInfraction)({
            guildId: ctx.guild.id,
            userId: target.id,
            moderatorId: ctx.user.id,
            type: 'kick',
            reason,
        });
        await ctx.reply({ content: `✅ <@${target.id}> ha sido expulsado/a.` });
    },
};
