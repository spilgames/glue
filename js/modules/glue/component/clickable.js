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
        'glue'
    ],
    function (Glue) {
        return function (object) {
            var isClicked = function (e) {
                    return object.visible.getBoundingBox().hasPosition(e.position);
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

            object = object || {};
            object.clickable = {
                setup: function (settings) {

                },
                destroy: function () {

                },
                update: function (deltaT) {

                },
                pointerDown: function (e) {
                    pointerDownHandler(e);
                },
                pointerUp: function (e) {
                    pointerUpHandler(e);
                }
            };

            object.register('pointerDown', object.clickable.pointerDown);

            return object;
        };
    }
);
