glue.module.create(
    'glue/game',
    [
        'glue',
        'glue/event/system'
    ],
    function (Glue, Event) {
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
                    document.body.appendChild(canvas);
                }
                if (canvas.getContext) {
                    canvasSupported = true;
                    context2D = canvas.getContext('2d');
                    backBuffer = document.createElement('canvas');
                    backBuffer.width = canvas.width;
                    backBuffer.height = canvas.height;
                    backBufferContext2D = backBuffer.getContext('2d');
                }
            },
            sort = function() {
                components.sort(function(a, b) {
                    return a.z - b.z;
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
            touchStart = function (e) {
                var touch = e.targetTouches[0];
                e.preventDefault();
                e.position = {
                    x: touch.pageX - canvas.offsetLeft,
                    y: touch.pageY - canvas.offsetTop
                };
                pointerDown(e);
            },
            touchMove = function (e) {
                var touch = e.targetTouches[0];
                e.preventDefault();
                e.position = {
                    x: touch.pageX - canvas.offsetLeft,
                    y: touch.pageY - canvas.offsetTop
                };
                pointerMove(e);
            },
            touchEnd = function (e) {
                var touch = e.changedTouches[0];
                e.preventDefault();
                e.position = {
                    x: touch.pageX - canvas.offsetLeft,
                    y: touch.pageY - canvas.offsetTop
                };
                pointerUp(e);
            },
            mouseDown = function (e) {
                e.position = {
                    x: e.clientX - canvas.offsetLeft,
                    y: e.clientY - canvas.offsetTop
                };
                pointerDown(e);
            },
            mouseMove = function (e) {
                e.position = {
                    x: e.clientX - canvas.offsetLeft,
                    y: e.clientY - canvas.offsetTop
                };
                pointerMove(e);
            },
            mouseUp = function (e) {
                e.position = {
                    x: e.clientX - canvas.offsetLeft,
                    y: e.clientY - canvas.offsetTop
                };
                pointerUp(e);
            },
            setupEventListeners = function () {
                if ('ontouchstart' in win) {
                    canvas.addEventListener('touchstart', touchStart);
                    canvas.addEventListener('touchmove', touchMove);
                    canvas.addEventListener('touchend', touchEnd);
                } else {
                    canvas.addEventListener('mousedown', mouseDown);
                    canvas.addEventListener('mousemove', mouseMove);
                    canvas.addEventListener('mouseup', mouseUp);
                }
                Event.on('glue.pointer.down', pointerDown);
                Event.on('glue.pointer.move', pointerMove);
                Event.on('glue.pointer.up', pointerUp);
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
                getDimensions: function () {
                    return canvasDimensions;
                }
            }
        };
    }
);
