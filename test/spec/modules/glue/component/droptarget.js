/**
 *  @desc Tests for draggable behaviour
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue',
        'glue/component/base',
        'glue/component/draggable',
        'glue/component/droptarget'
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
                        image: 'kitty'
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
                        image: 'door'
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
                    Glue.event.fire(Glue.input.DRAG_START, [{gameX: startFrom.x, gameY: startFrom.y, pointerId: 2}, draggable]);
                    Glue.event.fire(Glue.input.POINTER_MOVE, [{gameX: moveTo.x, gameY: moveTo.y, pointerId: 2}, draggable]);
                    Glue.event.fire(Glue.input.DRAG_END, [{gameX: moveTo.x, gameY: moveTo.y, pointerId: 2}, draggable, draggable.resetMe()]);
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
                    var startFrom = {x: 0, y: 0},
                        moveTo = {x: 391, y: 325};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 198, y: 226});
                    // create a droptarget
                    createDroptarget({x: 200, y: 200}, {x: 491, y: 414});
                    // enable the contains check method
                    droptarget.enableContains();
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    expect(dropped).toBeTruthy();
                });
                it('Should not accept a drop outside of the check area', function () {
                    var startFrom = {x: 70, y: 70},
                        moveTo = {x: 825, y: 325};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 198, y: 226});
                    // create a droptarget
                    createDroptarget({x: 200, y: 200}, {x: 491, y: 414});
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
                        moveTo = {x: 86, y: 359};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 198, y: 226});
                    // create a droptarget
                    createDroptarget({x: 200, y: 200}, {x: 491, y: 414});
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    expect(dropped).toBeTruthy();
                });
                it('Should not accept a drop outside of the check area', function () {
                    var startFrom = {x: 70, y: 70},
                        moveTo = {x: 825, y: 325};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 198, y: 226});
                    // create a droptarget
                    createDroptarget({x: 200, y: 200}, {x: 491, y: 414});
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    expect(dropped).toBeFalsy();
                });
                it('Should be able to reset to intial position', function (done) {
                    var startFrom = {x: 70, y: 70},
                        moveTo = {x: 825, y: 325};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 198, y: 226});
                    // create a droptarget
                    createDroptarget({x: 200, y: 200}, {x: 491, y: 414});
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    setTimeout(function () {
                        expect(draggable.pos.x).toEqual(0);
                        expect(draggable.pos.y).toEqual(0);
                        done();
                    }, 200);
                });
                it('Should not reset after a valid drop', function (done) {
                    var startFrom = {x: 70, y: 70},
                        moveTo = {x: 86, y: 359};
                    // create a draggable
                    createDraggable({x: 0, y: 0}, {x: 198, y: 226});
                    // create a droptarget
                    createDroptarget({x: 200, y: 200}, {x: 491, y: 414});
                    // drag the draggable entity to a new location
                    drag(startFrom, moveTo);

                    expect(dropped).toBeTruthy();
                    setTimeout(function () {
                        expect(draggable.pos.x).toEqual(16);
                        expect(draggable.pos.y).toEqual(289);
                        done();
                    }, 200);
                });
            });
        });
    }
);
