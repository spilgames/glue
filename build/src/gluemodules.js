glue.module.create(
    'modules/spilgames/entity/behaviour/clickable',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            var isPressed = false;

            // unbind all events on destroy?!

            Glue.event.on(
                Glue.input.POINTER_DOWN,
                function () {
                    if(obj.isHovering()) {
                        isPressed = true;
                        if (obj.clicked) {
                            obj.clicked();
                        }
                    }
                }
            );
            Glue.event.on(
                Glue.input.POINTER_UP,
                function () {
                    isPressed = false;
                    firstPress = false;
                }
            );

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
