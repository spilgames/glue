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
        var Sugar = Glue.sugar;
        return function () {
            var name = '',
                module = {
                    add: function (object) {
                        return Sugar.combine(this, object)
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
            return Sugar.combine(module, {
                setName: function (value) {
                    name = value;
                },
                getName: function (value) {
                    return name;
                }
            });
        };
    }
);
