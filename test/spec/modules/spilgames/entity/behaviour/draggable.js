/**
 *  @desc Tests for draggable behaviour
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    [
        'glue',
        'modules/spilgames/entity/base',
        'modules/spilgames/entity/behaviour/draggable'
    ],
    function (Glue, Base, Draggable) {
        describe('spilgames.entity.behaviour.draggable', function () {
            'use strict';
            var dragStartCalled = false,
                dragMoveCalled = false,
                dragEndCalled = false,
                canvas,
                // creates a test draggable entity
                createDraggable = function (position, dimensions, zIndex) {
                    // create the base object and add custom methods
                    var obj = Base(position.x, position.y, {
                        name: 'draggableEntity',
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
                        dragStart: function (e) {
                            // also test the event object later on
                            dragStartCalled = true;
                        },
                        dragMove: function (e) {
                            dragMoveCalled = true;
                        },
                        dragEnd: function (e) {
                            dragEndCalled = true;
                        }
                    });

                    // mix in the draggable behaviour
                    Draggable(obj);
                    // add the test draggable entity to the game
                    Glue.game.add(obj, zIndex || 1);
                    return obj;
                },
                // drags an entity from a start to an end location
                drag = function (obj, startFrom, moveTo) {
                    // mock user drag events
                    Glue.event.fire(Glue.input.DRAG_START, [{gameX: startFrom.x, gameY: startFrom.y, pointerId: 1}, obj]);
                    Glue.event.fire(Glue.input.POINTER_MOVE, [{gameX: moveTo.x, gameY: moveTo.y, pointerId: 1}, obj]);
                    Glue.event.fire(Glue.input.DRAG_END, [{gameX: moveTo.x, gameY: moveTo.y, pointerId: 1}, obj]);
                };

            beforeAll(function () {
                // get a reference to the canvas element
                canvas = Glue.video.getCanvas();
            });

            afterEach(function () {

            });

            it('Should be able to drag an entity to a new location', function () {
                var startFrom = {x: 1, y: 1},
                    moveTo = {x: 700, y: 500};
                // create a draggable
                var entity = createDraggable({x: 0, y: 0}, {x: 204, y: 105});
                // drag the draggable entity to a new location
                drag(entity, startFrom, moveTo);

                expect(entity.pos.x).toEqual(699);
                expect(entity.pos.y).toEqual(499);

                expect(dragStartCalled).toBeTruthy();
                expect(dragMoveCalled).toBeTruthy();
                expect(dragEndCalled).toBeTruthy();

                // manual cleanup
                Glue.game.remove(entity);
            });

            it('Should be able to drag the upper draggable and reject the rest', function () {
                var startFrom = {x: 0, y: 0},
                    moveTo = {x: 700, y: 500};
                // create a draggable
                var entity1 = createDraggable({x: 0, y: 0}, {x: 204, y: 105}, 1),
                    entity2 = createDraggable({x: 10, y: 10}, {x: 204, y: 105}, 2),
                    entity3 = createDraggable({x: 20, y: 20}, {x: 204, y: 105}, 3);
                // dragging entity3 should only affect entity 3
                drag(entity3, startFrom, moveTo);
                expect(entity3.pos.x).toEqual(720);
                expect(entity3.pos.y).toEqual(520);
                expect(entity2.pos.x).toEqual(10);
                expect(entity2.pos.y).toEqual(10);
                expect(entity1.pos.x).toEqual(0);
                expect(entity1.pos.y).toEqual(0);
                // dragging entity2 should only affect entity 2
                drag(entity2, startFrom, moveTo);
                expect(entity2.pos.x).toEqual(710);
                expect(entity2.pos.y).toEqual(510);
                expect(entity1.pos.x).toEqual(0);
                expect(entity1.pos.y).toEqual(0);

                // manual cleanup
                Glue.game.remove(entity1);
                Glue.game.remove(entity2);
                Glue.game.remove(entity3);
            });
        });
    }
);
