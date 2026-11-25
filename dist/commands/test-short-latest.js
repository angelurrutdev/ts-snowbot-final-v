"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const youtube_1 = require("../lib/youtube");
const youtubeNotify_1 = require("../lib/youtubeNotify");
exports.command = {
    name: 'test-short-latest',
    description: 'Muestra el aviso tal cual se vería con el último Short subido al canal configurado.',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('test-short-latest')
        .setDescription('Muestra el aviso tal cual se vería con el último Short subido al canal configurado.'),
    async execute(ctx) {
        await ctx.deferReply({ ephemeral: true });
        try {
            const video = await (0, youtube_1.getLatestByType)('short');
            await ctx.channel.send((0, youtubeNotify_1.buildVideoNotificationPayload)(video));
            await ctx.editReply('✅ Aviso de prueba enviado en el canal.');
        }
        catch (error) {
            console.error('[YOUTUBE] Error en /test-short-latest:', error);
            await ctx.editReply(`❌ No se pudo obtener el último Short.\n\`${error.message}\``);
        }
    },
};
