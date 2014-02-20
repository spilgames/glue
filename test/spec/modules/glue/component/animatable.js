/**
 *  @desc Animatable specs
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create([
    'glue/game',
    'glue/math/vector',
    'glue/math/dimension',
    'glue/math/rectangle',
    'glue/loader',
    'glue/baseobject',
    'glue/component/animatable'
],
function (Game, Vector, Dimension, Rectangle, Loader, BaseObject, Animatable) {
    describe('modules.glue.component.animatable', function () {
        'use strict';

        it('setup', function (done) {
            Game.setup({
                game: {
                    name: 'Animatable Spec'
                },
                canvas: {
                    id: 'canvas',
                    dimension: Dimension(800, 600)
                },
                develop: {
                    debug: true
                },
                asset: {
                    path: '../example/',
                    image: {
                        dog: 'dog-sit.png'
                    }
                }
            }, function () {
                done();
            });
        });

        it('test', function () {
            var dog = BaseObject(Animatable).add({
                init: function () {
                    this.animatable.setup({
                        position: Vector(10, 10),
                        image: Loader.getAsset('dog'),
                        animation: {
                            frameCount: 8,
                            fps: 8,
                            animations: {
                                wiggleTail: {
                                    startFrame: 1,
                                    endFrame: 8
                                }
                            }
                        }
                    });
                    this.animatable.setAnimation('wiggleTail');
                },
                draw: function (deltaT, context) {
                    this.animatable.draw(deltaT, context);
                }
            });
            Game.add(dog);
        });
    });
});