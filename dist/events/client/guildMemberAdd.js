"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const inviteTracker_1 = require("../../lib/inviteTracker");
exports.event = {
    name: 'guildMemberAdd',
    async execute(_client, member) {
        await (0, inviteTracker_1.recordMemberJoin)(member).catch(() => { });
    },
};
