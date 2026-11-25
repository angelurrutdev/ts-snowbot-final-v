import * as fs from 'fs'
import * as path from 'path'
import { DatabaseSync } from 'node:sqlite'

export interface TwitchAuditInfo {
    twitchUserId: string | null
    twitchCurrentName: string | null
    twitchPreviousNames: string[]
    isSubscriber: boolean
    lastNickname: string | null
    lastUpdatedAt: string
    nameHistory: string[]
}

interface AuditedUserRow {
    twitch_user_id: string | null
    twitch_current_name: string | null
    twitch_previous_names: string
    is_subscriber: number
    last_nickname: string | null
    last_updated_at: string
}

interface NameHistoryRow {
    previous_name: string
}

export function getTwitchAuditInfo(userId: string): TwitchAuditInfo | null {
    const dbPath = process.env.AUDIT_DB_PATH || path.join(process.cwd(), 'data', 'twitch-audit.db')
    if (!fs.existsSync(dbPath)) return null

    let db: DatabaseSync | null = null
    try {
        db = new DatabaseSync(dbPath, { readOnly: true })
        const row = db.prepare(`
            SELECT twitch_user_id, twitch_current_name, twitch_previous_names,
                   is_subscriber, last_nickname, last_updated_at
            FROM audited_users
            WHERE discord_id = ?
        `).get(userId) as AuditedUserRow | undefined

        if (!row) return null

        let previousNames: string[] = []
        try {
            const parsed = JSON.parse(row.twitch_previous_names || '[]')
            if (Array.isArray(parsed)) previousNames = parsed.map(String)
        } catch {
            previousNames = []
        }

        const historyRows = db.prepare(`
            SELECT previous_name
            FROM twitch_name_history
            WHERE discord_id = ?
            ORDER BY recorded_at DESC
        `).all(userId) as unknown as NameHistoryRow[]

        const nameHistory = Array.from(new Set([
            ...previousNames,
            ...historyRows.map(h => h.previous_name),
        ]))

        return {
            twitchUserId: row.twitch_user_id,
            twitchCurrentName: row.twitch_current_name,
            twitchPreviousNames: previousNames,
            isSubscriber: row.is_subscriber === 1,
            lastNickname: row.last_nickname,
            lastUpdatedAt: row.last_updated_at,
            nameHistory,
        }
    } catch {
        return null
    } finally {
        try { db?.close() } catch {}
    }
}

export function formatDiscordTimestamp(ms: number): string {
    const sec = Math.floor(ms / 1000)
    return `<t:${sec}:F> (<t:${sec}:R>)`
}

export function truncateList(items: string[], maxLen: number, emptyText: string): string {
    if (!items.length) return emptyText
    const lines: string[] = []
    let len = 0
    for (let i = 0; i < items.length; i++) {
        const piece = items[i]
        const sep = lines.length ? ', ' : ''
        const remaining = items.length - i
        const suffix = ` (+${remaining} más)`
        if (len + sep.length + piece.length + suffix.length > maxLen) {
            return lines.join(', ') + suffix
        }
        lines.push(piece)
        len += sep.length + piece.length
    }
    return lines.join(', ')
}
