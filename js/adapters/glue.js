/**
 *  @module Glue
 *  @namespace adapters
 *  @desc Provides adapters to interface with native Glue functionality
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
var adapters = adapters || {};
adapters.glue = (function (win, Glue) {
    'use strict';
    return {
        module: {
            create: win.define,
            get: win.require,
            config: win.requirejs.config
        },
        sugar: Glue.sugar,
        audio: Howl
    };
}(window, modules.glue));