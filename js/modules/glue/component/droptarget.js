/*
 *  @module Droptarget
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity act as a droptarget
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    'glue/entity/behaviour/droptarget',
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
                    Glue.event.off(Glue.input.DRAG_END, checkOnMe);
                }
            });

            // - initialisation logic -
            Glue.event.on(Glue.input.DRAG_END, checkOnMe);
            checkMethod = obj.CHECKMETHOD_OVERLAPS;
            
            // - return external interface -
            return obj;
        };
    }
);
