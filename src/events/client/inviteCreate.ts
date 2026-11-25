import type { Event } from '../../types/index'
import { onInviteCreate } from '../../lib/inviteTracker'

export const event: Event<'inviteCreate'> = {
    name: 'inviteCreate',

    execute(_client, invite) {
        onInviteCreate(invite)
    },
}
