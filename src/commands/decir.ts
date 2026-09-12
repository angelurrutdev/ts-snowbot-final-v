import { SlashCommandBuilder, PermissionFlagsBits, TextChannel } from 'discord.js'
import type { UnifiedCommand } from '../types/index'

export const command: UnifiedCommand = {
    name: 'decir',
    description: 'Hace que el bot repita cualquier mensaje que escribas.',
    data: new SlashCommandBuilder()
        .setName('decir')
        .setDescription('Hace que el bot repita cualquier mensaje que escribas.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt => opt
            .setName('mensaje')
            .setDescription('El mensaje que el bot va a decir')
            .setRequired(true)
        ),

    async execute(ctx) {
        // Solo administradores: Discord filtra esto solo en el slash command,
        // así que también lo comprobamos a mano para que aplique en !sw decir.
        if (!ctx.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            return ctx.reply({ content: '❌ Solo los administradores pueden usar este comando.', ephemeral: true })
        }

        const mensaje = ctx.isSlash
            ? ctx.getString('mensaje', 0, true)
            : ctx.args.join(' ')

        if (!mensaje?.trim()) {
            return ctx.reply({
                content: '❌ Debes escribir un mensaje. Ejemplo: `!sw decir Hola a todos`',
                ephemeral: true,
            })
        }

        const channel = ctx.channel as TextChannel

        if (ctx.isSlash) {
            await channel.send({ content: mensaje })
            // Discord exige responder la interacción sí o sí, pero la borramos
            // al instante para que no quede ninguna confirmación visible.
            await ctx.interaction!.deferReply({ ephemeral: true })
            await ctx.interaction!.deleteReply()
        } else {
            // En modo prefijo borramos el mensaje original ("!sw decir ...")
            // para que solo se vea el texto dicho por el bot.
            await ctx.message!.delete().catch(() => {})
            await channel.send({ content: mensaje })
        }
    },
}
