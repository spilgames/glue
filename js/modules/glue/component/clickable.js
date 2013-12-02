/*
 *  @module Clickable
 *  @namespace component
 *  @desc Used to make a game component perfom an action when she's clicked
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/clickable',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            var isClicked = function (e) {
                    // TODO: add more methods (constants) to check on me
                    var position = e.position.get(),
                        boundingBox = obj.visible.getBoundingBox();

                    // TODO: abstract this to overlaps utility method
                    if (position.x >= boundingBox.left && position.x <= boundingBox.right &&
                        position.y >= boundingBox.top && position.y <= boundingBox.bottom) {
                        return true;
                    }
                },
                pointerDownHandler = function (e) {
                    if (isClicked(e) && obj.onClick) {
                        obj.onClick(e);
                    }
                };

            obj = obj || {};
            obj.clickable = {
                setup: function (settings) {

                },
                destroy: function () {

                },
                update: function (deltaT) {

                },
                pointerDown: function (e) {
                    pointerDownHandler(e);
                }
            };
            return obj;
        };
    }
);
