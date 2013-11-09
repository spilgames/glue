/**
 *  @desc Tests for draggable behaviour
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    [
        'glue',
        'modules/spilgames/entity/base',
        'modules/spilgames/entity/behaviour/draggable',
        'modules/spilgames/entity/behaviour/droptarget'
    ],
    function (Glue, Base, Draggable, Droptarget) {
        describe('spilgames.entity.behaviour.droptarget', function () {
            var canvas,
                draggable,
                droptarget,
                dropped = false,
                // creates a test draggable entity
                createDraggable = function (position, dimensions) {
                    // create the base object and add custom methods
                    draggable = Base(position.x, position.y, {
                        name: 'draggableEntity',
                        width: dimensions.x,
                        height: dimensions.y,
                        image: 'leftButton'
                    }).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        }
                    });

                    // mix in the draggable behaviour
                    Draggable(draggable);
                    // add the test draggable entity to the game
                    Glue.game.add(draggable, 1);
                },
                // creates a test droptarget entity
                createDroptarget = function (position, dimensions) {
                    // create the base object and add custom methods
                    droptarget = Base(position.x, position.y, {
                        name: 'droptargetEntity',
                        width: dimensions.x,
                        height: dimensions.y,
                        image: 'rightButton'
                    }).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        },
                        drop: function (e) {
                            dropped = true;
                        },
                        enableContains: function() {
                            this.setCheckMethod(this.CHECKMETHOD_CONTAINS);
                        }
                    });

                    // mix in the droptarget behaviour
                    Droptarget(droptarget);
                    // add the test droptarget entity to the game
                    Glue.game.add(droptarget, 1);
                },
                // drags an entity from a start to an end location
                drag = function (startFrom, moveTo) {
                    // mock user drag events
                    Glue.event.fire(Event.DRAGSTART, [{gameX: startFrom.x, gameY: startFrom.y, pointerId: 2}, draggable]);
                    Glue.event.fire(Event.MOUSEMOVE, [{gameX: moveTo.x, gameY: moveTo.y, pointerId: 2}, draggable]);
                    Glue.event.fire(Event.DRAGEND, [{gameX: moveTo.x, gameY: moveTo.y, pointerId: 2}, draggable]);
                },
                // removes all test entities from the game
                removeEntities = function () {
                    // remove entities if they are created
                    if (draggable) {
                        Glue.game.remove(draggable);
                    }
                    if (droptarget) {
                        Glue.game.remove(droptarget);
                    }
                };

            beforeAll(function () {
                // get a reference to the canvas element
                canvas = Glue.video.getCanvas();
            });

            afterEach(function () {
                // reset dropped
                dropped = false;
                // remove leftover test entities
                removeEntities();
            });

            describe('checkmethod: contains', function () {
                it('Should be able to detect a valid drop of a draggable', function () {
                    var startFrom = {x: 70, y: 70},
                        moveTo = {x: 220, y: 220};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 100, y: 100});
                    // create a droptarget
                    createDroptarget({x: 100, y: 100}, {x: 200, y: 200});
                    // enable the contains check method
                    droptarget.enableContains();
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    expect(dropped).toBeTruthy();
                });
                it('Should not accept a drop outside of the check area', function () {
                    var startFrom = {x: 70, y: 70},
                        moveTo = {x: 100, y: 100};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 100, y: 100});
                    // create a droptarget
                    createDroptarget({x: 100, y: 100}, {x: 200, y: 200});
                    // enable the contains check method
                    droptarget.enableContains();
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    expect(dropped).toBeFalsy();
                });
            });

            describe('checkmethod: overlap', function () {
                it('Should be able to detect a valid drop of a draggable', function () {
                    var startFrom = {x: 70, y: 70},
                        moveTo = {x: 100, y: 100};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 100, y: 100});
                    // create a droptarget
                    createDroptarget({x: 100, y: 100}, {x: 200, y: 200});
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    expect(dropped).toBeTruthy();
                });
                it('Should not accept a drop outside of the check area', function () {
                    var startFrom = {x: 70, y: 70},
                        moveTo = {x: 500, y: 500};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 100, y: 100});
                    // create a droptarget
                    createDroptarget({x: 100, y: 100}, {x: 200, y: 200});
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    expect(dropped).toBeFalsy();
                });
            });
        });
    }
);