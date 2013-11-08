/*
 * @module Clickable
 * @namespace modules.spilgames.entity.behaviour
 * @author Marco Colombo
 * @author Jeroen Reurings
 * @desc Used to make a game entity clickable
 */
glue.module.create(
    'modules/spilgames/entity/behaviour/clickable',
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
                },
                /**
                 * Listens the POINTER_DOWN event
                 * @name onPointerDown
                 * @memberOf clickable
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
                 * @name isPressed
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

/*
 * @module Hoverable
 * @namespace modules.spilgames.entity.behaviour
 * @author Marco Colombo
 * @author Jeroen Reurings
 * @desc Used to make a game entity hoverable
 */
glue.module.create(
    'modules/spilgames/entity/behaviour/hoverable',
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
                        if (obj.hovered) {
                            obj.hovered();
                        }
                    } else {
                        isHovering = false;
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
