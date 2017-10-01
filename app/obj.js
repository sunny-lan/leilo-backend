const obj_perms_engine = require('obj-perms-engine');
const config = require('./config');
const serverID = config.serverID;

const ObjPermsEngine = obj_perms_engine.ObjPermsEngine;

const eng = new ObjPermsEngine({
    USER_LEVEL: {
        ROOT: 0,
        USER: 1,
        PRGM: 2,
    },
    WILDCARD: config.permsWildcard,
    permsModule: config.permsModule,
});

module.exports = (on) => {
    on(['serverInit', serverID, serverID], (state, next) => {
        //give server root perms
        eng.u_updateUserLevel(serverID, state, eng.config.USER_LEVEL.ROOT);

        //expose functions that will be required by other modules in state
        state.readPerms = eng.readPerms;
        state.read = eng.read;
        state.readUserLevel = eng.readUserLevel;
        //todo these should be called through events
        state.updateUserLevel = eng.updateUserLevel;
        state.updatePerms = eng.updatePerms;
        state.updatePerm = eng.updatePerm;

        next(state);
    });


    //map server CRUD events to actual object modifications

    on(['updateUserLevel', '*', serverID, config.pathMarker, '**'], (state, next, payload, engine, evt) => {
        eng.updateUserLevel(evt.src, state, payload.user, payload.level);
        next(state);
    });

    on(['create', '*', serverID, config.pathMarker, '**'], (state, next, payload, engine, evt) => {
        eng.create(evt.src, state, evt.path, payload.newObjName, payload.newObjVal);
        next(state);
    });

    on(['update', '*', serverID, config.pathMarker, '**'], (state, next, payload, engine, evt) => {
        eng.update(evt.src, state, evt.path, payload.value);
        next(state);
    });

    on(['delete', '*', serverID, config.pathMarker, '**'], (state, next, payload, engine, evt) => {
        eng.del(evt.src, state, evt.path);
        next(state);
    });

    on(['updatePerms', '*', serverID, config.pathMarker, '**'], (state, next, payload, engine, evt) => {
        eng.updatePerms(evt.src, state, evt.path, payload.user, payload.perms);
        next(state);
    });
};