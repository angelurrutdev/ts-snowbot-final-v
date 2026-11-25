"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const inviteTracker_1 = require("../../lib/inviteTracker");
exports.event = {
    name: 'inviteCreate',
    execute(_client, invite) {
        (0, inviteTracker_1.onInviteCreate)(invite);
    },
};
