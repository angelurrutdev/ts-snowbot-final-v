"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCommands = handleCommands;
const files_1 = require("../lib/files");
/**
 * Carga los comandos desde src/commands (nivel plano) y los registra para
 * que funcionen TANTO por slash ("/comando") como por prefijo
 * ("!sw comando"), siempre exclusivamente en el guild configurado en
 * GUILD_ID (registro por guild = instantáneo, nunca se registra en global).
 */
async function handleCommands(client) {
    client.commands.clear();
    client.prefixCommands.clear();
    const slashPayloads = [];
    const files = await (0, files_1.loadFiles)('commands', false);
    files.forEach(file => {
        let command;
        try {
            ;
            ({ command } = require(file));
            if (!command || !command.name || typeof command.execute !== 'function') {
                console.log(`[COMANDO] Archivo ignorado (no exporta un comando válido): ${file}`);
                return;
            }
            client.commands.set(command.name, command);
            client.prefixCommands.set(command.name, command);
            command.aliases?.forEach(alias => client.prefixCommands.set(alias, command));
            if (command.data)
                slashPayloads.push(command.data.toJSON());
            console.log(`[COMANDO] ${command.name} cargado (slash: ${command.data ? 'sí' : 'no'}, prefijo: !sw ${command.name})`);
        }
        catch (error) {
            console.log(`[COMANDO] Error cargando ${file}:`, error);
        }
    });
    const guildId = process.env.GUILD_ID;
    if (!guildId)
        throw new Error('[COMANDOS] GUILD_ID no definido en .env');
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(slashPayloads);
    console.log(`[COMANDOS] Registrados ${slashPayloads.length} slash commands en guild ${guild.name}`);
}
