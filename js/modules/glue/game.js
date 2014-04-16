/*
 *  @module Game
 *  @desc Represents a Glue game
 *  @copyright (C) 2013 SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/game',
    [
        'glue',
        'glue/domready',
        'glue/math/vector',
        'glue/event/system',
        'glue/loader'
    ],
    function (Glue, DomReady, Vector, Event, Loader) {
        'use strict';
        var Sugar = Glue.sugar,
            win = null,
            doc = null,
            gameInfo,
            fps = 60,
            objects = [],
            addedObjects = [],
            removedObjects = [],
            addCallbacks = [],
            removeCallbacks = [],
            lastFrameTime = new Date().getTime(),
            canvas = null,
            canvasId,
            context2D = null,
            useDoubleBuffering = false,
            backBuffer = null,
            backBufferContext2D = null,
            canvasSupported = false,
            canvasDimension = null,
            canvasScale = {},
            scroll = Vector(0, 0),
            isRunning = false,
            isPaused = false,
            debug = false,
            debugBar = null,
            fpsAccumulator = 0,
            fpsTicks = 0,
            fpsMaxAverage = 500000,
            useSort = true,
            sortType = 0,
            gameData = {},
            initCanvas = function () {
                canvas = document.querySelector('#' + canvasId);
                // create canvas if it doesn't exist
                if (canvas === null) {
                    canvas = document.createElement('canvas');
                    canvas.id = canvasId;
                    canvas.width = canvasDimension.width;
                    canvas.height = canvasDimension.height;
                    if (document.getElementById('wrapper') !== null) {
                        document.getElementById('wrapper').appendChild(canvas);    
                    } else {
                        document.body.appendChild(canvas);
                    }
                }
                resizeGame();
                if (canvas.getContext) {
                    canvasSupported = true;
                    context2D = canvas.getContext('2d');
                    if (useDoubleBuffering) {
                        backBuffer = document.createElement('canvas');
                        backBuffer.width = canvas.width;
                        backBuffer.height = canvas.height;
                        backBufferContext2D = backBuffer.getContext('2d');
                    }
                }
                gameData = {
                    canvas: canvas,
                    context: useDoubleBuffering ? backBufferContext2D : context2D,
                    backBufferCanvas: useDoubleBuffering ? backBuffer : canvas,
                    canvasScale: canvasScale,
                    canvasDimension: canvasDimension,
                    scroll: scroll
                };
            },
            resizeGame = function () {
                var canvasRatio = canvas.height / canvas.width,
                    windowRatio = window.innerHeight / window.innerWidth,
                    width,
                    height;

                if (windowRatio < canvasRatio) {
                    height = window.innerHeight;
                    width = height / canvasRatio;
                } else {
                    width = window.innerWidth;
                    height = width * canvasRatio;
                }

                canvasScale.x = width / canvasDimension.width;
                canvasScale.y = height / canvasDimension.height;

                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
            },
            sort = function () {
                if (sortType === game.SORT_TYPE_STABLE) {
                    Sugar.sort.stable.inplace(objects, function (a, b) {
                        return a.z - b.z;
                    });
                } else {
                    // default behavior
                    objects.sort(function (a, b) {
                        return a.z - b.z;
                    });
                }
            },
            addObjects = function () {
                var object,
                    callbackObject,
                    i,
                    j;

                if (addedObjects.length) {
                    for (i = 0; i < addedObjects.length; ++i) {
                        object = addedObjects[i];
                        objects.push(addedObjects[i]);
                        if (object.init) {
                            object.init();
                        }
                    };
                    addedObjects = [];
                    if (addCallbacks.length) {
                        for (j = 0; j < addCallbacks.length; ++j) {
                            callbackObject = addCallbacks[j];
                            if (callbackObject) {
                                callbackObject.callback(callbackObject.object);
                            }
                        };
                        addCallbacks = [];
                    }
                }
            },
            cleanObjects = function () {
                var i;
                // loop objects array from end to start and remove null elements
                for (i = objects.length - 1; i >= 0; --i) {
                    if (objects[i] === null) {
                        objects.splice(i, 1);
                    }
                }
            },
            redraw = function () {
                if (useDoubleBuffering) {
                    backBufferContext2D.clear(true);
                }
                context2D.clear(true);
            },
            cycle = function (time) {
                var deltaT,
                    fps,
                    component,
                    avg,
                    i;

                if (isRunning) {
                    requestAnimationFrame(cycle);
                }
                if (canvasSupported) {
                    // clean before sorting
                    cleanObjects();
                    if (useSort) {
                        sort();
                    }
                    redraw();
                    addObjects();

                    deltaT = (time - lastFrameTime) / 1000;
                    if (debug) {
                        fps = Math.round(1000 / (time - lastFrameTime), 2);
                        fpsAccumulator += fps;
                        ++fpsTicks;
                        avg = Math.round(fpsAccumulator / fpsTicks);
                        if (fpsAccumulator > fpsMaxAverage) {
                            fpsAccumulator = fpsTicks = 0;
                        }
                        debugBar.innerHTML = '<strong>Glue debug bar</strong>';
                        debugBar.innerHTML += '<br />version: 0.9.7';
                        debugBar.innerHTML += '<br />frame rate: ' + fps + ' fps';
                        debugBar.innerHTML += '<br />average frame rate: ' + avg + 'fps';
                        debugBar.innerHTML += '<br />objects: ' + objects.length;
                        if (gameInfo && gameInfo.name) {
                            debugBar.innerHTML += '<br />game name: ' + gameInfo.name;    
                        }
                    }
                    if (deltaT < 1) {
                        gameData.deltaT = deltaT;
                        gameData.fps = fps;
                        gameData.avg = avg;
                        gameData.objectLength = objects.length;
                        for (i = 0; i < objects.length; ++i) {
                            component = objects[i];
                            if (component === null) {
                                continue;
                            }
                            if (component.update && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                                component.update(gameData);
                            }
                            if (component.draw) {
                                component.draw(gameData);
                            }
                        };
                    }
                    if (useDoubleBuffering) {
                        context2D.drawImage(backBuffer, 0, 0);
                    }
                    lastFrameTime = time;
                }
            },
            startup = function () {
                initCanvas();
                setupEventListeners();
                cycle(0);
            },
            pointerDown = function (e) {
                //console.log('Pointer down: ', e.position);
                var i,
                    l,
                    component;

                if (isRunning) {
                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        if (component && component.pointerDown && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                            component.pointerDown(e);
                        }
                    }
                }
            },
            pointerMove = function (e) {
                //console.log('Pointer move: ', e.position);
                var i,
                    l,
                    component;

                if (isRunning) {
                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        if (component && component.pointerMove && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                            component.pointerMove(e);
                        }
                    }
                }
            },
            pointerUp = function (e) {
                //console.log('Pointer up: ', e.position);
                var i,
                    l,
                    component;

                if (isRunning) {
                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        if (component && component.pointerUp && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                            component.pointerUp(e);
                        }
                    }
                }
            },
            addTouchPosition = function (e, isTouchEnd) {
                var touch = !isTouchEnd ? e.targetTouches[0] : e.changedTouches[0];
                e.preventDefault();
                e.position = Vector(
                    (touch.pageX - canvas.offsetLeft) / canvasScale.x,
                    (touch.pageY - canvas.offsetTop) / canvasScale.y
                );
            },
            addMousePosition = function (e) {
                e.position = Vector(
                    (e.clientX - canvas.offsetLeft) / canvasScale.x,
                    (e.clientY - canvas.offsetTop) / canvasScale.y
                );
            },
            touchStart = function (e) {
                e.preventDefault();
                addTouchPosition(e);
                pointerDown(e);
            },
            touchMove = function (e) {
                e.preventDefault();
                addTouchPosition(e);
                pointerMove(e);
            },
            touchEnd = function (e) {
                e.preventDefault();
                addTouchPosition(e, true);
                pointerUp(e);
            },
            mouseDown = function (e) {
                e.preventDefault();
                addMousePosition(e);
                pointerDown(e);
            },
            mouseMove = function (e) {
                e.preventDefault();
                addMousePosition(e);
                pointerMove(e);
            },
            mouseUp = function (e) {
                e.preventDefault();
                addMousePosition(e);
                pointerUp(e);
            },
            setupEventListeners = function () {
                // main input listeners
                if ('ontouchstart' in win) {
                    canvas.addEventListener('touchstart', touchStart);
                    canvas.addEventListener('touchmove', touchMove);
                    canvas.addEventListener('touchend', touchEnd);
                } else {
                    canvas.addEventListener('mousedown', mouseDown);
                    canvas.addEventListener('mousemove', mouseMove);
                    canvas.addEventListener('mouseup', mouseUp);
                }
                // automated test listeners
                Event.on('glue.pointer.down', pointerDown);
                Event.on('glue.pointer.move', pointerMove);
                Event.on('glue.pointer.up', pointerUp);

                // window resize listeners
                window.addEventListener('resize', resizeGame, false);
                window.addEventListener('orientationchange', resizeGame, false);

                // touch device listeners to stop default behaviour
                document.body.addEventListener('touchstart', function (e) {
                    if (e && e.preventDefault) {
                        e.preventDefault();
                    }
                    if (e && e.stopPropagation) {
                        e.stopPropagation();
                    }
                    return false;
                });
                document.body.addEventListener('touchmove', function (e) {
                    if (e && e.preventDefault) {
                        e.preventDefault();
                    }
                    if (e && e.stopPropagation) {
                        e.stopPropagation();
                    }
                    return false;
                });
            },
            shutdown = function () {
                canvas.removeEventListener('touchstart', touchStart);
                canvas.removeEventListener('touchmove', touchMove);
                canvas.removeEventListener('touchend', touchEnd);
                Event.off('glue.pointer.down', pointerDown);
                Event.off('glue.pointer.move', pointerMove);
                Event.off('glue.pointer.up', pointerUp);
                objects = [];
            },
            game = {
                SORT_TYPE_DEFAULT: 0,
                SORT_TYPE_STABLE: 1,
                setup: function (config, onReady) {
                    DomReady(function () {
                        if (isRunning) {
                            throw('Glue: The main game is already running');
                        }
                        isRunning = true;
                        win = window;
                        doc = win.document;
                        // config.canvas is mandatory
                        canvasId = config.canvas.id;
                        canvasDimension = config.canvas.dimension;
                        if (config.game) {
                            gameInfo = config.game;
                        }
                        if (config.develop && config.develop.debug) {
                            debug = true;
                            debugBar = document.createElement('div');
                            debugBar.id = 'debugBar';
                            document.body.appendChild(debugBar);
                        }
                        if (Sugar.isDefined(config.doubleBuffering)) {
                            useDoubleBuffering = config.doubleBuffering;
                        }
                        if (Sugar.isDefined(config.sort)) {
                            useSort = config.sort;
                        }
                        if (Sugar.isDefined(config.sortType)) {
                            sortType = config.sortType;
                        }
                        if (config.asset && config.asset.path) {
                            Loader.setAssetPath(config.asset.path);
                            if (config.asset.image) {
                                Loader.setAssets(Loader.ASSET_TYPE_IMAGE, config.asset.image);
                            }
                            if (config.asset.audio) {
                                if (config.asset.audio.sprite) {
                                    Loader.setAssets(Loader.ASSET_TYPE_AUDIOSPRITE, config.asset.audio.sprite);
                                }
                                Loader.setAssets(Loader.ASSET_TYPE_AUDIO, config.asset.audio);
                            }
                            if (config.asset.json) {
                                Loader.setAssets(Loader.ASSET_TYPE_JSON, config.asset.json);
                            }
                            if (config.asset.binary) {
                                Loader.setAssets(Loader.ASSET_TYPE_BINARY, config.asset.binary);
                            }
                            if (config.asset.spine) {
                                Loader.setAssets(Loader.ASSET_TYPE_SPINE, config.asset.spine);
                            }
                            if (config.asset.remoteImage) {
                                Loader.setAssets(Loader.ASSET_TYPE_IMAGE_REMOTE, config.asset.remoteImage);
                            }
                            Loader.load(function () {
                                startup();
                                if (onReady) {
                                    onReady();
                                }
                            });
                        } else {
                            startup();
                            if (onReady) {
                                onReady();
                            }
                        }
                    });
                },
                shutdown: function () {
                    shutdown();
                    isRunning = false;
                },
                add: function (object, callback) {
                    if (callback) {
                        addCallbacks.push({
                            object: object,
                            callback: callback
                        });
                    }
                    addedObjects.push(object);
                },
                remove: function (object, callback) {
                    var index;
                    if (object === null) {
                        // already destroyed
                        return;
                    }
                    index = objects.indexOf(object);
                    if (index >= 0) {
                        objects[index] = null;
                        if (Sugar.isFunction(object.destroy)) {
                            object.destroy();
                        }
                        if (Sugar.isFunction(callback)) {
                            callback(object);
                        }
                    }
                },
                removeAll: function () {
                    var i;
                    for (i = 0; i < objects.length; ++i) {
                        this.remove(objects[i]);
                    }
                },
                get: function (componentName) {
                    var i,
                        l,
                        component,
                        name;

                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        name = component.getName();
                        if (!Sugar.isEmpty(name) && name === componentName) {
                            return component;
                        }
                    }
                },
                canvas: {
                    getDimension: function () {
                        return canvasDimension;
                    },
                    getScale: function () {
                        return canvasScale;
                    },
                    getContext: function () {
                        return useDoubleBuffering ? context : backBufferContext2D;
                    }
                },
                getObjectCount: function () {
                    return objects.length;
                },
                getScroll: function () {
                    return scroll;
                },
                pause: function (force) {
                    isPaused = true;
                    isRunning = !force;
                },
                resume: function () {
                    isPaused = false;
                    if (!isRunning) {
                        isRunning = true;
                        startup();
                    }
                }
            };
        return game;
    }
);