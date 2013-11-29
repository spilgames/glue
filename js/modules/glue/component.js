/*
 *  @module Component
 *  @desc Represents a component
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component',
    [
        'glue'
    ],
    function (Glue) {
        return function () {
            var name = 'undefined',
                obj = {
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
                mixin(obj);
            }
            return obj.mix({
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
