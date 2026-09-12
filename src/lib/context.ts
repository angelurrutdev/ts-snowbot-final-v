import { ChatInputCommandInteraction, Message, GuildMember, User, Role } from "discord.js"
import type { GlobClient } from "../types/index"

interface ContextSource {
    interaction?: ChatInputCommandInteraction
    message?: Message
    args?: string[]
}

/**
 * Abstrae un slash command (ChatInputCommandInteraction) y un comando de
 * prefijo (Message) detrás de una sola interfaz, para que cada comando se
 * escriba UNA vez y funcione con `/comando` y `!sw comando` por igual.
 *
 * Nota para comandos con varias opciones: en modo prefijo los argumentos se
 * leen por posición (ctx.args[0], ctx.args[1]...) o por mención (usuario,
 * rol, canal). Revisa el orden de las opciones definidas en `data` para que
 * coincida con el orden esperado en `ctx.args`.
 */
export class UnifiedContext {
    client: GlobClient
    interaction?: ChatInputCommandInteraction
    message?: Message
    args: string[]
    private sentMessage?: Message

    constructor(client: GlobClient, source: ContextSource) {
        this.client = client
        this.interaction = source.interaction
        this.message = source.message
        this.args = source.args ?? []
    }

    get isSlash(): boolean {
        return !!this.interaction
    }

    get guild() {
        return (this.interaction?.guild ?? this.message?.guild)!
    }

    get channel() {
        return (this.interaction?.channel ?? this.message?.channel)!
    }

    get user(): User {
        return (this.interaction?.user ?? this.message!.author)!
    }

    get member(): GuildMember | null {
        return (this.interaction?.member ?? this.message?.member) as GuildMember | null
    }

    /** Timestamp en el que se disparó el comando, sea slash o de prefijo. */
    get createdTimestamp(): number {
        return (this.interaction?.createdTimestamp ?? this.message!.createdTimestamp)!
    }

    async reply(payload: any) {
        if (this.interaction) {
            if (this.interaction.deferred || this.interaction.replied) {
                return this.interaction.editReply(payload)
            }
            return this.interaction.reply(payload)
        }
        this.sentMessage = await this.message!.reply(payload)
        return this.sentMessage
    }

    async editReply(payload: any) {
        if (this.interaction) return this.interaction.editReply(payload)
        if (this.sentMessage) return this.sentMessage.edit(payload)
        return this.reply(payload)
    }

    async deferReply(opts?: { ephemeral?: boolean }) {
        if (this.interaction) return this.interaction.deferReply(opts as any)
        this.sentMessage = await this.message!.reply('⏳ Procesando...')
        return this.sentMessage
    }

    // --- Helpers de opciones (slash: por nombre / prefijo: por posición o mención) ---

    getString(name: string, index: number, required = false): string | null {
        if (this.interaction) return this.interaction.options.getString(name, required as any)
        const value = this.args[index] ?? null
        if (required && !value) throw new Error(`Falta el argumento requerido: ${name}`)
        return value
    }

    getUser(name: string, index: number, required = false): User | null {
        if (this.interaction) return this.interaction.options.getUser(name, required as any)
        const value = this.message!.mentions.users.first() ?? null
        if (required && !value) throw new Error(`Falta mencionar un usuario para: ${name}`)
        return value
    }

    getMember(name: string, index: number, required = false): GuildMember | null {
        if (this.interaction) return this.interaction.options.getMember(name) as GuildMember | null
        const value = this.message!.mentions.members?.first() ?? null
        if (required && !value) throw new Error(`Falta mencionar un miembro para: ${name}`)
        return value
    }

    getRole(name: string, index: number, required = false): Role | null {
        if (this.interaction) return this.interaction.options.getRole(name, required as any) as Role | null
        const value = this.message!.mentions.roles.first() ?? null
        if (required && !value) throw new Error(`Falta mencionar un rol para: ${name}`)
        return value
    }

    getBoolean(name: string, index: number, required = false): boolean | null {
        if (this.interaction) return this.interaction.options.getBoolean(name, required as any)
        const raw = this.args[index]?.toLowerCase()
        if (raw === undefined) {
            if (required) throw new Error(`Falta el argumento requerido: ${name}`)
            return null
        }
        return ['si', 'sí', 'true', 'yes', '1'].includes(raw)
    }

    getSubcommand(required = true): string {
        if (this.interaction) return this.interaction.options.getSubcommand(required as any)
        const sub = this.args[0]
        if (!sub && required) throw new Error('Falta especificar el subcomando')
        return sub ?? ''
    }
}
