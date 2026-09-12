import { RESTPostAPIApplicationCommandsJSONBody } from "discord.js"
import type { GlobClient, UnifiedCommand } from "../types/index"
import { loadFiles } from "../lib/files"

/**
 * Carga los comandos desde src/commands (nivel plano) y los registra para
 * que funcionen TANTO por slash ("/comando") como por prefijo
 * ("!sw comando"), siempre exclusivamente en el guild configurado en
 * GUILD_ID (registro por guild = instantáneo, nunca se registra en global).
 */
export async function handleCommands(client: GlobClient): Promise<void> {
    client.commands.clear()
    client.prefixCommands.clear()

    const slashPayloads: RESTPostAPIApplicationCommandsJSONBody[] = []
    const files = await loadFiles('commands', false)

    files.forEach(file => {
        let command: UnifiedCommand | undefined
        try {
            ;({ command } = require(file) as { command: UnifiedCommand })
            if (!command || !command.name || typeof command.execute !== 'function') {
                console.log(`[COMANDO] Archivo ignorado (no exporta un comando válido): ${file}`)
                return
            }

            client.commands.set(command.name, command)
            client.prefixCommands.set(command.name, command)
            command.aliases?.forEach(alias => client.prefixCommands.set(alias, command!))

            if (command.data) slashPayloads.push(command.data.toJSON())

            console.log(`[COMANDO] ${command.name} cargado (slash: ${command.data ? 'sí' : 'no'}, prefijo: !sw ${command.name})`)
        } catch (error) {
            console.log(`[COMANDO] Error cargando ${file}:`, error)
        }
    })

    const guildId = process.env.GUILD_ID
    if (!guildId) throw new Error('[COMANDOS] GUILD_ID no definido en .env')

    const guild = await client.guilds.fetch(guildId)
    await guild.commands.set(slashPayloads)
    console.log(`[COMANDOS] Registrados ${slashPayloads.length} slash commands en guild ${guild.name}`)
}
