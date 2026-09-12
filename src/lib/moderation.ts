import * as fs from "fs"
import * as path from "path"

export type InfractionType = 'warn' | 'ban' | 'tempban' | 'mute' | 'tempmute' | 'kick'

export interface Infraction {
    id: number
    guildId: string
    userId: string
    moderatorId: string
    type: InfractionType
    reason: string
    createdAt: number
    expiresAt?: number
    active: boolean
}

interface PersistedData {
    nextId: number
    infractions: Infraction[]
}

const DATA_PATH = path.join(process.cwd(), "moderation-data.json")

function loadData(): PersistedData {
    if (!fs.existsSync(DATA_PATH)) return { nextId: 1, infractions: [] }
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"))
    } catch {
        return { nextId: 1, infractions: [] }
    }
}

function saveData(data: PersistedData): void {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

export function addInfraction(data: Omit<Infraction, 'id' | 'createdAt' | 'active'>): Infraction {
    const store = loadData()
    const infraction: Infraction = {
        ...data,
        id: store.nextId,
        createdAt: Date.now(),
        active: true,
    }
    store.infractions.push(infraction)
    store.nextId++
    saveData(store)
    return infraction
}

export function getInfraction(id: number): Infraction | null {
    return loadData().infractions.find(i => i.id === id) ?? null
}

export function getUserInfractions(guildId: string, userId: string): Infraction[] {
    return loadData().infractions.filter(i => i.guildId === guildId && i.userId === userId)
}

export function deleteInfraction(id: number): boolean {
    const store = loadData()
    const idx = store.infractions.findIndex(i => i.id === id)
    if (idx === -1) return false
    store.infractions.splice(idx, 1)
    saveData(store)
    return true
}

export function deactivateInfraction(id: number): void {
    const store = loadData()
    const infraction = store.infractions.find(i => i.id === id)
    if (infraction) {
        infraction.active = false
        saveData(store)
    }
}
