/**
 *  @module Glue main
 *  @desc Provides an abstraction layer to game engines
 *  @copyright © 2013 - The SpilGames Authors
 */
(function () {
    var profile1 = (function (adapters) {
            'use strict';
            return {
                audio: adapters.melonjs.audio,
                entity: adapters.melonjs.entity,
                event: adapters.melonjs.event,
                game: adapters.melonjs.game,
                input: adapters.melonjs.input,
                levelManager: adapters.melonjs.levelManager,
                loader: adapters.melonjs.loader,
                math: adapters.melonjs.math,
                module: adapters.glue.module,
                plugin: adapters.melonjs.plugin,
                state: adapters.melonjs.state,
                sugar: adapters.glue.sugar,
                video: adapters.melonjs.video
            };
        }(adapters)),
        profile2 = (function (adapters) {
            'use strict';
            return {
                module: adapters.glue.module,
                sugar: adapters.glue.sugar,
                component: adapters.glue.component,
                audio: adapters.melonjs.audio,
                entity: adapters.melonjs.entity,
                event: adapters.melonjs.event,
                game: adapters.glue.game,
                input: adapters.melonjs.input,
                levelManager: adapters.melonjs.levelManager,
                loader: adapters.melonjs.loader,
                math: adapters.melonjs.math,
                plugin: adapters.melonjs.plugin,
                state: adapters.melonjs.state,
                video: adapters.melonjs.video
            };
        }(adapters)),
        glue = profile2;

    window.glue = {
        module: glue.module
    };
    window.game = {};
    glue.module.create('glue', function () {
        glue.api = GameAPI;
        return glue;
    });
}());
