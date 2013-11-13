/*
 *  @module Hoverable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity hoverable
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    'glue/modules/spilgames/entity/behaviour/hoverable',
    [
        'glue'
    ],
    function (Glue) {
        /**
         * Constructor
         * @memberOf hoverable
         * @function
         * @param {Object} obj: the entity object
         */
        return function (obj) {
            var isHovering = false,
                hoverOverCalled = false,
                hoverOutCalled = false,
                /**
                 * Listens the POINTER_MOVE event
                 * @name onPointerMove
                 * @memberOf hoverable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerMove = function (evt) {
                    var pointerPosition = {
                        x: evt.gameX,
                        y: evt.gameY
                    };
                    if (pointerPosition.x >= obj.pos.x && 
                        pointerPosition.x <= (obj.pos.x + obj.width) &&
                        pointerPosition.y >= obj.pos.y && 
                        pointerPosition.y <= (obj.pos.y + obj.height)) {
                        isHovering = true;
                        if (obj.hoverOver && !hoverOverCalled) {
                            hoverOverCalled = true;
                            hoverOutCalled = false;
                            obj.hoverOver(evt);
                        }
                    } else {
                        isHovering = false;
                        if (obj.hoverOut && !hoverOutCalled) {
                            hoverOutCalled = true;
                            hoverOverCalled = false;
                            obj.hoverOut(evt);
                        }
                    }
                },
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf hoverable
                 * @function
                 */
                setupEvents = function () {
                    Glue.event.on(Glue.input.POINTER_MOVE, onPointerMove);
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf hoverable
                 * @function
                 */
                tearDownEvents = function () {
                    Glue.event.off(Glue.input.POINTER_MOVE, onPointerMove);
                };

            // setup the module events
            setupEvents();

            return obj.mix({
                isHovering: function () {
                    return isHovering;
                },
                /**
                 * Can be used to destruct this entity
                 * @name isPressed
                 * @memberOf hoverable
                 * @function
                 */
                destructHoverable: function () {
                    tearDownEvents();
                }
            });
        };
    }
);
