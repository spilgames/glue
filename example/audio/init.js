glue.module.get(
    [
        'glue',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/clickable'
    ],
    function (
        Glue,
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Spritable,
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
                path: 'asset/',
                image: {
                    button: 'button.png'
                },
                audio: {
                    thunder: 'thunder.ogg',
                    sounds: 'sounds.ogg'
                }
            }
        }, function () {
            var Audio = Glue.audio,
                playing = false,
                buttonPosition,
                sound = null,
                playButton = BaseObject(Spritable, Clickable).add({
                    init: function () {
                        this.spritable.setup({
                            position: Vector(0, 0),
                            image: Loader.getAsset('button')
                        });
                        buttonPosition = this.getPosition();
                    },
                    draw: function (gameData) {
                        var value = this.playing ? 'Stop' : 'Play',
                            context = gameData.context;

                        this.base.draw(gameData);
                        context.font = '20px Verdana';
                        context.fillText(value, buttonPosition.x + 30, buttonPosition.y + 30);
                    },
                    onClick: function (e) {
                        if (this.playing) {
                            sound.stop();
                            this.playing = false;
                        } else {
                            // get sound asset from loader
                            sound = Loader.getAsset('thunder');
                            // play the sound
                            sound.play();
                            this.playing = true;
                        }
                    }
                });

            Game.add(playButton);
        });
    }
);
