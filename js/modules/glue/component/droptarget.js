/*
 *  @module Droptarget
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity behave as a droptarget
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/droptarget',
    [
        'glue',
        'glue/event/system'
    ],
    function (Glue, Event) {
        return function (obj) {
            var droppedOnMe = function (draggable, e) {
                    // TODO: add more methods (constants) to check on me
                    var position = e.position,
                        boundingBox = obj.visible.getBoundingBox();

                    // TODO: abstract this to overlaps utility method
                    if (position.x >= boundingBox.left && position.x <= boundingBox.right &&
                        position.y >= boundingBox.top && position.y <= boundingBox.bottom) {
                        return true;
                    }
                },
                draggableDropHandler = function (draggable, e) {
                    if (droppedOnMe(obj, e) && obj.onDrop) {
                        obj.onDrop(draggable, e);
                    }
                };

            obj = obj || {};
            obj.droptarget = {
                setup: function (settings) {
                    Event.on('draggable.drop', draggableDropHandler);
                },
                destroy: function () {
                    Event.off('draggable.drop', draggableDropHandler);
                },
                update: function (deltaT) {

                }
            };
            return obj;
        };
    }
);
