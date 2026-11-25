"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    name: 'ping',
    level: 20,
    description: 'Comprueba que el bot está vivo y muestra la latencia.',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Comprueba que el bot está vivo y muestra la latencia.'),
    async execute(ctx) {
        const latency = Date.now() - ctx.createdTimestamp;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`Latencia: \`${latency}ms\`\nAPI: \`${Math.round(ctx.client.ws.ping)}ms\``)
            .setColor('Blue');
        await ctx.reply({ embeds: [embed] });
    },
};
