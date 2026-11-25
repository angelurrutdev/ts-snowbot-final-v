import type { Event } from '../../types/index'
import { recordMemberJoin } from '../../lib/inviteTracker'

export const event: Event<'guildMemberAdd'> = {
    name: 'guildMemberAdd',

    async execute(_client, member) {
        await recordMemberJoin(member).catch(() => {})
    },
}
