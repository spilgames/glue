/*
 *  @module System
 *  @namespace event
 *  @desc This module offers a very basic pub/sub system event system
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/event/system',
    function () {
        var listeners = [],
            x,
            emitEvent = function (emitter, name, data) {
                var x,
                    listener,
                    ln = listeners.length;

                if (ln > 0) {
                    for (x = 0; x < ln; ++x) {
                        listener = listeners[x];
                        if (listener && listener.name === name) {
                            listener.callback.apply({
                                name: name,
                                emitter: emitter
                            }, data);
                        }
                    }
                }
            };

        return {
            on: function (name, callback) {
                listeners.push({name: name, callback: callback});
                return [name, callback];
            },
            off: function (name, callback) {
                var x,
                    ln,
                    listener;

                for (x = 0, ln = listeners.length; x < ln; ++x) {
                    listener = listeners[x];
                    if (listener && listener.name === name &&
                            listener.callback === callback) {
                        listeners.splice(x, 1);
                    }
                }
            },
            fire: function (eventName) {
                emitEvent('system',
                    eventName,
                    Array.prototype.slice.call(
                        arguments,
                        1,
                        arguments.length
                    )
                );
            }
        };
    }
);
