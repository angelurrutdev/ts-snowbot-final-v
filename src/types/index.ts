import type { ClientEvents, Client, Collection, SharedSlashCommand } from "discord.js"
import type { UnifiedContext } from "../lib/context"
import { CONFIG } from "../consts"

export type GlobClient = Client<true> & ExtraClient

interface ExtraClient {
    config: typeof CONFIG
    events: Collection<keyof ClientEvents, () => void>
    commands: Collection<string, UnifiedCommand>
    prefixCommands: Collection<string, UnifiedCommand>
}

export interface Event<T extends keyof ClientEvents> {
    name: T
    rest?: boolean
    once?: boolean
    execute: (client: GlobClient, ...args: ClientEvents[T]) => void
}

/**
 * Un comando "unificado": se define UNA vez y funciona como slash command
 * (`/nombre`, si se define `data`) y como comando de prefijo
 * (`!sw nombre`, siempre). La lógica vive en `execute`, que recibe un
 * `UnifiedContext` que abstrae si vino de una interacción o de un mensaje.
 */
export interface UnifiedCommand {
    [x: string]: any
    name: string
    aliases?: string[]
    description?: string
    developer?: boolean
    /** Nivel de autorización mínimo requerido (ver lib/permissions.ts). Sin definir = abierto a todos. */
    level?: number
    data?: SharedSlashCommand
    execute: (ctx: UnifiedContext) => any
}
