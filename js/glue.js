/**
 *  @module Glue main
 *  @desc Provides an abstraction layer to game engines
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
var glue = (function (adapters) {
    'use strict';
    return function () {
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
    };
}(adapters));

var glue = glue();

glue.module.config({
    paths: {
        glue: 'modules'
    }
});

glue.module.create('glue.core', function () {
    console.log('hi...');
});

glue.game = glue.game || {};
glue.game.namespace = 'game';
window[glue.game.namespace] = {};
