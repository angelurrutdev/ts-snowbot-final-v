import { loadFiles } from "../lib/files"
import type { Event, GlobClient } from "../types/index"

export async function handleEvents(client: GlobClient): Promise<void> {
    client.events.clear()
    const files = await loadFiles('events')
    files.forEach(file => {
        let event: Event<any> | undefined
        try {
            ;({ event } = require(file) as { event: Event<any> })
            if (!event || !event.name || typeof event.execute !== 'function') {
                console.log(`[EVENT] Archivo ignorado (no exporta un evento válido): ${file}`)
                return
            }

            const execute = (...args: any[]) => event!.execute(client, ...args)
            client.events.set(event.name, execute)
            if (event.rest) {
                if (event.once) client.rest.once(event.name, execute)
                else client.rest.on(event.name, execute)
            } else {
                if (event.once) client.once(event.name, execute)
                else client.on(event.name, execute)
            }
            console.log(`[EVENT] ${event.name} cargado correctamente`)
        } catch (error) {
            console.log(`[EVENT] Error cargando ${file}:`, error)
        }
    })
}
