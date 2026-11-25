"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const events_1 = require("./handlers/events");
const consts_1 = require("./consts");
if (!process.env.DISCORD_TOKEN)
    throw new Error('[CLIENT] DISCORD_TOKEN no definido en .env');
if (!process.env.GUILD_ID)
    throw new Error('[CLIENT] GUILD_ID no definido en .env');
const client = new discord_js_1.Client({
    intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers', 'GuildInvites']
});
client.config = consts_1.CONFIG;
client.events = new discord_js_1.Collection();
client.commands = new discord_js_1.Collection();
client.prefixCommands = new discord_js_1.Collection();
(0, events_1.handleEvents)(client);
client.login(process.env.DISCORD_TOKEN);
