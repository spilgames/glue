/*
 *  @module Clickable
 *  @namespace component
 *  @desc Used to make a game component perfom an action when she's clicked
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/clickable',
    [
        'glue',
        'glue/basecomponent'
    ],
    function (Glue, BaseComponent) {
        'use strict';

        return function (object) {
            var baseComponent = BaseComponent('clickable', object),
                isClicked = function (e) {
                    return object.getBoundingBox().hasPosition(e.position);
                },
                pointerDownHandler = function (e) {
                    if (isClicked(e) && object.onClick) {
                        object.onClick(e);
                    }
                },
                pointerUpHandler = function (e) {
                    if (isClicked(e) && object.onClick) {
                        object.onClick(e);
                    }
                };

            baseComponent.set({
                setup: function (settings) {

                },
                destroy: function () {
                    baseComponent.unregister('pointerDown');
                    baseComponent.unregister('pointerUp');
                    baseComponent.unregister('destroy');
                },
                update: function (deltaT) {

                },
                pointerDown: function (e) {
                    pointerDownHandler(e);
                },
                pointerUp: function (e) {
                    pointerUpHandler(e);
                }
            });

            // Register the methods we want to update in the game cycle
            baseComponent.register('pointerDown');
            baseComponent.register('pointerUp');
            baseComponent.register('destroy');

            return object;
        };
    }
);
