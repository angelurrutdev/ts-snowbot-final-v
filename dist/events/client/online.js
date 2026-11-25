"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
const commands_1 = require("../../handlers/commands");
const inviteTracker_1 = require("../../lib/inviteTracker");
const youtubeWatcher_1 = require("../../lib/youtubeWatcher");
exports.event = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`[CLIENT] ${client.user.username} se ha iniciado correctamente`);
        client.user.setPresence({
            activities: [{
                    name: 'Viendo a ShowAm1',
                    type: discord_js_1.ActivityType.Streaming,
                    url: 'https://www.twitch.tv/showam1',
                }],
            status: 'online',
        });
        // Seguridad extra: este bot solo debe operar en el servidor configurado.
        // Si por error fue invitado a otro servidor, lo abandona automáticamente.
        const guildId = process.env.GUILD_ID;
        if (guildId) {
            client.guilds.cache.forEach(guild => {
                if (guild.id !== guildId) {
                    console.log(`[SEGURIDAD] Abandonando servidor no autorizado: ${guild.name} (${guild.id})`);
                    guild.leave().catch(() => { });
                }
            });
        }
        await (0, commands_1.handleCommands)(client);
        for (const guild of client.guilds.cache.values()) {
            await (0, inviteTracker_1.cacheGuildInvites)(guild).catch(() => { });
        }
        (0, youtubeWatcher_1.startYoutubeWatcher)(client);
    },
};
