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
            var canvas,
                obj,
                // creates a test draggable entity
                createDraggable = function (position, dimensions) {
                    // create the base object and add custom methods
                    obj = Base(position.x, position.y, {
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
                        }
                    });

                    // mix in the draggable behaviour
                    Draggable(obj);
                    // add the test draggable entity to the game
                    Glue.game.add(obj, 1);
                },
                // drags an entity from a start to an end location
                drag = function (startFrom, moveTo) {
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
                if (obj) {
                    Glue.game.remove(obj);
                }
            });

            it('Should be able to drag an entity to a new location', function () {
                var startFrom = {x: 1, y: 1},
                    moveTo = {x: 700, y: 500};
                // create a draggable
                createDraggable({x: 0, y: 0}, {x: 204, y: 105});
                // drag the draggable entity to a new location
                drag(startFrom, moveTo);

                expect(obj.pos.x).toEqual(699);
                expect(obj.pos.y).toEqual(499);
            });
        });
    }
);
