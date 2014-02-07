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
                audio: adapters.glue.audio
            };
        }(adapters));

    win.glue = {
        module: glue.module
    };
    win.game = {};
    glue.module.create('glue', function () {
        return glue;
    });
}(window));