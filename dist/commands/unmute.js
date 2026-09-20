"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const consts_1 = require("../consts");
exports.command = {
    name: 'unmute',
    level: 70,
    description: 'Quita el silencio a un usuario muteado.',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Quita el silencio a un usuario muteado.')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a desmutear').setRequired(true)),
    async execute(ctx) {
        if (!consts_1.CONFIG.muteRoleId) {
            return ctx.reply({ content: '❌ No hay un rol de mute configurado (CONFIG.muteRoleId).', ephemeral: true });
        }
        const target = ctx.getUser('usuario', 0);
        if (!target) {
            return ctx.reply({ content: '❌ Debes indicar un usuario. Ejemplo: `!sw unmute @usuario`', ephemeral: true });
        }
        const targetMember = await ctx.guild.members.fetch(target.id).catch(() => null);
        if (!targetMember) {
            return ctx.reply({ content: '❌ No encontré a ese usuario en el servidor.', ephemeral: true });
        }
        if (!targetMember.roles.cache.has(consts_1.CONFIG.muteRoleId)) {
            return ctx.reply({ content: '❌ Ese usuario no está muteado.', ephemeral: true });
        }
        await targetMember.roles.remove(consts_1.CONFIG.muteRoleId).catch(() => null);
        await ctx.reply({ content: `✅ <@${target.id}> ha sido desmuteado/a.` });
    },
};
