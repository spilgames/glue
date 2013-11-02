/**
 *  @module Api
 *  @namespace glue
 *  @desc Provides an abstraction layer to game engines
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.api = (function (adapters) {
    'use strict';
    return {
        audio: adapters.melonjs.audio,
        event: adapters.melonjs.event,
        input: adapters.melonjs.input,
        loader: adapters.melonjs.loader,
        plugin: adapters.melonjs.plugin,
        state: adapters.melonjs.state,
        video: adapters.melonjs.video,
        levelManager: adapters.melonjs.levelManager
    };
}(glue.adapters));
