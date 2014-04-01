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
            var obj1,
                obj2,
                obj3,
                obj4,
                obj5,
                parent,
                createObj = function (pos) {
                    var obj = BaseObject(Spritable, Rotatable, Scalable, Clickable).add({
                        init: function () {
                            var dimension;
                            this.spritable.setup({
                                position: pos ? pos : Vector(150, 0),
                                image: Loader.getAsset('logoLD')
                            });
                            dimension = this.getDimension();
                            this.setOrigin(Vector(dimension.width / 2, dimension.height / 2));
                            this.initialAngle = Math.atan2(this.getPosition().y, this.getPosition().x);
                        },
                        onClickDown: function (e) {
                            this.held = true;
                            this.offset = Vector(this.getPosition().x - e.position.x, this.getPosition().y - e.position.y);
                            this.offsetAngle = Math.atan2(e.position.y, e.position.x);
                        },
                        pointerUp: function (e) {
                            this.held = false;
                            // propagate event
                            this.base.pointerUp(e);
                        },
                        pointerMove: function (e) {
                            var position = this.getPosition(),
                                angle = 0,
                                parent = this.getParent(),
                                parentPos = parent ? parent.getPosition() : null,
                                scale = 1;
                            if (this.getBoundingBox().hasPosition(e.position)) {
                                this.hovering = true;                                    
                            } else {
                                this.hovering = false;
                            }
                            this.relativePos = Vector(e.position.x, e.position.y);

                            if (this.held) {
                                /* Method 1: rotate parent */
                                if (parent) {
                                    angle = Math.atan2(e.parent.position.y - parentPos.y, e.parent.position.x - parentPos.x);
                                    parent.rotatable.setAngleRadian(angle - this.offsetAngle);
                                    // resize parent
                                    scale = Vector(parentPos.x - e.parent.position.x, parentPos.y - e.parent.position.y).length() / 150;
                                    parent.scalable.setScale(Vector(scale, scale));
                                } else {
                                    // move self
                                    this.setPosition(Vector(e.position.x + this.offset.x, e.position.y + this.offset.y));
                                }
                                /* Method 2: rotate parent */
                                // angle = Math.atan2(e.position.y - position.y, e.position.x - position.x);
                                // this.rotatable.setAngleRadian(angle - this.offsetAngle);
                                // // resize
                                // scale = Vector(position.x - e.position.x, position.y - e.position.y).length() / this.offset.length();
                                // this.scalable.setScale(Vector(scale, scale));
                            }

                            // propagate event
                            this.base.pointerMove(e);
                        },
                        draw: function (gameData) {
                            var parent = this.getParent(),
                                rect = this.getBoundingBox();
                            this.base.draw(gameData);
                            // draw hitbox
                            if (this.hovering) {
                                gameData.context.strokeRect(rect.x1, rect.y1, rect.getWidth(), rect.getHeight());
                            }
                        }
                    })
                    return obj;
                };
            parent = createObj(Vector(100, 100));
            obj1 = createObj();
            obj2 = createObj();
            obj3 = createObj();
            obj4 = createObj();
            Game.add(parent);
            // attach to eachother
            parent.addChild(obj1);
            obj1.addChild(obj2);
            obj2.addChild(obj3);
            obj3.addChild(obj4);
        });
    }
);