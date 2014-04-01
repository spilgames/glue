/**
 *  @desc Baseobject
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue/game',
        'glue/baseobject'
    ],
    function (Game, BaseObject) {
        describe('modules.glue.baseobject', function () {
            'use strict';

            it('Should be able to create a valid base object', function (done) {
                var object = BaseObject().add({
                    init: function () {},
                    update: function () {},
                    draw: function () {}
                });
                spyOn(object, 'init');
                spyOn(object, 'update');
                spyOn(object, 'draw');

                Game.add(object);

                setTimeout(function () {
                    expect(object.init).toHaveBeenCalled();
                    expect(object.update).toHaveBeenCalled();
                    expect(object.draw).toHaveBeenCalled();
                    done();
                }, 300);
            });
        });
    }
);