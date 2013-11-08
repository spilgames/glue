glue.module.create(
    'modules/spilgames/entity/behaviour/clickable',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            var isPressed = false,
                onPointerUp = function () {
                    isPressed = false;
                },
                onPointerDown = function () {
                    if(obj.isHovering()) {
                        isPressed = true;
                        // call the clicked method if it exists
                        if (obj.clicked) {
                            obj.clicked();
                        }
                    }
                },
                setupEvents = function () {
                    Glue.event.on(Glue.input.POINTER_DOWN, onPointerDown);
                    Glue.event.on(Glue.input.POINTER_UP, onPointerUp);
                },
                tearDownEvents = function () {
                    Glue.event.off(Glue.input.POINTER_DOWN, onPointerDown);
                    Glue.event.off(Glue.input.POINTER_UP, onPointerUp);
                };

            setupEvents();

            return obj.mix({
                isPressed: function () {
                    return isPressed;
                }
            });
        };
    }
);

glue.module.create(
    'modules/spilgames/entity/behaviour/hoverable',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            var isHovering = false,
                onPointerMove = function (evt) {
                    var pointerPosition = {
                        x: evt.gameX,
                        y: evt.gameY
                    };
                    if (pointerPosition.x >= obj.pos.x && 
                        pointerPosition.x <= (obj.pos.x + obj.width) &&
                        pointerPosition.y >= obj.pos.y && 
                        pointerPosition.y <= (obj.pos.y + obj.height)) {
                        isHovering = true;
                        if (obj.hovered) {
                            obj.hovered();
                        }
                    } else {
                        isHovering = false;
                    }
                };

            Glue.event.on(
                Glue.input.POINTER_MOVE,
                onPointerMove
            );
            return obj.mix({
                isHovering: function () {
                    return isHovering;
                }
            });
        };
    }
);
