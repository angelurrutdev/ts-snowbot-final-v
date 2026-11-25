import { ActivityType } from 'discord.js'
import { handleCommands } from '../../handlers/commands'
import { cacheGuildInvites } from '../../lib/inviteTracker'
import { startYoutubeWatcher } from '../../lib/youtubeWatcher'
import { Event } from '../../types/index'

export const event: Event<'ready'> = {
    name: 'ready',
    once: true,

    async execute(client) {
        console.log(`[CLIENT] ${client.user.username} se ha iniciado correctamente`)

        client.user.setPresence({
            activities: [{
                name: 'Viendo a ShowAm1',
                type: ActivityType.Streaming,
                url: 'https://www.twitch.tv/showam1',
            }],
            status: 'online',
        })

        // Seguridad extra: este bot solo debe operar en el servidor configurado.
        // Si por error fue invitado a otro servidor, lo abandona automáticamente.
        const guildId = process.env.GUILD_ID
        if (guildId) {
            client.guilds.cache.forEach(guild => {
                if (guild.id !== guildId) {
                    console.log(`[SEGURIDAD] Abandonando servidor no autorizado: ${guild.name} (${guild.id})`)
                    guild.leave().catch(() => {})
                }
            })
        }

        await handleCommands(client)
        for (const guild of client.guilds.cache.values()) {
            await cacheGuildInvites(guild).catch(() => {})
        }
        startYoutubeWatcher(client)
    },
}
