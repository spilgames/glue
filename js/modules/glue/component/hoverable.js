/*
 *  @module Hoverable
 *  @namespace component
 *  @desc Used to make a game component perfom an action when she's hovered over
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/hoverable',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            // TODO: add state constants
            var state = 'not hovered',
                isHovered = function (e) {
                    // TODO: add more methods (constants) to check on me
                    var position = e.position.get(),
                        boundingBox = obj.visible.getBoundingBox();

                    // TODO: abstract this to overlaps utility method
                    if (position.x >= boundingBox.left && position.x <= boundingBox.right &&
                        position.y >= boundingBox.top && position.y <= boundingBox.bottom) {
                        return true;
                    }
                },
                pointerMoveHandler = function (e) {
                    if (isHovered(e)) {
                        if (state === 'not hovered') {
                            if (obj.hoverOver) {
                                obj.hoverOver(e);
                            }
                            state = 'hovered';
                        }
                    } else {
                        if (state === 'hovered') {
                            if (obj.hoverOut) {
                                obj.hoverOut(e);
                            }
                            state = 'not hovered';
                        }
                    }
                };

            obj = obj || {};
            obj.hoverable = {
                setup: function (settings) {

                },
                destroy: function () {

                },
                update: function (deltaT) {

                },
                pointerMove: function (e) {
                    pointerMoveHandler(e);
                }
            };
            return obj;
        };
    }
);
