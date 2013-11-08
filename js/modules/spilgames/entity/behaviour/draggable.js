/*
 * @module Draggable
 * @namespace modules.spilgames.entity.behaviour
 * @desc Used to make a game entity draggable
 */
glue.module.create(
    'modules/spilgames/entity/behaviour/draggable',
    [
        'glue'
    ],
    function (Glue) {
        /**
         * Constructor
         * @memberOf draggable
         * @function
         * @param {Object} obj: the entity object
         */
        return function (obj) {
            var isPressed = false,
                /**
                 * Listens the POINTER_UP event
                 * @name onPointerUp
                 * @memberOf draggable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerUp = function (evt) {
                    isPressed = false;
                },
                /**
                 * Listens the POINTER_DOWN event
                 * @name onPointerDown
                 * @memberOf draggable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerDown = function (evt) {
                    if(obj.isHovering()) {
                        isPressed = true;
                        // call the clicked method if it exists
                        if (obj.clicked) {
                            obj.clicked();
                        }
                    }
                },
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf draggable
                 * @function
                 */
                setupEvents = function () {
                    Glue.event.on(Glue.input.POINTER_DOWN, onPointerDown);
                    Glue.event.on(Glue.input.POINTER_UP, onPointerUp);
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf draggable
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
                 * @memberOf draggable
                 * @function
                 */
                isPressed: function () {
                    return isPressed;
                },
                /**
                 * Can be used to destruct this entity
                 * @name isPressed
                 * @memberOf draggable
                 * @function
                 */
                destructClickable: function () {
                    tearDownEvents();
                }
            });
        };
    }
);
