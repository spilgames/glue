/*
 *  @module BaseComponent
 *  @desc Represents the base for all components
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/basecomponent',
    [
        'glue'
    ],
    function (Glue) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (componentName, baseObject) {
            var name,
                object,
                component;

            if (Sugar.isString(componentName)) {
                name = componentName;
                object = baseObject || {};
            }

            return {
                set: function (componentObject) {
                    if (Sugar.isObject(componentObject)) {
                        component = componentObject;
                        object[componentName] = componentObject;
                        if (Sugar.isFunction(componentObject.register)) {
                            componentObject.register();
                        }
                        return object;
                    }
                },
                getName: function () {
                    return name;
                },
                getBaseObject: function () {
                    return object;
                },
                getComponent: function () {
                    return component;
                },
                register: function (functionName) {
                    object.register(functionName, component[functionName], name);
                },
                unregister: function (functionName) {
                    object.unregister(functionName, name);
                }
            };
        };
    }
);
