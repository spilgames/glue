/**
 *  @desc Visible
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue/game',
        'glue/loader',
        'glue/baseobject',
        'glue/component/visible'
    ],
    function (Game, Loader, BaseObject, Visible) {
        describe('modules.glue.component.visible', function () {
            'use strict';

            it('Should be able to create a valid visible component', function (done) {
                var component = BaseObject(Visible).add({
                        init: function () {
                            this.visible.setup({
                                image: Loader.getAsset('glue')
                            });
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    });

                spyOn(component, 'init').andCallThrough();
                spyOn(component, 'draw').andCallThrough();

                Game.add(component);

                setTimeout(function () {
                    expect(component.init).toHaveBeenCalled();
                    expect(component.draw).toHaveBeenCalledWith(
                        jasmine.any(Number),
                        jasmine.any(Object),
                        jasmine.any(Object)
                    );
                    done();
                }, 300);
            });
        });
    }
);