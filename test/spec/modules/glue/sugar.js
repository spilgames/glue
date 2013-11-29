/**
 *  @desc Tests for Sugar module
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
(function (Sugar, win, doc) {
    'use strict';
    describe('base.glue.sugar', function() {
        it('should be able to get an empty function', function () {
            expect(Sugar.emptyFn).toEqual(jasmine.any(Function));
        });

        describe('.isString', function() {
            it('returns true if parameter is of type String', function() {
                expect(Sugar.isString('my string')).toBeTruthy();
            });
            it('returns false if the parameter is not of type String', function() {
                expect(Sugar.isString(123)).toBeFalsy();
            });
        });

        describe('isDate', function() {
            it('returns true if the parameter is of type Date', function() {
                expect(Sugar.isDate(new Date())).toBeTruthy();
            });
            it('returns false if the parameter is not of type Date', function() {
                expect(Sugar.isDate(123)).toBeFalsy();
            });
        });

        describe('.isNumber', function() {
            it('returns true if the parameter is of type Number', function() {
                expect(Sugar.isNumber(123)).toBeTruthy();
            });
            it('returns false if the parameter is not of type Number', function() {
                expect(Sugar.isNumber('asd')).toBeFalsy();
            });
        });

        describe('.isBoolean', function() {
            it('returns true if the parameter is of type Boolean', function() {
                expect(Sugar.isBoolean(true)).toBeTruthy();
            });
            it('returns false if the parameter is not of type Boolean', function() {
                expect(Sugar.isBoolean('asd')).toBeFalsy();
            });
        });

        describe('.isArray', function() {
            it('returns true if the parameter is an array', function() {
                var arr = [];
                expect(Sugar.isArray(arr)).toBeTruthy();
            });
            it('returns false if the parameter is not an array', function() {
                expect(Sugar.isArray('asd')).toBeFalsy();
            });
        });

        describe('.isObject', function() {
            it('returns true if the parameter is an object', function() {
                var obj = {};
                expect(Sugar.isObject(obj)).toBeTruthy();
            });
            it('returns false if the parameter is not an object', function() {
                expect(Sugar.isObject('asd')).toBeFalsy();
            });
        });

        describe('.isFunction', function() {
            it('returns true if the parameter is a function', function() {
                expect(Sugar.isFunction(function(){})).toBeTruthy();
            });
            it('returns false if the parameter is not a function', function() {
                expect(Sugar.isFunction('asd')).toBeFalsy();
            });
        });

        describe('.has', function() {
            it('returns true if an object has a specific property', function() {
                var ref = {asd: 123};
                expect(Sugar.has(ref, 'asd')).toBeTruthy();
            });
            it('returns false if an object does not have a specific property', function() {
                var ref = {asd: 123};
                expect(Sugar.has(ref, 'qwe')).toBeFalsy();
            });
        });

        describe('.isUndefined', function() {
            it('returns true if the parameter is undefined', function() {
                expect(Sugar.isUndefined(undefined)).toBeTruthy();
            });
            it('returns false if the parameter is not undefined', function() {
                expect(Sugar.isUndefined('asd')).toBeFalsy();
            });
        });

        describe('.isDefined', function() {
            it('returns true if the parameter is defined', function() {
                expect(Sugar.isDefined(123)).toBeTruthy();
            });
            it('returns false if the parameter is undefined', function() {
                expect(Sugar.isDefined(undefined)).toBeFalsy();
            });
        });

        describe('.isEmpty', function() {
            it('returns true for falsy parameters', function() {
                var params = [
                    null,
                    undefined,
                    0,
                    false,
                ],
                i;

                for (i = 0; i < params.length; ++i) {
                    expect(Sugar.isEmpty(params[i])).toBeTruthy();
                }
            });
            it('returns true for empty objects and arrays', function() {
                var emptyArr = [];
                var emptyObj = {};
                expect(Sugar.isEmpty(emptyArr)).toBeTruthy();
                expect(Sugar.isEmpty(emptyObj)).toBeTruthy();
            });
        });

        describe('.combine', function() {
            it('returns an array with values from arr2 concatenated to arr1 if the parameters are arrays', function() {
                var arr1 = [1,2];
                var arr2 = [3,4]; 
                expect(Sugar.combine(arr1, arr2)).toEqual([1,2,3,4]);
            });
            it('returns an object with properties from obj2 added to obj1 if the parameters are objects, overwriting property in obj1', function() {
                var obj1 = {asd: 123, zxc: []};
                var obj2 = {asd: 456, qwe: 'asd'};
                var expected = {asd: 456, qwe: 'asd', zxc: []};
                
                expect(Sugar.combine(obj1, obj2)).toEqual(expected);
            });
            it('returns the first parameter if one parameter is an object and other one is an array', function() {
                var param1 = [1,2];
                var param2 = {asd: 123};
                
                expect(Sugar.combine(param1, param2)).toEqual(param1);
            });
        });

        describe('.imports', function () {
            it('Should be able to import modules', function () {
                win['DraggableEntity'] = function () { return { test: 'draggable' }; };
                win['DroptargetEntity'] = function () { return { test: 'droptarget' }; };
                Sugar.imports([
                    'DraggableEntity',
                    'DroptargetEntity'
                ],
                function (DraggableEntity, DroptargetEntity) {
                    var draggable = DraggableEntity({}),
                        dropTarget = DroptargetEntity({});

                    expect(draggable.test).toEqual('draggable');
                    expect(dropTarget.test).toEqual('droptarget');
                });
            });
            it('Should be able to import modules from multilevel namespaces', function () {
                win.test = {};
                win.test.game = {};
                win.test.game.entities = {};
                win.level1 = {};
                win.level1.level2 = {};
                win.level1.level2.level3 = {};
                win.level1.level2.level3.elements = {};
                win.test.game.entities.Player = function () { return { test: 'Player' }; };
                win.test.game.entities.Friend = function () { return { test: 'Friend' }; };
                win.level1.level2.level3.elements.Element = function () { return { test: 'Element' }; };
                Sugar.imports([
                    'test.game.entities.Player',
                    'test.game.entities.Friend',
                    'level1.level2.level3.elements.Element'
                ],
                function (Player, Friend, Element) {
                    var player = Player({}),
                        friend = Friend({}),
                        element = Element({});

                    expect(player.test).toEqual('Player');
                    expect(friend.test).toEqual('Friend');
                    expect(element.test).toEqual('Element');
                });
            });
            it('Should throw an error when a module can\'t be found', function () {
                expect(function () {
                    Sugar.imports([
                        'NonExistingModule'
                    ],
                    function () {});
                }).toThrow('glue.sugar.imports: Module NonExistingModule not found or not a function');
            });
        });
        
        describe('.contains', function() {
            it('returns true if a string contains another string', function() {
                var str = 'asdqwe';
                var search = 'dq';
                
                expect(Sugar.contains(str, search)).toBeTruthy();
            });
            it('returns false if a string does not contain another string', function() {
                var str = 'asdqwe';
                var search = 'jh';
                
                expect(Sugar.contains(str, search)).toBeFalsy();
            });
            it('returns true if an array contains a specific element', function() {
                var arr = [1, 2, 3];
                var search = 2;
                
                expect(Sugar.contains(arr, search)).toBeTruthy();
            });
            it('returns false if an array does not contain a specific element', function() {
                var arr = [1, 2, 3];
                var search = 4;
                
                expect(Sugar.contains(arr, search)).toBeFalsy();
            });
            it('returns true if an object has a property with a specific value', function() {
                var obj = {asd: 123};
                var search = 'asd';
                
                expect(Sugar.contains(obj, search)).toBeTruthy();
            });
            it('returns false if an object does not have a property with a specific value', function() {
                var obj = {asd: 123};
                var search = 'qwe';
                
                expect(Sugar.contains(obj, search)).toBeFalsy();
            });
        });

        describe('classList', function () {
            var domElement = document.createElement('div'),
                reset = function () {
                    domElement.className = '';
                };
            afterEach(reset);
            describe('.addClass', function () {
                it('Shoud be able to add a new class to a DOM element', function () {
                    Sugar.addClass(domElement, 'class');
                    expect(domElement.className).toEqual('class');
                });
                it('Shoud be able to add multiple classes to a DOM element', function () {
                    Sugar.addClass(domElement, ['class', 'anotherClass', 'yetAnotherClass']);
                    expect(domElement.className).toEqual('class anotherClass yetAnotherClass');
                }); 
            });
            describe('.containsClass', function () {
                it('Shoud be able to check if a DOM element contains a certain class', function () {
                    Sugar.addClass(domElement, 'containsClass');
                    expect(Sugar.containsClass(domElement, 'containsClass')).toBeTruthy();
                });
            });
            describe('.removeClass', function () {
                it('Shoud be able to remove a class from a DOM element', function () {
                    domElement.className = 'one two three';
                    Sugar.removeClass(domElement, 'two');
                    expect(domElement.className).toEqual('one three');
                });
            });
            describe('.removeClasses', function () {
                it('Shoud be able to remove a class from a DOM element', function () {
                    domElement.className = 'one two three';
                    Sugar.removeClasses(domElement);
                    expect(domElement.className).toEqual('');
                });
            });
            describe('.toggleClass', function () {
                it('Shoud remove a class when it already exists', function () {
                    domElement.className = 'one two three';
                    Sugar.toggleClass(domElement, 'three');
                    expect(domElement.className).toEqual('one two');
                });
                it('Shoud add a class when it doesn\'t exists yet', function () {
                    domElement.className = 'one two three';
                    Sugar.toggleClass(domElement, 'four');
                    expect(domElement.className).toEqual('one two three four');
                });
            });
            // prototype chain
            describe('.mix', function () {
                it('Should be able to mix basic modules', function () {
                    var module1 = (function () {
                        return {
                            test1: function () {
                                return 'test1';
                            },
                            test2: function () {
                                return 'test2';
                            }
                        };
                    }());
                    var module2 = (function () {
                        return {
                            test3: function () {
                                return 'test3';
                            },
                            test4: function () {
                                return 'test4';
                            }
                        };
                    }());
                    var mixin = module1.mix(module2);
                    expect(mixin.test1()).toEqual('test1');
                    expect(mixin.test2()).toEqual('test2');
                    expect(mixin.test3()).toEqual('test3');
                    expect(mixin.test4()).toEqual('test4');
                });
                it('Should be able to mix in new abilities', function () {
                    var base = (function () {
                        return function () {
                            return {
                                base1: function () {
                                    return 'base1';
                                },
                                base2: function () {
                                    return 'base2';
                                }
                            }
                        };
                    }());
                    var move = (function () {
                        return function (obj) {
                            obj.mix({
                                run: function () {
                                    return 'running';
                                },
                                walk: function () {
                                    return 'walking';
                                }
                            });
                        };
                    }());
                    var mixedEntity = (function (Base, Move) {
                        return function (x, y, settings) {
                            var postion = {
                                    x: x,
                                    y: y
                                },
                                base = Base(),
                                move = base.mix(Move(base)),
                                obj = base.mix({
                                    custom1: function () {
                                        return 'custom1';
                                    },
                                    custom2: function () {
                                        return 'custom2';
                                    },
                                    getPosition: function () {
                                        return postion;
                                    }
                                });
                            return obj;
                        };
                    }(base, move));

                    var entity = mixedEntity(200, 100);

                    expect(entity.base1()).toEqual('base1');
                    expect(entity.base2()).toEqual('base2');
                    expect(entity.run()).toEqual('running');
                    expect(entity.walk()).toEqual('walking');
                    expect(entity.custom1()).toEqual('custom1');
                    expect(entity.custom2()).toEqual('custom2');
                    expect(entity.getPosition().x).toEqual(200);
                    expect(entity.getPosition().y).toEqual(100);
                });
            });
        });
    });
}(adapters.glue.sugar, window, window.document));
