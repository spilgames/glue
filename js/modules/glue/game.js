glue.module.create(
    'glue/game',
    [
        'glue'
    ],
    function (Glue) {
        return function (window, canvasId) {
            var fps = 60,
                components = [],
                addedComponents = [],
                removedComponents = [],
                lastFrame = new Date().getTime(),
                canvas,
                context2D,
                backBuffer,
                backBufferContext2D,
                canvasSupported,
                doc = window.document,
                initCanvas = function () {
                    canvas = document.querySelector('#' + canvasId);
                    // creat canvas if it doesn't exist
                    if (canvas === null) {
                        canvas = document.createElement('canvas');
                        canvas.id = canvasId;
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
                setEvents = function () {
                    doc.addEventListener('keydown', function (e) {
                        GameLoop.keyDown(e);
                    });
                    doc.addEventListener('keyup', function (e) {
                        GameLoop.keyUp(e);
                    });
                    canvas.addEventListener('click', function (e) {
                        GameLoop.mouseClick(e);
                    });
                },
                sort = function() {
                    components.sort(function(a, b) {
                        return a.z - b.z;
                    });
                },
                addComponents = function () {
                    if (addedComponents.length) {
                        for (var i = 0; i < addedComponents.length; ++i) {
                            components.push(addedComponents[i]);
                        };
                        addedComponents = [];
                        sort();
                    }
                },
                removeComponents = function () {
                    if (removedComponents.length) {
                        for (var i = 0; i < removedComponents.length; ++i) {
                            components.removeObject(removedComponents[i]);
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
                    setInterval(function () {
                        cycle();
                    }, fps);
                };

            initCanvas();
            setEvents();
            startup();

            var GameLoop = {};
            GameLoop.keyDown = function (e) {
                //log('Key down: ' + e);
                for (var i = 0; i < components.length; ++i) {
                    if (components[i].keyDown) {
                        components[i].keyDown(e);
                    }
                }
            }
            GameLoop.keyUp = function (e) {
                //log('Key up: ' + e);
                for (var i = 0; i < components.length; ++i) {
                    if (components[i].keyUp) {
                        components[i].keyUp(e);
                    }
                }
            }
            GameLoop.mouseClick = function (e) {
                //log('Mouse click: ' + e);
                for (var i = 0; i < components.length; ++i) {
                    if (components[i].mouseClick) {
                        components[i].mouseClick(getMousePosition(e));
                    }
                }
            }

            return {
                add: function (component) {
                    addedComponents.push(component);
                },
                remove: function (component) {
                    removedComponents.push(component);
                }
            }
        }
    }
);
