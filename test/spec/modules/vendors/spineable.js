// a test is a module itself, it can import actual modules to test
glue.module.create([
        'glue',
        'glue/game',
        'glue/component',
        'vendors/spine/spineable'
    ],
    function (Glue, Game, Component, Spineable) {
        'use strict';
        var createSpine = function (x, y, settings) {
            var entity = Component(Spineable).add({
                init: function () {
                    console.log('init');
                    this.spineable.setup(settings);
                },
                update: function (deltaT, context) {
                    this.spineable.update(deltaT);
                },
                draw: function (deltaT, context, scroll) {
                    this.spineable.draw(deltaT, context, scroll);
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
                    spine.spineable.setAnimationByName(0, "animation", true);
                    expect(spine.spineable.drawAnimatable).toBeDefined();
                    Game.remove(spine);
                });

                it('Should be able to move', function () {
                    var spine = createSpine(0, 0, settings);
                    Game.add(spine, 3);
                    spine.spineable.pos.x = 1000;
                    // you dont need to update position manually,
                    // but it's useful for the test because we don't want to
                    // wait for the update cycle
                    spine.spineable.updatePosition();
                    expect(spine.spineable.getAnimatablePosition().x).toEqual(1000);
                    Game.remove(spine);
                });

                it('Should be able to rescale the skeleton', function () {
                    settings.resolution = 0.5;
                    var spine = createSpine(0, 0, settings);
                    spine.spineable.pos.x = 512;
                    spine.spineable.pos.y = 384;
                    spine.spineable.setAnimationByName(0, "animation", true);
                    Game.add(spine, 3);
                    expect(spine.spineable.getResolution()).toEqual(0.5);
                    Game.remove(spine);
                });

                it('Should be able to set the anchorPoint', function () {
                    var spine = createSpine(0, 0, settings);
                    spine.spineable.setAnimationByName(0, "animation", true);
                    Game.add(spine, 3);
                    spine.spineable.setAnchorPoint({
                        x: 100,
                        y: 0
                    });
                    expect(spine.spineable.getAnchorPoint().x).toEqual(100);
                    Game.remove(spine);
                });

                it('Should be able to rescale the whole sprite', function () {
                    settings.resolution = 1.0;
                    settings.scale = 0.5;
                    var spine = createSpine(0, 0, settings);
                    spine.spineable.pos.x = 0;
                    spine.spineable.pos.y = 0;
                    spine.spineable.updatePosition();
                    //spine.spineable.flipX(true);
                    spine.spineable.setAnimation("animation");

                    Game.add(spine, 3);
                    expect(spine.spineable.getScale()).toEqual(0.5);

                    Game.remove(spine);
                });

                it('Should be able to set multiple skeletons', function () {
                    settings.resolution = 1.0;
                    settings.scale = 0.5;
                    var spine = createSpine(0, 0, settings);
                    spine.spineable.setAnimationByName(0, "animation", true);
                    Game.add(spine, 3);

                    spine.spineable.addSkeleton({
                        atlas: "capivara_atlas",
                        atlasImage: "capivara",
                        skeleton: "capivara_skeleton",
                        scale: 1,
                        resolution: 1
                    });
                    spine.spineable.setAnimationByName(0, "idle", true);
                    expect(spine.spineable.getSkeleton()).toEqual("capivara_skeleton");
                    Game.remove(spine);
                });
                it('Should be able to set animation', function (done) {
                    settings.resolution = 1.0;
                    settings.scale = 0.5;
                    var spine = createSpine(0, 0, settings);
                    spine.spineable.setAnimationByName(0, "animation", true);
                    Game.add(spine, 3);
                    spine.spineable.addSkeleton({
                        atlas: "capivara_atlas",
                        atlasImage: "capivara",
                        skeleton: "capivara_skeleton",
                        scale: 1,
                        resolution: 1
                    });
                    spine.spineable.setAnimation("idle");

                    setTimeout(function () {
                        spine.spineable.setAnimationByName(0, "sad", true);
                        expect(spine.spineable.getAnimation()).toEqual("sad");
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
                spine.spineable.setAnimation("idle");
                spine.spineable.setAnchorPoint({x: spine.spineable.getInitialRect().width/2, y: spine.spineable.getInitialRect().height});
                spine.spineable.pos.x = 512;
                spine.spineable.pos.y = 384;
                spine.spineable.updatePosition();
                Draggable(spine);
                Game.add(spine,3);
                setTimeout(function() {
                    spine.spineable.addSkeleton("elephant-sideview_atlas", "elephant-sideview_atlas", "elephant-sideview_skeleton", 1, 1);
                    spine.spineable.setAnimation("walk");
                    spine.spineable.setAnchorPoint({x: spine.spineable.getInitialRect().width/2-50, y: spine.spineable.getInitialRect().height});
                    setTimeout(function() {
                        spine.spineable.flipX(true);
                    },2000);
                }, 2000);
            });*/
            });
        });
    });