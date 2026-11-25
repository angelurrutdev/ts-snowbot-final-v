"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCache = readCache;
exports.writeCache = writeCache;
const fs = require("fs");
const path = require("path");
const CACHE_PATH = path.join(process.cwd(), 'youtube-cache.json');
function readCache() {
    try {
        const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.announcedIds)) {
            return { announcedIds: parsed.announcedIds };
        }
        // Migración automática desde el formato viejo ({ lastVideoId }).
        if (typeof parsed.lastVideoId === 'string' && parsed.lastVideoId) {
            return { announcedIds: [parsed.lastVideoId] };
        }
        return null;
    }
    catch {
        return null;
    }
}
function writeCache(cache) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}
