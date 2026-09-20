"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
const context_1 = require("../../lib/context");
const permissions_1 = require("../../lib/permissions");
exports.event = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        if (!interaction.isChatInputCommand())
            return;
        const command = client.commands.get(interaction.commandName);
        if (!command)
            return;
        if (client.config.adminOnly && !interaction.member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            return void interaction.reply({ content: '❌ Este bot solo puede ser usado por Administradores.', ephemeral: true });
        }
        if (command.developer && !client.config.developers.includes(interaction.user.id)) {
            return void interaction.reply({ content: '❌ Este comando solo está disponible para desarrolladores.', ephemeral: true });
        }
        if (typeof command.level === 'number' && !(0, permissions_1.hasLevel)(interaction.member, command.level)) {
            return void interaction.reply({ content: '❌ No tienes el nivel de autorización necesario para usar este comando.', ephemeral: true });
        }
        const ctx = new context_1.UnifiedContext(client, { interaction });
        try {
            await command.execute(ctx);
        }
        catch (error) {
            console.error(`[SLASH] Error ejecutando ${interaction.commandName}:`, error);
            const payload = { content: '❌ Hubo un error al ejecutar el comando.', ephemeral: true };
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload).catch(() => { });
            }
            else {
                await interaction.reply(payload).catch(() => { });
            }
        }
    },
};
