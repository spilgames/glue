glue.module.create(
    'glue/component/visible',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            var position = {
                    x: 0,
                    y: 0
                },
                dimension = {
                    width: 0,
                    height: 0
                },
                image = {},
                frameCount,
                frame = 1;

            obj = obj || {};
            obj.visible = {
                setup: function (settings) {
                    settings = settings || {};
                    if (settings.dimension) {
                        dimension = settings.dimension;
                    }
                    if (settings.position) {
                        position = settings.position;
                    }
                    if (settings.image) {
                        image = settings.image;
                    }
                    image.obj = new Image(),
                    image.loaded = false;
                    image.obj.src = image.src;
                    image.obj.addEventListener('load', function () {
                        image.loaded = true;
                    }, false);
                    // This should also work for multi line animation sheets
                    frameCount = dimension.width / image.frameWidth;
                },
                update: function (deltaT) {
                    //console.log('update', deltaT)
                },
                draw: function (deltaT, context) {
                    if (image.loaded) {
                        context.drawImage(image.obj, position.x, position.y)
                    }
                },
                position: position,
                getDimension: function () {
                    return dimension;
                }
            };
            return obj;
        };
    }
);
