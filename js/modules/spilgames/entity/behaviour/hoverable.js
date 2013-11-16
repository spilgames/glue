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
                 * Checks if the user is hovering based on the pointer event
                 * @name checkHovering
                 * @memberOf hoverable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                checkHovering = function (evt, collisionBox) {
                    if (collisionBox.containsPoint(evt.gameX, evt.gameY)) {
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
                 * Listens the POINTER_DOWN event
                 * @name onPointerDown
                 * @memberOf hoverable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerDown = function (evt) {
                    checkHovering(evt, this.collisionBox);
                },
                /**
                 * Listens the POINTER_MOVE event
                 * @name onPointerMove
                 * @memberOf hoverable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerMove = function (evt) {
                    checkHovering(evt, this.collisionBox);
                },
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf hoverable
                 * @function
                 */
                setupEvents = function () {
                    Glue.event.on(Glue.input.POINTER_DOWN, onPointerDown.bind(obj));
                    Glue.event.on(Glue.input.POINTER_MOVE, onPointerMove.bind(obj));
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf hoverable
                 * @function
                 */
                tearDownEvents = function () {
                    Glue.event.off(Glue.input.POINTER_DOWN, onPointerDown);
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
