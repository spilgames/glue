/*
 *  @module Clickable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity clickable
 *  @copyright (C) 2013 Jeroen Reurings, SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/clickable',
    [
        'glue'
    ],
    function (Glue) {
        /**
         * Constructor
         * @memberOf clickable
         * @function
         * @param {Object} obj: the entity object
         */
        return function (obj) {
            var isPressed = false,
                /**
                 * Listens the POINTER_UP event
                 * @name onPointerUp
                 * @memberOf clickable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerUp = function (evt) {
                    isPressed = false;
                    // call the clicked method if it exists
                    if (obj.clickUp) {
                        obj.clickUp(evt);
                    }
                },
                /**
                 * Listens the POINTER_DOWN event
                 * @name onPointerDown
                 * @memberOf clickable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerDown = function (evt) {
                    var localPosition = me.game.viewport.worldToLocal(
                        evt.gameX,
                        evt.gameY
                    );
                    if (obj.collisionBox && obj.collisionBox.containsPointV(localPosition)) {
                        isPressed = true;
                        // call the clicked method if it exists
                        if (obj.clickDown) {
                            obj.clickDown(evt);
                        }
                    }
                },
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf clickable
                 * @function
                 */
                setupEvents = function () {
                    Glue.event.on(Glue.input.POINTER_DOWN, onPointerDown);
                    Glue.event.on(Glue.input.POINTER_UP, onPointerUp);
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf clickable
                 * @function
                 */
                tearDownEvents = function () {
                    Glue.event.off(Glue.input.POINTER_DOWN, onPointerDown);
                    Glue.event.off(Glue.input.POINTER_UP, onPointerUp);
                };

            // setup the module events
            setupEvents();

            return obj.mix({
                /**
                 * Returns if this entity is pressed
                 * @name isPressed
                 * @memberOf clickable
                 * @function
                 */
                isPressed: function () {
                    return isPressed;
                },
                /**
                 * Can be used to destruct this entity
                 * @name destructClickable
                 * @memberOf clickable
                 * @function
                 */
                destructClickable: function () {
                    tearDownEvents();
                }
            });
        };
    }
);
