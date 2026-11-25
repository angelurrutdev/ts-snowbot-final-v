"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthLevel = getAuthLevel;
exports.hasLevel = hasLevel;
const discord_js_1 = require("discord.js");
const consts_1 = require("../consts");
/**
 * Calcula el nivel de autorización de un miembro: el máximo entre su propio
 * ID, los IDs de todos sus roles (según CONFIG.authorizations), y 0 por
 * defecto (equivalente a @everyone). Los Administradores de Discord
 * siempre obtienen nivel 100 como respaldo de seguridad, para que nunca te
 * quedes fuera del bot por un error de configuración.
 */
function getAuthLevel(member) {
    if (member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
        return 100;
    const levels = [
        consts_1.CONFIG.authorizations[member.id] ?? -1,
        ...member.roles.cache.map(role => consts_1.CONFIG.authorizations[role.id] ?? -1),
        0,
    ];
    return Math.max(...levels);
}
function hasLevel(member, required) {
    if (!member)
        return false;
    return getAuthLevel(member) >= required;
}
