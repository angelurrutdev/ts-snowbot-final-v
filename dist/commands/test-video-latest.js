"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const youtube_1 = require("../lib/youtube");
const youtubeNotify_1 = require("../lib/youtubeNotify");
exports.command = {
    name: 'test-video-latest',
    description: 'Muestra el aviso tal cual se vería si el bot lo mandara solo, con el último video subido.',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('test-video-latest')
        .setDescription('Muestra el aviso tal cual se vería si el bot lo mandara solo, con el último video subido.'),
    async execute(ctx) {
        // Ephemeral (solo lo ves tú) a propósito: el aviso real se manda
        // aparte, como mensaje normal del canal, para que se vea IDÉNTICO
        // a como se vería el aviso automático (sin el "usó /test-video-latest"
        // pegado encima).
        await ctx.deferReply({ ephemeral: true });
        try {
            const video = await (0, youtube_1.getLatestVideo)();
            await ctx.channel.send((0, youtubeNotify_1.buildVideoNotificationPayload)(video));
            await ctx.editReply('✅ Aviso de prueba enviado en el canal.');
        }
        catch (error) {
            console.error('[YOUTUBE] Error en /test-video-latest:', error);
            await ctx.editReply(`❌ No se pudo obtener el último video.\n\`${error.message}\``);
        }
    },
};
