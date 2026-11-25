"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTwitchAuditInfo = getTwitchAuditInfo;
exports.formatDiscordTimestamp = formatDiscordTimestamp;
exports.truncateList = truncateList;
const fs = require("fs");
const path = require("path");
const node_sqlite_1 = require("node:sqlite");
function getTwitchAuditInfo(userId) {
    const dbPath = process.env.AUDIT_DB_PATH || path.join(process.cwd(), 'data', 'twitch-audit.db');
    if (!fs.existsSync(dbPath))
        return null;
    let db = null;
    try {
        db = new node_sqlite_1.DatabaseSync(dbPath, { readOnly: true });
        const row = db.prepare(`
            SELECT twitch_user_id, twitch_current_name, twitch_previous_names,
                   is_subscriber, last_nickname, last_updated_at
            FROM audited_users
            WHERE discord_id = ?
        `).get(userId);
        if (!row)
            return null;
        let previousNames = [];
        try {
            const parsed = JSON.parse(row.twitch_previous_names || '[]');
            if (Array.isArray(parsed))
                previousNames = parsed.map(String);
        }
        catch {
            previousNames = [];
        }
        const historyRows = db.prepare(`
            SELECT previous_name
            FROM twitch_name_history
            WHERE discord_id = ?
            ORDER BY recorded_at DESC
        `).all(userId);
        const nameHistory = Array.from(new Set([
            ...previousNames,
            ...historyRows.map(h => h.previous_name),
        ]));
        return {
            twitchUserId: row.twitch_user_id,
            twitchCurrentName: row.twitch_current_name,
            twitchPreviousNames: previousNames,
            isSubscriber: row.is_subscriber === 1,
            lastNickname: row.last_nickname,
            lastUpdatedAt: row.last_updated_at,
            nameHistory,
        };
    }
    catch {
        return null;
    }
    finally {
        try {
            db?.close();
        }
        catch { }
    }
}
function formatDiscordTimestamp(ms) {
    const sec = Math.floor(ms / 1000);
    return `<t:${sec}:F> (<t:${sec}:R>)`;
}
function truncateList(items, maxLen, emptyText) {
    if (!items.length)
        return emptyText;
    const lines = [];
    let len = 0;
    for (let i = 0; i < items.length; i++) {
        const piece = items[i];
        const sep = lines.length ? ', ' : '';
        const remaining = items.length - i;
        const suffix = ` (+${remaining} más)`;
        if (len + sep.length + piece.length + suffix.length > maxLen) {
            return lines.join(', ') + suffix;
        }
        lines.push(piece);
        len += sep.length + piece.length;
    }
    return lines.join(', ');
}
