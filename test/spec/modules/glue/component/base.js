/**
 *  @desc Tests for base components
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    [
        'glue',
        'glue/component/base'
    ],
    function (Glue, BaseComponent) {
        describe('glue.component.base', function () {
            'use strict';

            it('Should be able to create a base component which gets updated', function (done) {
                var baseComponent = BaseComponent(0, 0, {});
                gg.add(baseComponent);
                spyOn(baseComponent, 'update');
                setTimeout(function () {
                    expect(baseComponent.update).toHaveBeenCalled();
                    done();
                }, 100);
            });
        });
    }
);
