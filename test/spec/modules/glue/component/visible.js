/**
 *  @desc Tests for visible components
 *  @copyright (C) 2013 Jeroen Reurings, SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue',
        'glue/game',
        'glue/event/system',
        'glue/component/visible'
    ],
    function (Glue, Game, Event, VisibleComponent) {
        describe('glue.component.visible', function () {
            'use strict';

            it('Should be able to create a visible component using an image', function (done) {
                /*
                // This is awesome
                Game.add({
                    update: function (deltaT) {
                        console.log('update', deltaT);
                    },
                    draw: function (deltaT, context) {
                        console.log('draw', deltaT, context);
                    }
                });
                */
                var component = VisibleComponent();
                component.visible.setup({
                    position: {
                        x: 0,
                        y: 0
                    },
                    dimension: {
                        width: 125,
                        height: 92
                    },
                    image: {
                        src: 'http://www.spilgames.com/wp-content/themes/spilgames2/images/logo.png',
                        width: 200,
                        height: 100,
                        frameWidth: 100
                    }
                }).then(function () {
                    component.mix({
                        update: function (deltaT) {
                            //console.log('updating', deltaT);
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        },
                        pointerDown: function (e) {
                            console.log('Pointer down: ', e.position);
                        },
                        pointerMove: function (e) {
                            console.log('Pointer move: ', e.position);
                        },
                        pointerUp: function (e) {
                            console.log('Pointer up: ', e.position);
                        }
                    });
                    spyOn(component, 'pointerDown').andCallThrough();
                    spyOn(component, 'pointerMove').andCallThrough();
                    spyOn(component, 'pointerUp').andCallThrough();
                    Game.add(component);
                    setTimeout(function () {
                        Event.fire('glue.pointer.down', {
                            position: {
                                x: 10,
                                y: 20
                            }
                        });
                        Event.fire('glue.pointer.move', {
                            position: {
                                x: 300,
                                y: 230
                            }
                        });
                        Event.fire('glue.pointer.up', {
                            position: {
                                x: 300,
                                y: 230
                            }
                        });
                        expect(component.pointerDown).toHaveBeenCalledWith({
                            position: {
                                x: 10,
                                y: 20
                            }
                        });
                        expect(component.pointerMove).toHaveBeenCalledWith({
                            position: {
                                x: 300,
                                y: 230
                            }
                        });
                        expect(component.pointerUp).toHaveBeenCalledWith({
                            position: {
                                x: 300,
                                y: 230
                            }
                        });
                        done();
                    }, 30);
                });
            });
        });
    }
);
