/**
 *  @desc Tests for MelonJS adapter
 *  @author Marco Colombo
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
(function (MelonJSAdapter, MelonJS) {
    describe('base.glue.adapters.melonJS', function () {
        'use strict';

        describe('Audio', function () {
            describe('.audio.init', function () {
                it('Shoud be able to initialize MelonJS audio system', function () {
                    expect(MelonJSAdapter.audio.init('mp3,ogg')).toEqual(true);
                });
            });
        });

        describe('Events', function () {
            describe('.event.on / .event.fire', function () {
                it('Shoud be able to subscribe and fire MelonJS events', function () {
                    var result = false;
                    var testCallback = function () { 
                        result = true;
                    }
                    MelonJSAdapter.event.on('testEvent', testCallback);
                    MelonJSAdapter.event.fire('testEvent');
                    
                    expect(result).toEqual(true);
                });
            });
            describe('.event.off', function () {
                it('Shoud be able to unsubscribe MelonJS events', function () {
                    var result = false;
                    var testCallback = function () { 
                        result = true;
                    }
                    MelonJSAdapter.event.on('testEvent', testCallback);
                    MelonJSAdapter.event.off('testEvent', testCallback);
                    MelonJSAdapter.event.fire('testEvent');

                    expect(result).toEqual(false);
                });
            });
        });
        describe('Level manager', function () {
            describe('.levelManager.loadLevel', function () {
                it('Shoud be able to load a level', function () {
                    spyOn(MelonJSAdapter.levelManager, 'loadLevel');
                    MelonJSAdapter.levelManager.loadLevel('levelName');
                    
                    expect(MelonJSAdapter.levelManager.loadLevel).toHaveBeenCalled();
                });
            });
            describe('.levelManager.unloadLevel', function () {
                it('Shoud be able to unload a level', function () {
                    spyOn(MelonJSAdapter.levelManager, 'unloadLevel');
                    MelonJSAdapter.levelManager.unloadLevel();
                    
                    expect(MelonJSAdapter.levelManager.unloadLevel).toHaveBeenCalled();
                });
            });
        });

        describe('Loader', function () {
            describe('.loader.setLoadCallback', function () {
                it('Shoud be able to set the callback function of the loader', function () {
                    var result;
                    var testCallback = function () { 
                        result = true;
                    }
                    result = MelonJSAdapter.loader.setLoadCallback(testCallback);

                    expect(result).toEqual(testCallback);
                });
            });
            describe('.loader.preload', function () {
                it('Shoud be able to call the preload function of MelonJS', function (done) {
                    var testCallback = function () { 
                        expect(true).toEqual(true);
                        done();
                    }
                    MelonJSAdapter.event.on(MelonJS.event.LOADER_COMPLETE, testCallback);
                    MelonJSAdapter.loader.preload({});
                });
            });
        });

        describe('Plugin', function () {
            describe('.register', function () {
                it('Shoud be able to register a MelonJS plugin', function () {
                    var args = {};
                    spyOn(MelonJSAdapter.plugin.register, 'apply');
                    MelonJSAdapter.plugin.register.apply(null, args);
                    
                    expect(MelonJSAdapter.plugin.register.apply).toHaveBeenCalled();
                });
            });
        });

        describe('State', function () {
            describe('.change', function () {
                it('Shoud be able to change a MelonJS state', function () {
                    var args = {};
                    spyOn(MelonJSAdapter.state.change, 'apply');
                    MelonJSAdapter.state.change.apply(null, args);
                    
                    expect(MelonJSAdapter.state.change.apply).toHaveBeenCalled();
                });
            });

            describe('.set', function () {
                it('Shoud be able to set a MelonJS state', function () {
                    var state = {},
                        gameObjects = {};
                    spyOn(MelonJSAdapter.state.set, 'apply');
                    MelonJSAdapter.state.set.apply(state, gameObjects);
                    
                    expect(MelonJSAdapter.state.set.apply).toHaveBeenCalled();
                });
            });
        });

        describe('Video', function () {
            describe('.init', function () {
                it('Shoud be able to initialize the video, using MelonJS', function () {
                    var result = false,
                        containderId = 'testVideo',
                        dimensions = {
                            width: 10,
                            height: 10
                        };
                    result = MelonJSAdapter.video.init(containderId, dimensions);
                    
                    expect(result).toEqual(true);
                });
            });
        });
    });
}(adapters.melonjs, me));
