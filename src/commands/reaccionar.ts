import { SlashCommandBuilder, TextChannel } from 'discord.js'
import type { UnifiedCommand } from '../types/index'

// Acepta tanto emojis normales (😀) como emojis personalizados del servidor
// en formato <:nombre:id> o <a:nombre:id> (animados).
function resolveEmoji(input: string): string {
    const custom = input.match(/^<a?:\w+:(\d+)>$/)
    return custom ? custom[1] : input
}

export const command: UnifiedCommand = {
    name: 'reaccionar',
    aliases: ['react'],
    level: 40,
    description: 'Reacciona a un mensaje del canal actual con el emoji indicado.',
    data: new SlashCommandBuilder()
        .setName('reaccionar')
        .setDescription('Reacciona a un mensaje del canal actual con el emoji indicado.')
        .setDMPermission(false)
        .addStringOption(opt => opt.setName('mensaje').setDescription('ID del mensaje').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji a usar (normal o personalizado)').setRequired(true)),

    async execute(ctx) {
        const messageId = ctx.isSlash
            ? ctx.getString('mensaje', 0, true)!
            : ctx.args[0]

        const emojiInput = ctx.isSlash
            ? ctx.getString('emoji', 1, true)!
            : ctx.args[1]

        if (!messageId || !emojiInput) {
            return ctx.reply({ content: '❌ Uso: `!sw reaccionar <id_mensaje> <emoji>`', ephemeral: true })
        }

        if (!/^\d{17,20}$/.test(messageId)) {
            return ctx.reply({ content: '❌ Ese ID de mensaje no parece válido.', ephemeral: true })
        }

        const channel = ctx.channel as TextChannel
        const targetMessage = await channel.messages.fetch(messageId).catch(() => null)

        if (!targetMessage) {
            return ctx.reply({ content: '❌ No encontré ningún mensaje con ese ID en este canal.', ephemeral: true })
        }

        const result = await targetMessage.react(resolveEmoji(emojiInput)).catch(() => null)

        if (!result) {
            return ctx.reply({ content: '❌ No pude reaccionar con ese emoji (puede que no sea válido o que el bot no tenga acceso a él).', ephemeral: true })
        }

        await ctx.reply({ content: `✅ Reacción añadida al mensaje \`${messageId}\`.`, ephemeral: true })
    },
}
