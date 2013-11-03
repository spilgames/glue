/**
 *  @module Spilgames
 *  @namespace adapters
 *  @desc Provides adapters to interface with custom Spilgames modules or vendors
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
var adapters = adapters || {};
adapters.spilgames = (function (win, Spilgames) {
    'use strict';
    return {
        name: 'Spilgames-adapter',
        sugar: Spilgames.sugar,
        module: {
            create: win.define,
            get: win.require,
            config: win.requirejs.config
        }
    };
}(window, modules.spilgames));
