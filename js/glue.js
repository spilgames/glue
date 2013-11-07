/**
 *  @module Glue main
 *  @desc Provides an abstraction layer to game engines
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
var glue = (function (adapters) {
    'use strict';
    return {
        audio: adapters.melonjs.audio,
        event: adapters.melonjs.event,
        input: adapters.melonjs.input,
        levelManager: adapters.melonjs.levelManager,
        loader: adapters.melonjs.loader,
        module: adapters.spilgames.module,
        plugin: adapters.melonjs.plugin,
        state: adapters.melonjs.state,
        sugar: adapters.spilgames.sugar,
        video: adapters.melonjs.video
    };
}(adapters));

glue.module.create('glue/entity/base', function () {
    return function (x, y, settings) {
        return new me.ObjectEntity(x, y, settings);
    };
});

glue.game = glue.game || {};
glue.game.namespace = 'game';
window[glue.game.namespace] = {};
