/**
 *  @desc Tests for visible components
 *  @copyright © 2013 - SpilGames
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

            it('Should be able to create a visible component which gets drawn and updated',
                function (done) {
                var visibleComponent = VisibleComponent(0, 0, {});
                gg.add(visibleComponent);

                spyOn(visibleComponent, 'update');
                spyOn(visibleComponent, 'draw');
                setTimeout(function () {
                    expect(visibleComponent.update).toHaveBeenCalled();
                    expect(visibleComponent.draw).toHaveBeenCalled();
                    done();
                }, 100);
            });
        });
    }
);
