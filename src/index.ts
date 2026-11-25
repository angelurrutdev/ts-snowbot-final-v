import 'dotenv/config'

import { Client, Collection } from 'discord.js'
import { GlobClient } from './types/index'
import { handleEvents } from './handlers/events'
import { CONFIG } from './consts'

if (!process.env.DISCORD_TOKEN) throw new Error('[CLIENT] DISCORD_TOKEN no definido en .env')
if (!process.env.GUILD_ID) throw new Error('[CLIENT] GUILD_ID no definido en .env')

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers', 'GuildInvites']
}) as GlobClient

client.config = CONFIG
client.events = new Collection()
client.commands = new Collection()
client.prefixCommands = new Collection()
handleEvents(client)

client.login(process.env.DISCORD_TOKEN)
