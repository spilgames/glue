/**
 *  @module Glue main
 *  @desc Provides an abstraction layer to game engines
 *  @copyright © 2013 - SpilGames
 */
(function () {
    var glue = (function (adapters) {
        'use strict';
        return {
            audio: adapters.melonjs.audio,
            entity: adapters.melonjs.entity,
            event: adapters.melonjs.event,
            game: adapters.melonjs.game,
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
    window['glue'] = {
        module: glue.module
    };
    glue.module.create('glue', function () {
        return glue;
    });
}());
