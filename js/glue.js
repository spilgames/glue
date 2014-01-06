/**
 *  @module Glue main
 *  @desc Provides an abstraction layer
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
(function (win) {
    var glue = (function (adapters) {
            'use strict';
            return {
                module: adapters.glue.module,
                sugar: adapters.glue.sugar,
                component: adapters.glue.component,
                game: adapters.glue.game
            };
        }(adapters));

    win.glue = {
        module: glue.module
    };
    win.game = {};
    glue.module.create('glue', ['audio51'], function (Audio) {
        glue.audio = Audio;
        return glue;
    });
}(window));