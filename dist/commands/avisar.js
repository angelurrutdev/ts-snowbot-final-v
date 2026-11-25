"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const moderation_1 = require("../lib/moderation");
const permissions_1 = require("../lib/permissions");
exports.command = {
    name: 'avisar',
    aliases: ['warn'],
    level: 20,
    description: 'Registra un aviso/advertencia a un usuario.',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('avisar')
        .setDescription('Registra un aviso/advertencia a un usuario.')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a avisar').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón del aviso').setRequired(true)),
    async execute(ctx) {
        const target = ctx.getUser('usuario', 0);
        if (!target) {
            return ctx.reply({ content: '❌ Debes indicar un usuario. Ejemplo: `!sw avisar @usuario spam repetido`', ephemeral: true });
        }
        const reason = ctx.isSlash
            ? ctx.getString('razon', 1)
            : (ctx.args.slice(1).join(' ') || null);
        if (!reason) {
            return ctx.reply({ content: '❌ Debes indicar una razón. Ejemplo: `!sw avisar @usuario spam repetido`', ephemeral: true });
        }
        const targetMember = await ctx.guild.members.fetch(target.id).catch(() => null);
        if (targetMember && (0, permissions_1.getAuthLevel)(targetMember) >= (0, permissions_1.getAuthLevel)(ctx.member)) {
            return ctx.reply({ content: '❌ No puedes actuar sobre alguien con un nivel de autorización igual o mayor al tuyo.', ephemeral: true });
        }
        (0, moderation_1.addInfraction)({
            guildId: ctx.guild.id,
            userId: target.id,
            moderatorId: ctx.user.id,
            type: 'warn',
            reason,
        });
        await target.send(`⚠️ Has recibido un aviso en **${ctx.guild.name}**.\nRazón: ${reason}`).catch(() => { });
        await ctx.reply({ content: `✅ <@${target.id}> ha sido avisado/a.` });
    },
};
