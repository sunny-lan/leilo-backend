const perms = require('obj-perms-engine').NVEOPerms;
const version = require('./package.json').serverVersion;
const match = require('./modules/evtTablesMatch');

module.exports = {

    //client-server shared constants

    sharedConsts: {
        serverID: "leilo", //username of server

        pathMarker: 'path',//indicator of path in event array

        permsEngineOptions: {
            USER_LEVEL: {
                ROOT: 0,
                USER: 1,
                PRGM: 2,
            },
            WILDCARD: '*',
            permsModule: perms,
        },

        serverVersion: version, //gives program easy access to current package serverVersion
    },

    //server only config

    serverConfig: {
        serverPort: 80,

        enable: "ALWAYS", //enable all modules by default

        defaultPasswordHashes: {
            leilo: {
                passwordHash: "sha1$37dea33b$1$0ca2d75849f2731a8248054702a5f4e7d00abc22"
            },
        },

        engine:{
            wildcard: true, //enable wildcards in event name
            maxListeners: 30,
        },
    },

    //module configs

    modules: [
        {
            enable: "PRODUCTION",
            __moduleName: "persist",
            saveLocation: `${__dirname}\\data\\state.json`, //where server state is stored on shutdown etc.
            saveInterval: -1,//amount of millis between autosave, -1 means don't autosave
            persistVersionRequirements: ">=0.0.0",
            exitDelay: 500, //amount to wait before exiting
        },

        {
            __moduleName: "evtTables",
            defaultEvtRules: [
                { //accept all root events
                    action: 'accept',
                    match: match.userLevel(match.ALL, 0)
                },
                //accept all non handled events
                {
                    action: 'accept',
                    match: match.ALL,
                },
            ],
        },

        {
            __moduleName: "obj",
        },

        {
            __moduleName: "subscribe",
        },

        {
            __moduleName: {
                fileName: "user",
                funcName: "middleware",
            },
        },

        {
            __moduleName: "scripts",
            maxScriptTimeout: 1000, //maximum time a script instance can run synchronously for

            //forced global options for script sandboxes
            globalSandboxOptions: {
                allowRemoveAllListeners: false,
                forceSrc: true,
                forceDst: true,
            },

            //forced global options for script VMs
            globalVMOptions: {},
        },

        {
            __moduleName: "gc",
        },

        {
            __moduleName: "wsConnector",
        },

        {
            __moduleName: "debug",
            enable: "DEV",
            debugLevel: "normal", // can be none, short, normal, or verbose
        },
    ],
};