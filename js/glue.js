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
        }(adapters)),
        testScripts = [
            '../bower_components/spine/spine-js/spine.js',
        ],
        loadCount = 0,
        // called when a spec is loaded
        callback = function () {
            ++loadCount;
            if (loadCount === testScripts.length) {
                win.glue = {
                    module: glue.module
                };
                win.game = {};
                glue.module.create('glue', ['audio51'], function (Audio) {
                    glue.audio = Audio;
                    glue.spine = win.spine;
                    return glue;
                });
            }
        },
        i,
        l,
        loadScripts = function () {
            'use strict';
            for (i = 0, l = testScripts.length; i < l; ++i) {
                var script = document.createElement('script');
                // create script and append to head
                script.src = testScripts[i];
                script.async = false;
                document.head.appendChild(script);
                // call the callback function when a script is loaded
                script.onreadystatechange = script.onload = function () {
                    var state = script.readyState;
                    if (!state || /loaded|complete/.test(state)) {
                        callback();
                    }
                };
            }
        }
}(window));