/*
 *  @module Game
 *  @desc Represents a Glue game
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/game',
    [
        'glue',
        'glue/math/vector',
        'glue/event/system'
    ],
    function (Glue, Vector, Event) {
        var fps = 60,
            components = [],
            addedComponents = [],
            removedComponents = [],
            lastFrame = new Date().getTime(),
            canvas = null,
            canvasId = 0,
            context2D = null,
            backBuffer = null,
            backBufferContext2D = null,
            canvasSupported = false,
            canvasDimension = null,
            canvasScale = {},
            win = null,
            doc = null,
            isRunning = false,
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
                    backBuffer = document.createElement('canvas');
                    backBuffer.width = canvas.width;
                    backBuffer.height = canvas.height;
                    backBufferContext2D = backBuffer.getContext('2d');
                }
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
            sort = function() {
                components.sort(function(a, b) {
                    if (a.visible && b.visible) {
                        return a.visible.z - b.visible.z;
                    }
                });
            },
            addComponents = function () {
                var component;
                if (addedComponents.length) {
                    for (var i = 0; i < addedComponents.length; ++i) {
                        component = addedComponents[i];
                        if (component.init) {
                            component.init();
                        }
                        components.push(addedComponents[i]);
                    };
                    addedComponents = [];
                    sort();
                }
            },
            removeComponents = function () {
                var component;
                if (removedComponents.length) {
                    for (var i = 0; i < removedComponents.length; ++i) {
                        component = removedComponents[i];
                        if (component.destroy) {
                            component.destroy();
                        }
                        components.removeObject(component);
                    };
                    removedComponents = [];
                }
            },
            redraw = function() {
                backBufferContext2D.clearRect(0, 0, backBuffer.width, backBuffer.height);
                context2D.clearRect(0, 0, canvas.width, canvas.height);
            }
            cycle = function () {
                var currentFrame = new Date().getTime(),
                    deltaT = (currentFrame - lastFrame),
                    component;

                requestAnimationFrame(cycle);
                lastFrame = currentFrame;

                sort();

                if (canvasSupported) {
                    redraw();
                    removeComponents();
                    addComponents();

                    for (var i = 0; i < components.length; ++i) {
                        component = components[i];
                        if (component.update) {
                            component.update(deltaT);
                        }
                        if (component.draw) {
                            component.draw(deltaT, backBufferContext2D);
                        }
                    };
                    context2D.drawImage(backBuffer, 0, 0);
                }
            },
            startup = function () {
                cycle();
            },
            pointerDown = function (e) {
                //console.log('Pointer down: ', e.position);
                var i,
                    l,
                    component;

                for (i = 0, l = components.length; i < l; ++i) {
                    component = components[i];
                    if (component.pointerDown) {
                        component.pointerDown(e);
                    }
                }
            },
            pointerMove = function (e) {
                //console.log('Pointer move: ', e.position);
                var i,
                    l,
                    component;

                for (i = 0, l = components.length; i < l; ++i) {
                    component = components[i];
                    if (component.pointerMove) {
                        component.pointerMove(e);
                    }
                }
            },
            pointerUp = function (e) {
                //console.log('Pointer up: ', e.position);
                var i,
                    l,
                    component;

                for (i = 0, l = components.length; i < l; ++i) {
                    component = components[i];
                    if (component.pointerUp) {
                        component.pointerUp(e);
                    }
                }
            },
            addTouchPosition = function (e) {
                var touch = e.targetTouches[0];
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
                addTouchPosition(e);
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
            };

        return {
            setup: function (config, onReady) {
                if (isRunning) {
                    throw('Glue: The main game is already running');
                }
                isRunning = true;
                win = window;
                doc = win.document;
                canvasId = config.canvas.id;
                canvasDimension = config.canvas.dimension
                initCanvas();
                setupEventListeners();
                startup();
                if (onReady) {
                    onReady();
                }
            },
            add: function (component) {
                addedComponents.push(component);
            },
            remove: function (component) {
                removedComponents.push(component);
            },
            get: function (componentName) {
                var i,
                    l,
                    component;

                for (i = 0, l = components.length; i < l; ++i) {
                    component = components[i];
                    if (component.name === componentName) {
                        return component;
                    }
                }
            },
            canvas: {
                getDimension: function () {
                    return canvasDimension;
                }
            }
        };
    }
);
