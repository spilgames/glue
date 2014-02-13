/*
 *  @module Hoverable
 *  @namespace component
 *  @desc Used to make a game component perfom an action when she's hovered over
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/hoverable',
    [
        'glue'
    ],
    function (Glue) {
        return function (object) {
            // TODO: add state constants
            var state = 'not hovered',
                isHovered = function (e) {
                    return object.getBoundingBox().hasPosition(e.position);
                },
                pointerMoveHandler = function (e) {
                    if (isHovered(e)) {
                        if (state === 'not hovered') {
                            if (object.hoverOver) {
                                object.hoverOver(e);
                            }
                            state = 'hovered';
                        }
                    } else {
                        if (state === 'hovered') {
                            if (object.hoverOut) {
                                object.hoverOut(e);
                            }
                            state = 'not hovered';
                        }
                    }
                };

            object = object || {};
            object.hoverable = {
                pointerMove: function (e) {
                    pointerMoveHandler(e);
                }
            };

            object.register('pointerMove', object.hoverable.pointerMove);

            return object;
        };
    }
);
