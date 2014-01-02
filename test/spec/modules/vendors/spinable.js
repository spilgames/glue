// a test is a module itself, it can import actual modules to test
glue.module.create([
        'glue',
        'glue/game',
        'glue/component',
        'vendors/spine/spinable'
    ],
    function (Glue, Game, Component, Spinable) {
        'use strict';
        var createSpine = function (x, y, settings) {
            var entity = Component(Spinable).add({
                init: function () {
                    console.log('init');
                    this.spinable.setup(settings);
                },
                update: function (deltaT, context) {
                    this.spinable.update(deltaT);
                },
                draw: function (deltaT, context, scroll) {
                    this.spinable.draw(deltaT, context, scroll);
                }
            });
            return entity;
        };

        describe('Spine', function () {
            var settings = {
                position: {
                    x: 100,
                    y: 200
                },
                atlasImage: 'capivara_sideview',
                atlas: 'capivara_sideview_atlas',
                skeleton: 'capivara_sideview_skeleton',
                resolution: 1.0,
                scale: 1,
                name: 'spine'
            };

            describe('Creation', function () {
                it('Should be able to create an animatable object', function () {
                    var spine = createSpine(0, 0, settings);
                    console.log(spine);
                    spine.init();
                    Game.add(spine);
                    spine.spinable.setAnimationByName(0, "animation", true);
                    expect(spine.spinable.drawAnimatable).toBeDefined();
                    Game.remove(spine);
                });

                it('Should be able to move', function () {
                    var spine = createSpine(0, 0, settings);
                    Game.add(spine, 3);
                    spine.spinable.pos.x = 1000;
                    // you dont need to update position manually,
                    // but it's useful for the test because we don't want to
                    // wait for the update cycle
                    spine.spinable.updatePosition();
                    expect(spine.spinable.getAnimatablePosition().x).toEqual(1000);
                    Game.remove(spine);
                });

                it('Should be able to rescale the skeleton', function () {
                    settings.resolution = 0.5;
                    var spine = createSpine(0, 0, settings);
                    spine.spinable.pos.x = 512;
                    spine.spinable.pos.y = 384;
                    spine.spinable.setAnimationByName(0, "animation", true);
                    Game.add(spine, 3);
                    expect(spine.spinable.getResolution()).toEqual(0.5);
                    Game.remove(spine);
                });

                it('Should be able to set the anchorPoint', function () {
                    var spine = createSpine(0, 0, settings);
                    spine.spinable.setAnimationByName(0, "animation", true);
                    Game.add(spine, 3);
                    spine.spinable.setAnchorPoint({
                        x: 100,
                        y: 0
                    });
                    expect(spine.spinable.getAnchorPoint().x).toEqual(100);
                    Game.remove(spine);
                });

                it('Should be able to rescale the whole sprite', function () {
                    settings.resolution = 1.0;
                    settings.scale = 0.5;
                    var spine = createSpine(0, 0, settings);
                    spine.spinable.pos.x = 0;
                    spine.spinable.pos.y = 0;
                    spine.spinable.updatePosition();
                    //spine.spinable.flipX(true);
                    spine.spinable.setAnimation("animation");

                    Game.add(spine, 3);
                    expect(spine.spinable.getScale()).toEqual(0.5);

                    Game.remove(spine);
                });

                it('Should be able to set multiple skeletons', function () {
                    settings.resolution = 1.0;
                    settings.scale = 0.5;
                    var spine = createSpine(0, 0, settings);
                    spine.spinable.setAnimationByName(0, "animation", true);
                    Game.add(spine, 3);

                    spine.spinable.addSkeleton({
                        atlas: "capivara_atlas",
                        atlasImage: "capivara",
                        skeleton: "capivara_skeleton",
                        scale: 1,
                        resolution: 1
                    });
                    spine.spinable.setAnimationByName(0, "idle", true);
                    expect(spine.spinable.getSkeleton()).toEqual("capivara_skeleton");
                    Game.remove(spine);
                });
                it('Should be able to set animation', function (done) {
                    settings.resolution = 1.0;
                    settings.scale = 0.5;
                    var spine = createSpine(0, 0, settings);
                    spine.spinable.setAnimationByName(0, "animation", true);
                    Game.add(spine, 3);
                    spine.spinable.addSkeleton({
                        atlas: "capivara_atlas",
                        atlasImage: "capivara",
                        skeleton: "capivara_skeleton",
                        scale: 1,
                        resolution: 1
                    });
                    spine.spinable.setAnimation("idle");

                    setTimeout(function () {
                        spine.spinable.setAnimationByName(0, "sad", true);
                        expect(spine.spinable.getAnimation()).toEqual("sad");
                        done();
                    }, 100);
                    Game.remove(spine);
                });

                /*it('visual test', function () {
                settings.scale = 1;
                settings.atlas = 'elephant_atlas';
                settings.atlasImage = 'elephant_atlas';
                settings.skeleton = 'elephant_skeleton';
                var spine = createSpine(0, 0, settings);
                spine.spinable.setAnimation("idle");
                spine.spinable.setAnchorPoint({x: spine.spinable.getInitialRect().width/2, y: spine.spinable.getInitialRect().height});
                spine.spinable.pos.x = 512;
                spine.spinable.pos.y = 384;
                spine.spinable.updatePosition();
                Draggable(spine);
                Game.add(spine,3);
                setTimeout(function() {
                    spine.spinable.addSkeleton("elephant-sideview_atlas", "elephant-sideview_atlas", "elephant-sideview_skeleton", 1, 1);
                    spine.spinable.setAnimation("walk");
                    spine.spinable.setAnchorPoint({x: spine.spinable.getInitialRect().width/2-50, y: spine.spinable.getInitialRect().height});
                    setTimeout(function() {
                        spine.spinable.flipX(true);
                    },2000);
                }, 2000);
            });*/
            });
        });
    });