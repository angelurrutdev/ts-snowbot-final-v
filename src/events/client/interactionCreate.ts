import { PermissionFlagsBits, type GuildMember } from 'discord.js'
import { UnifiedContext } from '../../lib/context'
import { hasLevel } from '../../lib/permissions'
import { Event } from '../../types/index'

export const event: Event<'interactionCreate'> = {
    name: 'interactionCreate',

    async execute(client, interaction) {
        if (!interaction.isChatInputCommand()) return

        const command = client.commands.get(interaction.commandName)
        if (!command) return

        if (client.config.adminOnly && !(interaction.member as GuildMember | null)?.permissions.has(PermissionFlagsBits.Administrator)) {
            return void interaction.reply({ content: '❌ Este bot solo puede ser usado por Administradores.', ephemeral: true })
        }

        if (command.developer && !client.config.developers.includes(interaction.user.id)) {
            return void interaction.reply({ content: '❌ Este comando solo está disponible para desarrolladores.', ephemeral: true })
        }

        if (typeof command.level === 'number' && !hasLevel(interaction.member as GuildMember | null, command.level)) {
            return void interaction.reply({ content: '❌ No tienes el nivel de autorización necesario para usar este comando.', ephemeral: true })
        }

        const ctx = new UnifiedContext(client, { interaction })

        try {
            await command.execute(ctx)
        } catch (error) {
            console.error(`[SLASH] Error ejecutando ${interaction.commandName}:`, error)
            const payload = { content: '❌ Hubo un error al ejecutar el comando.', ephemeral: true }
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload).catch(() => {})
            } else {
                await interaction.reply(payload).catch(() => {})
            }
        }
    },
}
