/**
 *  @desc Tests for base components
 *  @copyright © 2013 - The SpilGames Authors
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
                var baseComponent = BaseComponent();
                gg.add(baseComponent);

                setTimeout(function () {
                    expect(baseComponent.base.update).toHaveBeenCalled();
                    done();
                }, 100);
            });
        });
    }
);
