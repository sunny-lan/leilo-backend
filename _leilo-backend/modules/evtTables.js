//this will block/accept events depending on user
//todo make rules serializable

const consts = require('../../consts');
const serverID = consts.serverID;
const pathMarker = consts.pathMarker;

module.exports = (engine, config) => {

    engine.on(['serverInit', serverID, serverID], () => {
        engine.state.evtRules = config.defaultEvtRules;
        engine.emitNext(['gc', serverID, serverID, pathMarker, 'evtRules'], ['serverExit', serverID, serverID]);
    });

    const handler = (state, next, payload, evt) => {
        if (!state.evtRules) {
            next(state);
            return;
        }

        for (let i = 0; i < state.evtRules.length; i++) {
            const evtRule = state.evtRules[i];
            const res = evtRule.match(evt, payload, state);
            if (res) {
                let action = evtRule.action;
                if (Array.isArray(action))
                    action = res;
                if (action === 'accept') {
                    next(state);
                    return;
                }
                if (action === 'reject')return;
            }
        }
    };

    //this is important, as to make sure evtTables doesn't interfere with serverInit
    process.nextTick(() => {
        engine.onM(['*', '*', '*'], handler);
        engine.onM(['*', '*', '*', pathMarker, '**'], handler);
    });
};