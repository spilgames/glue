/**
 *  @desc Tests for visible components
 *  @copyright (C) 2013 Jeroen Reurings, SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue',
        'glue/game',
        'glue/component/visible'
    ],
    function (Glue, Game, VisibleComponent) {
        describe('glue.component.visible', function () {
            'use strict';

            it('Should be able to create a visible component using an image', function (done) {
                /*
                // This is amazing
                Game.add({
                    update: function (deltaT) {
                        console.log('updating', deltaT);
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
                    Game.add(component.mix({
                        update: function (deltaT) {
                            //console.log('updating', deltaT);
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    }));
                });
                done();
            });
        });
    }
);
