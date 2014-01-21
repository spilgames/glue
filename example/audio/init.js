glue.module.get(
    [
        'glue',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/visible',
        'glue/component/clickable'
    ],
    function (
        Glue,
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Visible,
        Clickable
    ) {
        'use strict';
        var audio = Glue.audio;
        Game.setup({
            game: {
                name: 'Audio'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(600, 600)
            },
            develop: {
                debug: true
            },
            asset: {
                image: {
                    path: 'asset/image/',
                    source: {
                        button: 'button.png'
                    }
                }
            }
        }, function () {
            var Audio = Glue.audio,
                playing = false,
                buttonPosition,
                playButton = BaseObject(Visible, Clickable).add({
                    init: function () {
                        this.visible.setup({
                            position: Vector(0, 0),
                            image: Loader.getAsset('button')
                        });
                        buttonPosition = this.visible.getPosition();
                    },
                    draw: function (deltaT, context) {
                        var value = this.playing ? 'Stop' : 'Play';
                        this.visible.draw(deltaT, context);
                        context.font = '20px Verdana';
                        context.fillText(value, buttonPosition.x + 30, buttonPosition.y + 30);
                    },
                    pointerDown: function (e) {
                        this.clickable.pointerDown(e);
                    },
                    onClick: function (e) {
                        var sound = new Howl({
                            urls: ['asset/audio/thunder.ogg']
                        }).play();
                    }
                });

            Game.add(playButton);
        });
    }
);
