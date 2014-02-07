glue.module.get(
    [
        'glue',
        'glue/game',
        'glue/loader',
        'glue/math',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/visible',
        'glue/component/tweenable'
    ],
    function (
        Glue,
        Game,
        Loader,
        Mathemetics,
        Dimension,
        Vector,
        BaseObject,
        Visible,
        Tweenable
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Tweening'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(1024, 768)
            },
            develop: {
                debug: true
            },
            asset: {
                image: {
                    path: 'asset/',
                    source: {
                        logoLD: 'glue-logo-ld.png'
                    }
                }
            }
        }, function () {
            var Sugar = Glue.sugar,
                mathematics = Mathemetics(),
                position,
                dimension,
                currentTime = 0,
                startValue = 0,
                changeInValue = 10,
                duration = 400,
                easingValue = 0,
                tweenFunction,
                speed = 35,
                object = BaseObject(Visible, Tweenable).add({
                    init: function () {
                        this.visible.setup({
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.visible.getDimension();
                        position = this.visible.getPosition();
                        this.visible.setPosition(Vector(startValue, startValue));
                        tweenFunction = this.tweenable.getRandomTween();
                    },
                    update: function (deltaT) {
                        if (Sugar.isFunction(this.tweenable[tweenFunction])) {
                            easingValue = this.tweenable[tweenFunction](currentTime, startValue,
                                changeInValue, duration);
                        }
                        if (currentTime >= duration && changeInValue >= easingValue) {
                            currentTime = 0;
                            easingValue = 0;
                            changeInValue = mathematics.random(5, 15);
                            tweenFunction = this.tweenable.getRandomTween();
                            this.visible.setPosition(Vector(startValue, startValue));
                        } else {
                            position.y = easingValue * speed;
                            position.x = easingValue * speed;
                            ++currentTime;
                        }
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                        context.fillStyle = 'green';
                        context.font = 'bold 16px Arial';
                        context.fillText(tweenFunction, 180, 20);           
                    }
                });

            Game.add(object);
        });
    }
);