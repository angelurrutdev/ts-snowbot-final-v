"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
// IDs de Discord de desarrolladores autorizados a usar comandos marcados como `developer: true`
exports.CONFIG = {
    developers: [],
    prefix: '!sw',
    // Si es true, TODOS los comandos (sin excepción) solo pueden ser
    // ejecutados por miembros con permiso de Administrador de Discord,
    // ignorando el sistema de niveles de abajo. Cambia a false para volver
    // a usar los niveles por rol normalmente.
    adminOnly: false,
    // Niveles de autorización: ID de ROL o de USUARIO -> nivel (0-100).
    // Se calcula el nivel de cada miembro como el máximo entre su propio ID
    // y los IDs de todos sus roles. Reutiliza la jerarquía que ya tenías
    // configurada en La Cabra para "La Isla de Showam".
    authorizations: {
        '321068956322627587': 100, // Stop21
        '996131035488211045': 100, // ShowAM (El Mister)
        '1479900414223716472': 100, // ROL SHOWAM
        '1478572766696439919': 90, // Administradores
        '1511909979303579758': 80, // Staff Lead
        '1479899898609533101': 70, // Moderadores
        '1511910093006831626': 60, // Moderadores de Twitch
        '1511910094105739345': 50, // Soporte+
        '1511910094798065774': 40, // Soporte
        '1511910228180992011': 30, // Gestión de Torneos
        '1511910280618315976': 25, // Organizador de Eventos
        '1511910317649563649': 20, // Moderador en Pruebas
        '1478564794389893210': 1, // Pequeñines (Usuarios)
    },
    // Rol que se asigna/quita con los comandos mute/unmute.
    muteRoleId: '1512599290453954641',
};
