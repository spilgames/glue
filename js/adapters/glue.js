/**
 *  @module Glue
 *  @namespace adapters
 *  @desc Provides adapters to interface with native Glue functionality
 *  @copyright © 2013 - SpilGames
 */
var adapters = adapters || {};
adapters.glue = (function (win) {
    'use strict';
    return {
        module: {
            create: win.define,
            get: win.require,
            config: win.requirejs.config
        },
        component: function () {
            var self = this;
            return {
               create: function (mixins, callback) {
                    var i,
                        l,
                        mixin,
                        mixed = {};

                    for (i = 0, l = mixins.length; i < l; ++i) {
                        mixin = mixins[i];
                        self.module.get([mixin], function (MixinModule) {
                            MixinModule(mixed);
                        });
                    }
                    // TODO: has to be timed when fetching new modules
                    callback.call(self, mixed);
                }
            };
        }
    };
}(window));
