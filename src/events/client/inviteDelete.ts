import type { Event } from '../../types/index'
import { onInviteDelete } from '../../lib/inviteTracker'

export const event: Event<'inviteDelete'> = {
    name: 'inviteDelete',

    execute(_client, invite) {
        onInviteDelete(invite)
    },
}
