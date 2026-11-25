"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEvents = handleEvents;
const files_1 = require("../lib/files");
async function handleEvents(client) {
    client.events.clear();
    const files = await (0, files_1.loadFiles)('events');
    files.forEach(file => {
        let event;
        try {
            ;
            ({ event } = require(file));
            if (!event || !event.name || typeof event.execute !== 'function') {
                console.log(`[EVENT] Archivo ignorado (no exporta un evento válido): ${file}`);
                return;
            }
            const execute = (...args) => event.execute(client, ...args);
            client.events.set(event.name, execute);
            if (event.rest) {
                if (event.once)
                    client.rest.once(event.name, execute);
                else
                    client.rest.on(event.name, execute);
            }
            else {
                if (event.once)
                    client.once(event.name, execute);
                else
                    client.on(event.name, execute);
            }
            console.log(`[EVENT] ${event.name} cargado correctamente`);
        }
        catch (error) {
            console.log(`[EVENT] Error cargando ${file}:`, error);
        }
    });
}
