"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    name: 'clear',
    level: 50,
    description: 'Borra una cantidad de mensajes recientes del canal.',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('clear')
        .setDescription('Borra una cantidad de mensajes recientes del canal.')
        .setDMPermission(false)
        .addIntegerOption(opt => opt
        .setName('cantidad')
        .setDescription('Cuántos mensajes borrar (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)),
    async execute(ctx) {
        const cantidad = ctx.isSlash
            ? ctx.interaction.options.getInteger('cantidad', true)
            : parseInt(ctx.args[0], 10);
        if (!cantidad || isNaN(cantidad) || cantidad < 1 || cantidad > 100) {
            return ctx.reply({ content: '❌ Debes indicar una cantidad entre 1 y 100. Ejemplo: `!sw clear 20`', ephemeral: true });
        }
        const channel = ctx.channel;
        if (ctx.isSlash) {
            await ctx.deferReply({ ephemeral: true });
            const deleted = await channel.bulkDelete(cantidad, true).catch(() => null);
            if (!deleted) {
                return ctx.editReply({ content: '❌ No se pudieron borrar los mensajes (puede que sean de hace más de 14 días).' });
            }
            return ctx.editReply({ content: `🧹 Se borraron ${deleted.size} mensajes.` });
        }
        await ctx.message.delete().catch(() => { });
        const deleted = await channel.bulkDelete(cantidad, true).catch(() => null);
        if (!deleted)
            return;
        const confirmation = await channel.send({ content: `🧹 Se borraron ${deleted.size} mensajes.` });
        setTimeout(() => confirmation.delete().catch(() => { }), 4000);
    },
};
