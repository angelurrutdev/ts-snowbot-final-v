"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startYoutubeWatcher = startYoutubeWatcher;
const youtube_1 = require("./youtube");
const youtubeNotify_1 = require("./youtubeNotify");
const youtubeCache_1 = require("./youtubeCache");
const DEFAULT_INTERVAL_MINUTES = 5;
// Cuántos uploads recientes revisa cada vez. Con más de 1 (a diferencia de
// la versión anterior, que solo miraba el más reciente) no se salta nada si
// subes varias cosas entre dos revisiones.
const SCAN_LIMIT = 10;
// Cuántos IDs recuerda como "ya avisados" (recorta el historial para que el
// archivo no crezca para siempre).
const MAX_HISTORY = 30;
/**
 * Revisa cada cierto tiempo si el canal de YouTube configurado subió
 * contenido nuevo y, si es así, lo avisa solo en YOUTUBE_NOTIFY_CHANNEL_ID.
 *
 * Al primer arranque, si todavía no existe youtube-cache.json, lo crea con
 * los uploads actuales del canal SIN avisarlos — así nunca hay que "sembrar"
 * nada a mano: el bot no avisa retroactivamente todo el historial la
 * primera vez que se prende, y de ahí en adelante detecta lo nuevo solo.
 *
 * El historial de IDs ya avisados se guarda EN MEMORIA además de en
 * youtube-cache.json: así, si el guardado en disco fallara por algún
 * motivo (permisos del hosting, por ejemplo), el bot igual nunca vuelve a
 * repetir el mismo aviso mientras el proceso siga corriendo — antes, si
 * fallaba el guardado, el mismo video se repostaba en cada revisión.
 */
function startYoutubeWatcher(client) {
    const channelId = process.env.YOUTUBE_NOTIFY_CHANNEL_ID;
    if (!channelId) {
        console.log('[YOUTUBE] YOUTUBE_NOTIFY_CHANNEL_ID no definido en .env: el aviso automático queda apagado (solo /test-video-latest sigue funcionando)');
        return;
    }
    const intervalMinutes = Number(process.env.YOUTUBE_POLL_MINUTES) || DEFAULT_INTERVAL_MINUTES;
    const existingCache = (0, youtubeCache_1.readCache)();
    const announced = new Set(existingCache?.announcedIds ?? []);
    let seeded = existingCache !== null;
    const persist = (context) => {
        try {
            (0, youtubeCache_1.writeCache)({ announcedIds: [...announced].slice(-MAX_HISTORY) });
        }
        catch (writeError) {
            console.error(`[YOUTUBE] ⚠️ No se pudo guardar youtube-cache.json en disco (${context}). ` +
                `Revisa permisos de escritura en el hosting. Mientras este proceso siga ` +
                `corriendo no se va a repetir el aviso, pero si el bot se reinicia SÍ podría volver a avisarlo. Error:`, writeError);
        }
    };
    const check = async () => {
        try {
            const videos = await (0, youtube_1.getRecentVideos)(SCAN_LIMIT); // más nuevo primero
            if (!seeded) {
                videos.forEach(v => announced.add(v.videoId));
                seeded = true;
                persist('cache inicial');
                console.log(`[YOUTUBE] Cache inicial creada con ${videos.length} upload(s) existentes; no se avisa retroactivamente`);
                return;
            }
            const nuevos = videos.filter(v => !announced.has(v.videoId)).reverse(); // más viejo primero
            if (nuevos.length === 0)
                return;
            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) {
                console.log('[YOUTUBE] YOUTUBE_NOTIFY_CHANNEL_ID no apunta a un canal de texto válido');
                return;
            }
            for (const video of nuevos) {
                await channel.send((0, youtubeNotify_1.buildVideoNotificationPayload)(video));
                console.log(`[YOUTUBE] Aviso enviado (${video.type}): ${video.title}`);
                // Se marca como avisado (en memoria y en disco) justo después
                // de cada envío individual, no al final del lote — así, si el
                // proceso se cae a la mitad, nunca se reenvía lo que ya se
                // avisó en esta misma tanda.
                announced.add(video.videoId);
                persist(`tras avisar "${video.title}"`);
            }
        }
        catch (error) {
            console.error('[YOUTUBE] Error revisando videos nuevos:', error);
        }
    };
    check();
    setInterval(check, intervalMinutes * 60_000);
    console.log(`[YOUTUBE] Vigilando el canal cada ${intervalMinutes} minuto(s)`);
}
