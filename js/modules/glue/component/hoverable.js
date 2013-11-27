/*
 *  @module Hoverable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity hoverable
 *  @author Jeroen Reurings
 *  @copyright © 2013 - The SpilGames Authors
 */
glue.module.create(
    'glue/component/hoverable',
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
                checkHovering = function (evt, collisionBox, obj) {
                    var localPosition = obj.floating ?
                        me.game.viewport.worldToLocal(evt.gameX, evt.gameY) :
                        {x: evt.gameX, y: evt.gameY};

                    if (!collisionBox) {
                        return;
                    }
                    if (collisionBox.containsPointV(localPosition)) {
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
                    checkHovering(evt, obj.collisionBox, obj);
                },
                /**
                 * Listens the POINTER_MOVE event
                 * @name onPointerMove
                 * @memberOf hoverable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerMove = function (evt) {
                    checkHovering(evt, obj.collisionBox, obj);
                },
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf hoverable
                 * @function
                 */
                setupEvents = function () {
                    Glue.event.on(Glue.input.POINTER_DOWN, onPointerDown);
                    Glue.event.on(Glue.input.POINTER_MOVE, onPointerMove);
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
                 * @name destructHoverable
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
