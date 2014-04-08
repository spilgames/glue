glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/component/spritable',
        'glue/baseobject',
        'glue/text'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        Spritable,
        BaseObject,
        Text
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Text'
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
                    logoLD: 'glue-logo-ld.png',
                    topLeft: 'topleft.png',
                    downRight: 'downright.png'
                }
            }
        }, function () {
            var str = 'This is the text module. If the maxWidth and maxHeight is set, it will autoscale to the correct size. If linebreak is true then the module will automatically create linebreaks in the text.',
                topLeft = BaseObject(Spritable).add({
                init: function () {
                    this.spritable.setup({
                        image: Loader.getAsset('topLeft')
                    });
                    this.setOrigin(Vector(8, 8));
                    this.setPosition(Vector(20, 20));
                    text.setPosition(Vector(20, 20));
                },
                pointerDown: function (e) {
                    if (this.getBoundingBox().hasPosition(e.position)) {
                        this.held = true;
                    }
                    this.base.pointerDown(e);
                },
                pointerUp: function (e) {
                    this.held = false;
                    this.base.pointerUp(e);
                },
                pointerMove: function (e) {
                    if (this.held) {
                        this.setPosition(e.position);
                        text.setPosition(e.position);
                    }
                    this.base.pointerMove(e);
                }
            }),
                downRight = BaseObject(Spritable).add({
                    init: function () {
                        this.spritable.setup({
                            image: Loader.getAsset('downRight')
                        });
                        this.setOrigin(Vector(56, 56));
                        this.setPosition(Vector(400, 400));
                    },
                    pointerDown: function (e) {
                        if (this.getBoundingBox().hasPosition(e.position)) {
                            this.held = true;
                        }
                    },
                    pointerUp: function (e) {
                        this.held = false;
                    },
                    pointerMove: function (e) {
                        var pos;
                        if (this.held) {
                            pos = e.position.clone();
                            if (pos.x < 0) {
                                pos.x = 0;
                            }
                            if (pos.y < 0) {
                                pos.y = 0;
                            }
                            this.setPosition(pos);
                            text.setText(str, {maxWidth: pos.x, maxHeight: pos.y});
                        }
                    }
                }),
                text = Text({
                    position: Vector(20, 20),
                    font: 'Arial',
                    fontSize: 48,
                    text: str,
                    maxWidth: 400,
                    maxHeight: 400,
                    linebreaks: true
                });

            Game.add(text);
            Game.add(topLeft);
            topLeft.addChild(downRight);
        });
    }
);