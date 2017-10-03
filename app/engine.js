//EventEmitter2 - allows wildcard events and namespacing
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const EventEmitterChain2 = require('eventemitterchain2').EventEmitterChain2;
const config = require('./config');
let toObj = require("./pathed").toObj;
const serverID = config.serverID;
const abind = require('auto-bind');
const evtType = require("./pathed.js").evtType;

const defaultConf = {
    wildcard: true, //enable wildcards in event name
    maxListeners: config.engineMaxListeners,
};

//Handles state change events and allows for middleware (aka functions that may modify events as they are passed down)
//Adds some syntactic sugar to make middleware easy
//Also allows cancel, emit, etc. nice functions (cancel is only for middleware)
class Engine extends EventEmitter2 {
    constructor(initState = {}) {
        super(defaultConf);
        abind(this);

        this.state = initState;

        // const actualSuper = super;
        //handles events for middleware (aka before actual event is run)
        //todo super is not bound properly
        this.pendingEmitter = new EventEmitterChain2(defaultConf, (...args) => super.emit(...args));
    }

    _createHandler(callback) {
        return (next, payload, evt) => {
            try {
                callback(
                    this.state,
                    //wrap next function with a nextState parameter that allows middleware to modify state
                    (nextState) => {
                        this.state = nextState;
                        next();
                    },
                    payload,
                    evt
                )
            } catch (err) {
                this.emit(['errorOccurred', serverID, evt.src], {
                    err: err,
                    srcEvent: evt
                });
            }
        };
    }

    //registers a callback into the middleware chain
    onM(evt, callback) {
        this._checkInvalid(evt);
        this.pendingEmitter.on(evt, this._createHandler(callback))
    };

    onceM(evt, callback) {
        this._checkInvalid(evt);
        this.pendingEmitter.once(evt, this._createHandler(callback))
    }

    _checkInvalid(evt) {
        if (evtType(evt) === 'invalid') {
            this.emit(['errorOccurred', serverID, serverID], {
                err: new Error('Invalid event'),
                srcEvt: evt,
            });
        }
    }

    emit(evt, payload) {
        //ignore internal events
        if (evt === 'newListener' || evt === 'removeListener')return;
        this._checkInvalid(evt);

        const defaultParams = [undefined, '*', '*'];
        for (let i = 0; i < defaultParams.length; i++)
            if (evt[i] === undefined)
                evt[i] = defaultParams[i];

        this.pendingEmitter.emit(evt, payload, toObj(evt));
    }

    emitNext(...args) {
        process.nextTick(() => this.emit(...args))
    }
}

module.exports = Engine;