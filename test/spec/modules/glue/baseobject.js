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
            it('Should be able to add children objects to a base object', function (done) {
                var initialized = false,
                    object = BaseObject().add({
                        init: function () {
                            // init should be called during addChild
                            initialized = true;
                        },
                        update: function () {
                            expect(initialized).toBeTruthy();
                            done();
                        }
                    }),
                    parent = BaseObject().add({
                        init: function () {
                            this.addChild(object);
                        }
                    });

                Game.add(parent);
            });
            it('Should be able to remove children from a base object', function (done) {
                var destroyed = false,
                    object = BaseObject().add({
                        destroy: function () {
                            // destroy method should be called after removeChild
                            destroyed = true;
                        }
                    }),
                    parent = BaseObject().add({
                        update: function (gameData) {
                            var children = this.getChildren();
                            // remove if children are present
                            if (children.length > 0) {
                                this.removeChild(object);
                            } else {
                                // no more children
                                expect(destroyed).toBeTruthy();
                                done();
                            }
                            // make sure you call the base update
                            this.base.update(gameData);
                        }
                    });

                parent.addChild(object);

                Game.add(parent);
            });
        });
    }
);