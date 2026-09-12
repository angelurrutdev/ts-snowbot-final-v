import { PermissionFlagsBits } from 'discord.js'
import { UnifiedContext } from '../../lib/context'
import { hasLevel } from '../../lib/permissions'
import { Event } from '../../types/index'

export const event: Event<'messageCreate'> = {
    name: 'messageCreate',

    async execute(client, message) {
        if (message.author.bot) return
        if (!message.guild) return

        const prefix = client.config.prefix
        if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return

        const args = message.content.slice(prefix.length).trim().split(/\s+/).filter(Boolean)
        const commandName = args.shift()?.toLowerCase()
        if (!commandName) return

        const command = client.prefixCommands.get(commandName)
        if (!command) return

        if (client.config.adminOnly && !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            return void message.reply('❌ Este bot solo puede ser usado por Administradores.')
        }

        if (command.developer && !client.config.developers.includes(message.author.id)) {
            return void message.reply('❌ Este comando solo está disponible para desarrolladores.')
        }

        if (typeof command.level === 'number' && !hasLevel(message.member, command.level)) {
            return void message.reply('❌ No tienes el nivel de autorización necesario para usar este comando.')
        }

        const ctx = new UnifiedContext(client, { message, args })

        try {
            await command.execute(ctx)
        } catch (error) {
            console.error(`[PREFIJO] Error ejecutando ${commandName}:`, error)
            message.reply('❌ Hubo un error al ejecutar el comando.').catch(() => {})
        }
    },
}
