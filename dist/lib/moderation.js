"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInfraction = addInfraction;
exports.getInfraction = getInfraction;
exports.getUserInfractions = getUserInfractions;
exports.deleteInfraction = deleteInfraction;
exports.deactivateInfraction = deactivateInfraction;
const fs = require("fs");
const path = require("path");
const DATA_PATH = path.join(process.cwd(), "moderation-data.json");
function loadData() {
    if (!fs.existsSync(DATA_PATH))
        return { nextId: 1, infractions: [] };
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    }
    catch {
        return { nextId: 1, infractions: [] };
    }
}
function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}
function addInfraction(data) {
    const store = loadData();
    const infraction = {
        ...data,
        id: store.nextId,
        createdAt: Date.now(),
        active: true,
    };
    store.infractions.push(infraction);
    store.nextId++;
    saveData(store);
    return infraction;
}
function getInfraction(id) {
    return loadData().infractions.find(i => i.id === id) ?? null;
}
function getUserInfractions(guildId, userId) {
    return loadData().infractions.filter(i => i.guildId === guildId && i.userId === userId);
}
function deleteInfraction(id) {
    const store = loadData();
    const idx = store.infractions.findIndex(i => i.id === id);
    if (idx === -1)
        return false;
    store.infractions.splice(idx, 1);
    saveData(store);
    return true;
}
function deactivateInfraction(id) {
    const store = loadData();
    const infraction = store.infractions.find(i => i.id === id);
    if (infraction) {
        infraction.active = false;
        saveData(store);
    }
}
