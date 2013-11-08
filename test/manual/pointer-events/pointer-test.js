(function (MelonJSAdapter, MelonJS) {
    window.onReady(function onReady () {
        var debugString = 'Pointer position: ',
            pressed = false,
            released = false,
            debugMessage = document.getElementById('debugMessage');

            pointerDownCallback = function (evt) {
                pressed = true;
                released = false;
                debugMessage.innerHTML = debugString + ' PRESSED';
            },
            pointerUpCallback = function (evt) {
                pressed = false;
                released = true;
                debugMessage.innerHTML = debugString + ' RELEASED';
            },
            pointerMoveCallback = function (evt) {
                pointerString = 'Pointer position: ' + 
                    Math.round(evt.gameX) + 
                    ',' + 
                    Math.round(evt.gameY);

                if (pressed) {
                    debugString = pointerString + ' PRESSED';
                } else if (released) {
                    debugString = pointerString + ' RELEASED';
                    released = false;
                }else{
                    debugString = pointerString;
                }
                debugMessage.innerHTML = debugString;
            };
        
        MelonJSAdapter.event.on(MelonJSAdapter.input.POINTER_UP, pointerUpCallback);
        MelonJSAdapter.event.on(MelonJSAdapter.input.POINTER_DOWN, pointerDownCallback);
        MelonJSAdapter.event.on(MelonJSAdapter.input.POINTER_MOVE, pointerMoveCallback);
    });
}(adapters.melonjs, window.me));
