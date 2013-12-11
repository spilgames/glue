/**
 *  @module Glue main
 *  @desc Provides an abstraction layer
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
(function () {
    var glue = (function (adapters) {
            'use strict';
            return {
                module: adapters.glue.module,
                sugar: adapters.glue.sugar,
                component: adapters.glue.component,
                game: adapters.glue.game
            };
        }(adapters));

    window.glue = {
        module: glue.module
    };
    window.game = {};
    glue.module.create('glue', function () {
        return glue;
    });
}());
