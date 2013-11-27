/**
 *  @desc Tests for mixin components
 *  @copyright © 2013 - The SpilGames Authors
 */
glue.module.create(
    [
        'glue'
    ],
    function (Glue) {
        describe('glue.component.create', function () {
            'use strict';

            it('Should be able to create an automatically mixed component', function (done) {
                glue.module.create('test.player', function () {
                    return function (obj) {
                        var message = 'success';
                        return obj.mix({
                            update: function (deltaT) {
                                this.base.update(deltaT);
                                this.visible.update(deltaT);
                            },
                            draw: function (deltaT, context) {
                                this.visible.draw(deltaT, context);
                            },
                            playerMethod: function () {
                                return message;
                            },
                            base: obj.base,
                            visible: obj.visible
                        });
                    };
                });
                Glue.component().create(
                    [
                        'glue/component/base',
                        'glue/component/visible',
                        'test.player'
                    ],
                    function (obj) {
                        expect(obj.base.update).toBeTruthy();
                        expect(obj.visible.update).toBeTruthy();
                        expect(obj.visible.draw).toBeTruthy();
                        expect(obj.playerMethod()).toEqual('success');
                        done();
                    }
                );
            });

            it('Should be able to create an automatically mixed component and call mixed methods',
                function (done) {
                var mixin1Spy = jasmine.createSpy('mixin1spy'),
                    mixin2Spy = jasmine.createSpy('mixin2spy');

                glue.module.create('test.mixed', function () {
                    return function (obj) {
                        return obj.mix({
                            update: function (deltaT) {
                                this.testMixin1.update(deltaT);
                            },
                            draw: function (deltaT, context) {
                                this.testMixin2.draw(deltaT, context);
                            }
                        });
                    };
                });
                glue.module.create(
                    'test.mixin1',
                    [
                        'glue'
                    ],
                    function (Glue) {
                        return function (obj) {
                            obj = obj || {};
                            obj.testMixin1 = {
                                update: function (deltaT) {
                                    mixin1Spy(deltaT);
                                }
                            };
                            return obj;
                        };
                    }
                );
                glue.module.create(
                    'test.mixin2',
                    [
                        'glue'
                    ],
                    function (Glue) {
                        return function (obj) {
                            obj = obj || {};
                            obj.testMixin2 = {
                                draw: function (deltaT, context) {
                                    mixin2Spy(deltaT, context);
                                }
                            };
                            return obj;
                        };
                    }
                );
                Glue.component().create(
                    [
                        'test.mixin1',
                        'test.mixin2'
                    ],
                    function (obj) {
                        glue.module.get(['test.mixed'], function (MixedModule) {
                            var mixedModule = MixedModule(obj);
                            gg.add(mixedModule);
                            setTimeout(function () {
                                expect(mixin1Spy).toHaveBeenCalledWith(jasmine.any(Number));
                                expect(mixin2Spy).toHaveBeenCalledWith(jasmine.any(Number), jasmine.any(Object));
                                done();
                            }, 100);
                        });
                    }
                );
            });

            it('Should be able to create a manually mixed component and call mixed methods', function (done) {
                glue.module.create(
                    'mixed',
                    [
                        'glue',
                        'glue/component/base',
                        'glue/component/visible'
                    ],
                    function (Glue, BaseComponent, VisibleComponent) {
                        return function (config) {

                            var obj = {
                                update: function (deltaT) {
                                    this.base.update(deltaT);
                                    this.visible.update(deltaT);
                                },
                                draw: function (deltaT, context) {
                                    this.visible.draw(deltaT, context);
                                }
                            };
                            BaseComponent(obj);
                            VisibleComponent(obj);
                            return obj;
                        };
                    }
                );
                glue.module.get(['mixed'], function(MixedModule) {
                    var mixedModule = MixedModule({});
                    spyOn(mixedModule, 'update');
                    gg.add(mixedModule);
                    setTimeout(function () {
                        expect(mixedModule.update).toHaveBeenCalledWith(jasmine.any(Number));
                        expect(mixedModule.base.update).toBeTruthy();
                        expect(mixedModule.visible.update).toBeTruthy();
                        expect(mixedModule.visible.draw).toBeTruthy();
                        done();
                    }, 100);
                });
            });

        });
    }
);
