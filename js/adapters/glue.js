/**
 *  @module Glue
 *  @namespace adapters
 *  @desc Provides adapters to interface with native Glue functionality
 *  @copyright © 2013 - SpilGames
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
        component: function () {
            var self = this;
            return {
               create: function (mixins, callback) {
                    var i,
                        l,
                        mixinModules,
                        mixed = {};
                    
                    self.module.get(mixins, function () {
                        mixinModules = Array.prototype.slice.call(arguments);
                        for (i = 0, l = mixinModules.length; i < l; ++i) {
                            mixinModules[i](mixed)
                        }
                        callback.call(self, mixed);
                    });
                }
            };
        }
    };
}(window, modules.glue));
