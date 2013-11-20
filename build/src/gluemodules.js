glue.module.create(
    'glue/modules/spilgames/entity/base',
    [
        'glue'
    ],
    function (Glue) {
        return function (x, y, settings) {
            return {
                inject: function (extention) {
                    // get the base entity and extend it with a custom extention
                    var obj = Glue.entity.base().extend(extention);
                    // construct a new base entity instance
                    obj = new obj(x, y, settings);
                    // return the mixed object
                    return obj;
                }
            };
        };
    }
);

/*
 *  @module Clickable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity clickable
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    'glue/modules/spilgames/entity/behaviour/clickable',
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
                    if (this.collisionBox.containsPointV(localPosition)) {
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
                    Glue.event.on(Glue.input.POINTER_DOWN, onPointerDown.bind(obj));
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

/*
 *  @module Draggable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity draggable
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    'glue/modules/spilgames/entity/behaviour/draggable',
    [
        'glue'
    ],
    function (Glue) {
        // - cross instance private members -
        /*
            Depth sorting implementation improvement:
            - Assign z index of Infinity on dragged entity (so it also
              covers HUD and other not draggable entities)
            - Revert back to highgest z index of all draggables
              on drag end (so it is dropped on top of the draggable stack)
        */
        // Most simple implementation that works
        var highestEntity = null,
            maxZ = 2;
        /**
         * Constructor
         * @name init
         * @memberOf Draggable
         * @function
         * @param {Object} obj: the entity object
         */
        return function (obj) {
            // - per instance private members -
            var position = {
                    x: obj.pos.x,
                    y: obj.pos.y
                },
                dropped = false,
                resetted = false,
                dragging = false,
                dragId = null,
                grabOffset = new Glue.math.vector(0, 0),
                mouseDown = null,
                mouseUp = null,
                pointerId = null,
                /**
                 * Is used to reset the draggable to its initial position
                 * @name reset
                 * @memberOf Draggable
                 * @function
                 */
                resetMe = function () {
                    obj.pos.x = position.x;
                    obj.pos.y = position.y;
                },
                /**
                 * Gets called when the user starts dragging the entity
                 * @name dragStart
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragStart = function (e) {
                    dropped = false;
                    resetted = false;
                    // depth sorting
                    if (highestEntity === null) {
                        highestEntity = obj;
                    } else {
                        if (obj.z > highestEntity.z) {
                            highestEntity = obj;
                        }
                    }
                    if (dragging === false && obj === highestEntity) {
                        // clicked entity goes on top
                        obj.z = maxZ + 1;
                        // save max z index of all draggables
                        maxZ = obj.z;
                        // re-sort all game entities
                        me.game.world.sort();
                        dragging = true;
                        dragId = e.pointerId;
                        grabOffset.set(e.gameX, e.gameY);
                        grabOffset.sub(obj.pos);
                        if (obj.dragStart) {
                            obj.dragStart(e);
                        }
                        return false;
                    }
                },
                /**
                 * Gets called when the user drags this entity around
                 * @name dragMove
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragMove = function (e) {
                    if (dragging === true) {
                        if (dragId === e.pointerId) {
                            obj.pos.set(e.gameX, e.gameY);
                            obj.pos.sub(grabOffset);
                            if (obj.dragMove) {
                                obj.dragMove(e);
                            }
                        }
                    }
                },
                /**
                 * Gets called when the user stops dragging the entity
                 * @name dragEnd
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragEnd = function (e) {
                    highestEntity = null;
                    if (dragging === true) {
                        pointerId = undefined;
                        dragging = false;
                        if (obj.dragEnd) {
                            obj.dragEnd(e, resetMe);
                        }
                        return false;
                    }
                },
                /**
                 * Translates a pointer event to a me.event
                 * @name init
                 * @memberOf me.DraggableEntity
                 * @function
                 * @param {Object} e: the pointer event you want to translate
                 * @param {String} translation: the me.event you want to translate
                 * the event to
                 */
                translatePointerEvent = function (e, translation) {
                    Glue.event.fire(translation, [e, obj, resetMe]);
                },
                /**
                 * Initializes the events the modules needs to listen to
                 * It translates the pointer events to me.events
                 * in order to make them pass through the system and to make
                 * this module testable. Then we subscribe this module to the
                 * transformed events. This can be inproved by handling it
                 * by the Glue.input module.
                 * @name init
                 * @memberOf me.DraggableEntity
                 * @function
                 */
                 initEvents = function () {
                    pointerDown = function (e) {
                        translatePointerEvent(e, Glue.input.DRAG_START);
                    };
                    pointerUp = function (e) {
                        translatePointerEvent(e, Glue.input.DRAG_END);
                    };
                    Glue.input.pointer.on(Glue.input.POINTER_DOWN, pointerDown, obj);
                    Glue.input.pointer.on(Glue.input.POINTER_UP, pointerUp, obj);
                    Glue.event.on(Glue.input.POINTER_MOVE, dragMove);
                    Glue.event.on(Glue.input.DRAG_START, function (e, draggable) {
                        if (draggable === obj) {
                            dragStart(e);
                        }
                    });
                    Glue.event.on(Glue.input.DRAG_END, function (e, draggable) {
                        if (draggable === obj) {
                            dragEnd(e);
                        }
                    });
                };

            // - external interface -
            obj.mix({
                /**
                 * Destructor
                 * @name destructDraggable
                 * @memberOf Draggable
                 * @function
                 */
                destructDraggable: function () {
                    Glue.input.pointer.off(Glue.input.POINTER_DOWN);
                    Glue.input.pointer.off(Glue.input.POINTER_UP);
                    Glue.event.off(Glue.input.MOUSE_MOVE, dragMove);
                    Glue.event.off(Glue.input.DRAG_START, dragStart);
                    Glue.event.off(Glue.input.DRAG_END, dragEnd);
                },
                /**
                 * Sets a callback function which will be called when this entity is dragged
                 * @name setDragCallback
                 * @memberOf Draggable
                 * @function
                 * @param {Function} callback: the callback function
                 */
                setDragCallback: function (callback) {
                    dragCallback = callback;
                },
                /**
                 * Sets a callback function which will be called when this entity is dropped
                 * @name setDropCallback
                 * @memberOf Draggable
                 * @function
                 * @param {Function} callback: the callback function
                 */
                setDropCallback: function (callback) {
                    dropCallback = callback;
                },
                /**
                 * Sets the grab offset of this entity
                 * @name setGrabOffset
                 * @memberOf Draggable
                 * @function
                 * @param {Number} x: the horitontal offset
                 * @param {Number} y: the vertical offset
                 */
                setGrabOffset: function (x, y) {
                    grabOffset = new Glue.math.vector(x, y);
                },
                isResetted: function () {
                    return resetted;
                },
                isDropped: function () {
                    return dropped;
                },
                setDropped: function (value) {
                    if (Glue.sugar.isBoolean(value)) {
                        dropped = value;
                    }
                },
                setResetted: function (value) {
                    if (Glue.sugar.isBoolean(value)) {
                        resetted = value;
                    }
                },
                resetMe: function () {
                    return resetMe;
                }
            });

            // - initialisation logic -

            // init drag related events
            initEvents();
            
            // - return external interface -
            return obj;
        };
    }
);

/*
 *  @module Droptarget
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity act as a droptarget
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    'glue/modules/spilgames/entity/behaviour/droptarget',
    [
        'glue'
    ],
    function (Glue) {
        'use strict';
        // - cross instance private members -
        var resetTimeout = 100;

        /**
         * Constructor
         * @name init
         * @memberOf me.DroptargetEntity
         * @function
         * @param {Object} obj: the entity object
         */
        return function (obj) {
            // - per instance private members -
                /**
                 * the checkmethod we want to use
                 * @public
                 * @constant
                 * @type String
                 * @name checkMethod
                 */
            var checkMethod = null,
                /**
                 * Gets called when a draggable entity is dropped on the current entity
                 * @name drop
                 * @memberOf me.DroptargetEntity
                 * @function
                 * @param {Object} draggableEntity: the draggable entity that is dropped
                 */
                drop = function (draggableEntity) {
                    // could be used to perform default drop logic
                },
                /**
                 * Checks if a dropped entity is dropped on the current entity
                 * @name checkOnMe
                 * @memberOf me.DroptargetEntity
                 * @function
                 * @param {Object} e: the drag event
                 * @param {Object} draggableEntity: the draggable entity that is dropped
                 */
                checkOnMe = function (e, draggableEntity, resetMe) {
                    // the check if the draggable entity is this entity should work after
                    // a total refactoring to the module pattern
                    if (draggableEntity && draggableEntity !== obj &&
                        obj[checkMethod](draggableEntity.collisionBox)) {
                            // call the drop method on the current entity
                            drop(draggableEntity);
                            draggableEntity.setDropped(true);
                            if (obj.drop) {
                                obj.drop(draggableEntity);
                            }
                    } else {
                        Glue.sugar.setAnimationFrameTimeout(function () {
                            if (!draggableEntity.isResetted() && !draggableEntity.isDropped()) {
                                resetMe();
                                draggableEntity.setResetted(true);
                            }
                        }, resetTimeout);
                    }
                };

            // - external interface -
            obj.mix({
                /**
                 * constant for the overlaps method
                 * @public
                 * @constant
                 * @type String
                 * @name CHECKMETHOD_OVERLAPS
                 */
                CHECKMETHOD_OVERLAPS: "overlaps",
                /**
                 * constant for the contains method
                 * @public
                 * @constant
                 * @type String
                 * @name CHECKMETHOD_CONTAINS
                 */
                CHECKMETHOD_CONTAINS: "contains",
                /**
                 * Sets the collision method which is going to be used to check a valid drop
                 * @name setCheckMethod
                 * @memberOf me.DroptargetEntity
                 * @function
                 * @param {Constant} checkMethod: the checkmethod (defaults to CHECKMETHOD_OVERLAP)
                 */
                setCheckMethod: function (value) {
                    if (this[value] !== undefined) {
                        checkMethod = value;
                    }
                },
                /**
                 * Destructor
                 * @name destructDroptarget
                 * @memberOf me.DroptargetEntity
                 * @function
                 */
                destructDroptarget: function () {
                    console.log('destructdroptarget')
                    Glue.event.off(Glue.input.DRAG_END, checkOnMe);
                }
            });

            // - initialisation logic -
            Glue.event.on(Glue.input.DRAG_END, checkOnMe.bind(obj));
            checkMethod = obj.CHECKMETHOD_OVERLAPS;
            
            // - return external interface -
            return obj;
        };
    }
);

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
                    checkHovering(evt, this.collisionBox, this);
                },
                /**
                 * Listens the POINTER_MOVE event
                 * @name onPointerMove
                 * @memberOf hoverable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerMove = function (evt) {
                    checkHovering(evt, this.collisionBox, this);
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

glue.module.create(
    'glue/modules/spilgames/entity/managers/camera',
    [
        'glue',
        'glue/modules/spilgames/entity/base',
    ],
    function (Glue, Base) {
        /**
         * Constructor
         * @memberOf scrollButton
         * @function
         * @param {Object} obj: the entity object
         */
        return function (x, y, settings) {
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf scrollButton
                 * @function
                 */
            var setupEvents = function () {
                    Glue.event.on('SCROLL_SCREEN', scrollScreen);
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf scrollButton
                 * @function
                 */
                tearDownEvents = function () {
                    Glue.event.off('SCROLL_SCREEN', scrollScreen);
                },
                /**
                 * Variables
                 */
                screenPosition = {
                    x: 0,
                    y: 0
                },
                /**
                 * defines the scroll speed
                 */
                scrollSpeed = 20,
                /**
                 * defines the viewport bounds
                 */
                viewportBounds = {
                    top: 0,
                    left: 0,
                    bottom: me.game.viewport.getHeight(),
                    right: me.game.viewport.getWidth()
                },
                scrollScreen = function (direction) {
                    switch(direction) {
                        case 'left':  
                            if((screenPosition.x - scrollSpeed) > viewportBounds.left) {
                                screenPosition.x -= scrollSpeed;
                            }else{
                                screenPosition.x = 0;
                            }
                            break;
                        case 'right': 
                            if((screenPosition.x + scrollSpeed) < viewportBounds.right*2) {
                                screenPosition.x += scrollSpeed;
                            }else{
                                screenPosition.x = viewportBounds.right*2;
                            }
                            break;
                        default: break;
                    }
                    me.game.viewport.reset(screenPosition.x, 0);
                },
                /**
                 * Returns the entity with its behaviours
                 * @name obj
                 * @memberOf scrollButton
                 * @function
                 */
                obj = Base(x, y, settings).inject({
                    draw: function (context) {
                        this.parent(context);
                    },
                    update: function () {
                        return true;
                    },
                    /**
                     * gets the screen position
                     */
                    getScreenPosition: function () {
                        return screenPosition;
                    },
                    /**
                     * sets the screen position
                     */
                    setScreenPosition: function (position) {
                        screenPosition = position;
                    },
                    /**
                     * gets the screen speed
                     */
                    getScrollSpeed: function () {
                        return scrollSpeed;
                    },
                    /**
                     * sets the screen speed
                     */
                    setScrollSpeed: function (speed) {
                        screenSpeed = speed;
                    }
                });
            
            obj.floating = true;

            // setup the module events
            setupEvents();

            // adds the entity to the game
            Glue.game.add(obj, settings.zIndex || 1);

            // returns the entity with its behaviours
            return obj;
        };
    }
);

glue.module.create(
    'glue/modules/spilgames/entity/ui/scrollarea',
    [
        'glue',
        'glue/modules/spilgames/entity/base',
        'glue/modules/spilgames/entity/behaviour/hoverable'
    ],
    function (Glue, Base, Hoverable) {
        /**
         * Constructor
         * @memberOf scrollArea
         * @function
         * @param {Object} obj: the entity object
         */
        return function (x, y, settings) {
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf scrollArea
                 * @function
                 */
            var draggedObject = null,
                dragStart = function (e, draggable) {
                    isDragging = true;
                    draggedObject = draggable;
                },
                dragEnd = function (e) {
                    isDragging = false;
                },
                setupEvents = function () {
                    Glue.event.on(Glue.input.DRAG_START, dragStart);
                    Glue.event.on(Glue.input.DRAG_END, dragEnd);
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf scrollArea
                 * @function
                 */
                tearDownEvents = function () {
                    Glue.event.off(Glue.input.DRAG_START, dragStart);
                    Glue.event.off(Glue.input.DRAG_END, dragEnd);
                },
                /**
                 * Variables
                 */
                isHovering = false,
                isDragging = false,
                hoverPosition = null,
                /**
                 * Returns the entity with its behaviours
                 * @name obj
                 * @memberOf scrollArea
                 * @function
                 */
                obj = Base(x, y, settings).inject({
                    draw: function (context) {
                        this.parent(context);
                        if (settings.debug) {
                            context.fillStyle = 'blue';
                            context.fillRect(this.pos.x,this.pos.y,this.width,this.height);
                        }
                    },
                    hoverOver: function (e) {
                        if (draggedObject) {
                            hoverPosition = me.game.viewport.worldToLocal(
                                draggedObject.pos.x,
                                draggedObject.pos.y
                            );
                        }
                        isHovering = true;
                    },
                    hoverOut: function () {
                        isHovering = false;
                    },
                    update: function () {
                        if(isDragging && this.isHovering()) {
                            Glue.event.fire('SCROLL_SCREEN', [settings.direction]);
                            draggedObject.pos.x = hoverPosition.x + me.game.viewport.pos.x;
                            draggedObject.pos.y = hoverPosition.y + me.game.viewport.pos.y;
                        }
                        return true;
                    },
                    /**
                     * Can be used to destruct this entity
                     * @name destructClickable
                     * @memberOf scrollArea
                     * @function
                     */
                    destructClickable: function () {
                        tearDownEvents();
                    }
                });
            
            obj.floating = true;

            // setup the module events
            setupEvents();

            // setup the behaviours of this entity
            Hoverable(obj);

            // returns the entity with its behaviours
            return obj;
        };
    }
);

glue.module.create(
    'glue/modules/spilgames/entity/ui/scrollbutton',
    [
        'glue',
        'glue/modules/spilgames/entity/base',
        'glue/modules/spilgames/entity/behaviour/hoverable',
        'glue/modules/spilgames/entity/behaviour/clickable'
    ],
    function (Glue, Base, Hoverable, Clickable) {
        /**
         * Constructor
         * @memberOf scrollButton
         * @function
         * @param {Object} obj: the entity object
         */
        return function (x, y, settings) {
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf scrollButton
                 * @function
                 */
            var setupEvents = function () {
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf scrollButton
                 * @function
                 */
                tearDownEvents = function () {
                },
                /**
                 * Variables
                 */
                isHovered = false,
                isClicked = false,
                /**
                 * Returns the entity with its behaviours
                 * @name obj
                 * @memberOf scrollButton
                 * @function
                 */
                obj = Base(x, y, settings).inject({
                    draw: function (context) {
                        this.parent(context);
                    },
                    update: function () {
                        if(isClicked) {
                            Glue.event.fire('SCROLL_SCREEN', [settings.direction]);
                        }
                        return true;
                    },
                    clickUp: function (e) {
                        isClicked = false;
                    },
                    hoverOver: function (e) {
                        isHovering = true;
                        if(this.renderable) {
                            this.renderable.setCurrentAnimation('hovered');
                        }
                    },
                    hoverOut: function (e) {
                        isHovering = false;
                        if(this.renderable) {
                            this.renderable.setCurrentAnimation('normal');
                        }
                    },
                    isHovering: function () {
                        return isHovering;
                    },
                    /**
                     * Returns if this entity is clicked
                     * @name clicked
                     * @memberOf scrollButton
                     * @function
                     */
                    clickDown: function (e) {
                        isClicked = true;
                    },
                    isClicked: function () {
                        return isClicked;
                    },
                    /**
                     * Can be used to destruct this entity
                     * @name destructClickable
                     * @memberOf scrollButton
                     * @function
                     */
                    destructClickable: function () {
                        tearDownEvents();
                    }
                });

                if(obj.renderable) {
                    obj.renderable.addAnimation('normal', [0]);
                    obj.renderable.addAnimation('hovered', [1]);
                }

            // we assume that all scroll buttons are floating
            obj.floating = true;

            // setup the module events
            setupEvents();

            // setup the behaviours of this entity
            Hoverable(obj);
            Clickable(obj);

            // returns the entity with its behaviours
            return obj;
        };
    }
);
