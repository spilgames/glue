glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/rotatable',
        'glue/component/scalable',
        'glue/component/clickable'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Spritable,
        Rotatable,
        Scalable,
        Clickable
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Scene Graph'
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
                    logoLD: 'glue-logo-ld.png'
                }
            }
        }, function () {
            var object1 = BaseObject(Spritable, Rotatable, Scalable, Clickable).add({
                    init: function () {
                        var dimension;
                        this.spritable.setup({
                            position: Vector(100, 100),
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.getDimension();
                        this.setOrigin(Vector(dimension.width / 2, dimension.height / 2));
                        // this.rotatable.setAngleDegree(45);
                    },
                    update: function (deltaT) {
                    },
                    onClickDown: function (e) {
                        console.log('object 1 clicked');
                        this.held = true;
                        this.offset = Vector(this.getPosition().x - e.position.x, this.getPosition().y - e.position.y);
                    },
                    onClickUp: function (e) {
                        this.held = false;
                    },
                    pointerMove: function (e) {
                        if (this.held && this.getBoundingBox().hasPosition(e.position)) {
                            this.base.pointerMove(e);
                            this.setPosition(Vector(e.position.x + this.offset.x, e.position.y + this.offset.y));
                        }
                        // propagate event
                        this.base.pointerMove(e);
                    }
                }),
                object2 = BaseObject(Spritable, Rotatable, Scalable, Clickable).add({
                    init: function () {
                        var dimension;
                        object2.spritable.setup({
                            position: Vector(75, 0),
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = object2.getDimension();
                        object2.initialAngle = Math.atan2(object2.getPosition().y, object2.getPosition().x);

                        // object2.scalable.setScale(Vector(0.5, 0.5));
                    },
                    update: function (deltaT) {
                    },
                    onClickDown: function (e) {
                        console.log('object 2 clicked');
                        object2.held = true;
                        object2.offset = Vector(object2.getPosition().x - e.position.x, object2.getPosition().y - e.position.y);
                    },
                    onClickUp: function (e) {
                        object2.held = false;
                    },
                    // pointerDown: function (e) {
                    //     console.log('object 2 pointerDown', e.position);
                    //     object2.base.pointerDown(e);
                    // },
                    pointerMove: function (e) {
                        var angle = 0,
                            parent = object2.getParent();
                        if (object2.held && object2.getBoundingBox().hasPosition(e.position)) {
                            object2.base.pointerMove(e);
                            object2.setPosition(Vector(e.position.x + object2.offset.x, e.position.y + object2.offset.y));

                            // rotate parent
                            angle = Math.atan2(object2.getPosition().y, object2.getPosition().x);
                            parent.rotatable.setAngleRadian(angle);
                            console.log(angle);
                        }
                        object2.relativePos = Vector(e.position.x, e.position.y); 
                        // propagate event
                        this.base.pointerMove(e);
                    },
                    draw: function (gameData) {
                        var parent = object2.getParent(),
                            rect = object2.getBoundingBox();
                        object2.base.draw(gameData);
                        // draw child event position for debugging purposes
                        if (object2.relativePos) {
                            gameData.context.fillRect(object2.relativePos.x, object2.relativePos.y, 2, 2);
                        }
                        // draw parent to child
                        gameData.context.beginPath();
                        gameData.context.moveTo(0, 0);
                        gameData.context.lineTo(object2.getPosition().x, object2.getPosition().y);
                        gameData.context.closePath();
                        gameData.context.stroke();
                        // draw hitbox
                        gameData.context.strokeRect(rect.x1, rect.y1, rect.getWidth(), rect.getHeight());
                    }
                }),
                object3 = BaseObject(Spritable, Rotatable, Scalable, Clickable).add({
                    init: function () {
                        var dimension;
                        object3.spritable.setup({
                            position: Vector(object2.getDimension().width, object2.getDimension().height),
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = object3.getDimension();
                        // object3.scalable.setScale(Vector(0.5, 0.5));
                    },
                    update: function (deltaT) {
                    },
                    onClickDown: function (e) {
                        console.log('object 3 clicked');
                        object3.held = true;
                        object3.offset = Vector(object3.getPosition().x - e.position.x, object3.getPosition().y - e.position.y);
                    },
                    onClickUp: function (e) {
                        object3.held = false;
                    },
                    // pointerDown: function (e) {
                    //     console.log('object 3 pointerDown', e.position);
                    //     object3.base.pointerDown(e);
                    // },
                    pointerMove: function (e) {
                        var angle = 0;
                        if (object3.held && object3.getBoundingBox().hasPosition(e.position)) {
                            object3.base.pointerMove(e);
                            object3.setPosition(Vector(e.position.x + object3.offset.x, e.position.y + object3.offset.y));
                            // TODO: transform parent
                        }
                        object3.relativePos = Vector(e.position.x, e.position.y); 
                        // propagate event
                        this.base.pointerMove(e);
                    },
                    draw: function (gameData) {
                        object3.base.draw(gameData);
                        // draw child event position for debugging purposes
                        // if (object3.relativePos) {
                        //     gameData.context.fillRect(object3.relativePos.x, object3.relativePos.y, 2, 2);
                        // }
                    }
                });
                
                object1.addChild(object2);
                object2.addChild(object3);

            Game.add(object1);
        });
    }
);