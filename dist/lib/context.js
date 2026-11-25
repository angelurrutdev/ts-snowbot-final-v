"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedContext = void 0;
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
class UnifiedContext {
    client;
    interaction;
    message;
    args;
    sentMessage;
    constructor(client, source) {
        this.client = client;
        this.interaction = source.interaction;
        this.message = source.message;
        this.args = source.args ?? [];
    }
    get isSlash() {
        return !!this.interaction;
    }
    get guild() {
        return (this.interaction?.guild ?? this.message?.guild);
    }
    get channel() {
        return (this.interaction?.channel ?? this.message?.channel);
    }
    get user() {
        return (this.interaction?.user ?? this.message.author);
    }
    get member() {
        return (this.interaction?.member ?? this.message?.member);
    }
    /** Timestamp en el que se disparó el comando, sea slash o de prefijo. */
    get createdTimestamp() {
        return (this.interaction?.createdTimestamp ?? this.message.createdTimestamp);
    }
    async reply(payload) {
        if (this.interaction) {
            if (this.interaction.deferred || this.interaction.replied) {
                return this.interaction.editReply(payload);
            }
            return this.interaction.reply(payload);
        }
        this.sentMessage = await this.message.reply(payload);
        return this.sentMessage;
    }
    async editReply(payload) {
        if (this.interaction)
            return this.interaction.editReply(payload);
        if (this.sentMessage)
            return this.sentMessage.edit(payload);
        return this.reply(payload);
    }
    async deferReply(opts) {
        if (this.interaction)
            return this.interaction.deferReply(opts);
        this.sentMessage = await this.message.reply('⏳ Procesando...');
        return this.sentMessage;
    }
    // --- Helpers de opciones (slash: por nombre / prefijo: por posición o mención) ---
    getString(name, index, required = false) {
        if (this.interaction)
            return this.interaction.options.getString(name, required);
        const value = this.args[index] ?? null;
        if (required && !value)
            throw new Error(`Falta el argumento requerido: ${name}`);
        return value;
    }
    getUser(name, index, required = false) {
        if (this.interaction)
            return this.interaction.options.getUser(name, required);
        const value = this.message.mentions.users.first() ?? null;
        if (required && !value)
            throw new Error(`Falta mencionar un usuario para: ${name}`);
        return value;
    }
    getMember(name, index, required = false) {
        if (this.interaction)
            return this.interaction.options.getMember(name);
        const value = this.message.mentions.members?.first() ?? null;
        if (required && !value)
            throw new Error(`Falta mencionar un miembro para: ${name}`);
        return value;
    }
    getRole(name, index, required = false) {
        if (this.interaction)
            return this.interaction.options.getRole(name, required);
        const value = this.message.mentions.roles.first() ?? null;
        if (required && !value)
            throw new Error(`Falta mencionar un rol para: ${name}`);
        return value;
    }
    getBoolean(name, index, required = false) {
        if (this.interaction)
            return this.interaction.options.getBoolean(name, required);
        const raw = this.args[index]?.toLowerCase();
        if (raw === undefined) {
            if (required)
                throw new Error(`Falta el argumento requerido: ${name}`);
            return null;
        }
        return ['si', 'sí', 'true', 'yes', '1'].includes(raw);
    }
    getSubcommand(required = true) {
        if (this.interaction)
            return this.interaction.options.getSubcommand(required);
        const sub = this.args[0];
        if (!sub && required)
            throw new Error('Falta especificar el subcomando');
        return sub ?? '';
    }
}
exports.UnifiedContext = UnifiedContext;
