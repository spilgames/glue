/*
 *  @module BaseObject
 *  @desc Represents a base object
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/baseobject',
    [
        'glue'
    ],
    function (Glue) {
        return function () {
            var name = '',
                module = {
                    add: function (value) {
                        this.mix(value);
                        return this;
                    }
                },
                mixins = Array.prototype.slice.call(arguments),
                mixin = null,
                l = mixins.length,
                i = 0;

            for (i; i < l; ++i) {
                mixin = mixins[i];
                mixin(module);
            }
            return module.mix({
                setName: function (value) {
                    name = value;
                },
                getName: function (value) {
                    return name;
                }
            })
        };
    }
);
