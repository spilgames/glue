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
