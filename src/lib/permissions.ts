import type { GuildMember } from "discord.js"
import { PermissionFlagsBits } from "discord.js"
import { CONFIG } from "../consts"

/**
 * Calcula el nivel de autorización de un miembro: el máximo entre su propio
 * ID, los IDs de todos sus roles (según CONFIG.authorizations), y 0 por
 * defecto (equivalente a @everyone). Los Administradores de Discord
 * siempre obtienen nivel 100 como respaldo de seguridad, para que nunca te
 * quedes fuera del bot por un error de configuración.
 */
export function getAuthLevel(member: GuildMember): number {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return 100

    const levels = [
        CONFIG.authorizations[member.id] ?? -1,
        ...member.roles.cache.map(role => CONFIG.authorizations[role.id] ?? -1),
        0,
    ]

    return Math.max(...levels)
}

export function hasLevel(member: GuildMember | null | undefined, required: number): boolean {
    if (!member) return false
    return getAuthLevel(member) >= required
}
