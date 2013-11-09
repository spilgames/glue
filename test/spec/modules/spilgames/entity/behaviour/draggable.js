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
                    Glue.event.fire(Event.DRAGSTART, [{gameX: startFrom.x, gameY: startFrom.y, pointerId: 1}, obj]);
                    Glue.event.fire(Event.MOUSEMOVE, [{gameX: moveTo.x, gameY: moveTo.y, pointerId: 1}, obj]);
                    Glue.event.fire(Event.DRAGEND, [{gameX: moveTo.x, gameY: moveTo.y, pointerId: 1}, obj]);
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
                var startFrom = {x: 70, y: 70},
                    moveTo = {x: 700, y: 500};
                // create a draggable
                createDraggable({x: 10, y: 10}, {x: 100, y: 100});
                // drag the draggable entity to a new location
                drag(startFrom, moveTo);

                expect(obj.pos.x).toEqual(640);
                expect(obj.pos.y).toEqual(440);
            });
        });
    }
);
