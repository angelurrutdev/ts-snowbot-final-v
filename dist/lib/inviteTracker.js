"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGuildInvites = cacheGuildInvites;
exports.onInviteCreate = onInviteCreate;
exports.onInviteDelete = onInviteDelete;
exports.recordMemberJoin = recordMemberJoin;
exports.getMemberInviteRecord = getMemberInviteRecord;
const fs = require("fs");
const path = require("path");
const DATA_DIR = path.join(process.cwd(), 'data');
const INVITES_PATH = path.join(DATA_DIR, 'invites-history.json');
const inviteCache = new Map();
function loadRecords() {
    if (!fs.existsSync(INVITES_PATH))
        return {};
    try {
        return JSON.parse(fs.readFileSync(INVITES_PATH, 'utf-8'));
    }
    catch {
        return {};
    }
}
function saveRecords(records) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(INVITES_PATH, JSON.stringify(records, null, 2));
}
function toCachedMap(invites) {
    const map = new Map();
    for (const inv of invites) {
        map.set(inv.code, {
            uses: inv.uses ?? 0,
            inviterId: inv.inviter?.id ?? null,
            inviterTag: inv.inviter?.tag ?? null,
        });
    }
    return map;
}
async function cacheGuildInvites(guild) {
    const invites = await guild.invites.fetch().catch(() => null);
    if (!invites)
        return;
    inviteCache.set(guild.id, toCachedMap(invites.values()));
}
function onInviteCreate(invite) {
    const guildId = invite.guild?.id;
    if (!guildId)
        return;
    const map = inviteCache.get(guildId) ?? new Map();
    map.set(invite.code, {
        uses: invite.uses ?? 0,
        inviterId: invite.inviter?.id ?? null,
        inviterTag: invite.inviter?.tag ?? null,
    });
    inviteCache.set(guildId, map);
}
function onInviteDelete(invite) {
    const guildId = invite.guild?.id;
    if (!guildId)
        return;
    inviteCache.get(guildId)?.delete(invite.code);
}
async function recordMemberJoin(member) {
    const prev = inviteCache.get(member.guild.id);
    const fresh = await member.guild.invites.fetch().catch(() => null);
    if (!fresh)
        return;
    const nextMap = toCachedMap(fresh.values());
    inviteCache.set(member.guild.id, nextMap);
    if (!prev)
        return;
    // Busca el código cuyo contador de usos subió respecto al snapshot anterior.
    let matchedCode = null;
    let matchedInvite = null;
    for (const [code, info] of nextMap.entries()) {
        const oldUses = prev.get(code)?.uses ?? 0;
        if (info.uses > oldUses) {
            matchedCode = code;
            matchedInvite = info;
            break;
        }
    }
    if (!matchedCode || !matchedInvite)
        return;
    const records = loadRecords();
    records[`${member.guild.id}:${member.id}`] = {
        inviterId: matchedInvite.inviterId,
        inviterTag: matchedInvite.inviterTag,
        code: matchedCode,
        joinedAt: Date.now(),
    };
    saveRecords(records);
}
function getMemberInviteRecord(guildId, userId) {
    const records = loadRecords();
    return records[`${guildId}:${userId}`] ?? null;
}
