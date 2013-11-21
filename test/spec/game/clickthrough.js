/**
 *  @desc Tests for basic clickthrough game functionality
 *  These tests are setup in response to a number of issues raised by the implementing developer,
 *  and will eventually include solutions for all of these:
 *  #101: [Glue] Reset position draggables
 *  https://spilgames.jira.com/browse/BLK-101
 *  #102: [Glue] Investigate to find a better way to combine hoverable behaviour on mobile/desktop
 *  https://spilgames.jira.com/browse/BLK-102
 *  #103: [Glue] Drag move take into account screen position
 *  https://spilgames.jira.com/browse/BLK-103
 *  #104: [Glue] Droptarget hit check method based on pointer position
 *  https://spilgames.jira.com/browse/BLK-104
 *  #105: [Glue] drag area and drag button together
 *  https://spilgames.jira.com/browse/BLK-105
 *  #106: [Glue] Supply (glue) MelonJS debug bar
 *  https://spilgames.jira.com/browse/BLK-106
 *  #107: [Glue] Integrate destroy methods
 *  https://spilgames.jira.com/browse/BLK-107
 *  #108: [Glue] Collisionbox based clickable
 *  https://spilgames.jira.com/browse/BLK-108
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    [
        'glue',
        'glue/modules/spilgames/entity/base',
        'glue/modules/spilgames/entity/managers/camera',
        'glue/modules/spilgames/entity/ui/scrollbutton',
        'glue/modules/spilgames/entity/ui/scrollarea',
        'glue/modules/spilgames/entity/behaviour/clickable',
        'glue/modules/spilgames/entity/behaviour/draggable',
        'glue/modules/spilgames/entity/behaviour/droptarget',
        'glue/modules/spilgames/entity/behaviour/hoverable'
    ], function (
        Glue,
        Base,
        CameraManager,
        ScrollButton,
        ScrollArea,
        Clickable,
        Draggable,
        Droptarget,
        Hoverable
    ) {
    describe('game.clickthrough', function () {
        'use strict';
        var manualTest = true,
            testTimeout = 3000,
            cameraManager,
            setUpGame = function () {
                var leftButton = ScrollButton(0, 300, {
                        name: 'leftButton',
                        image: 'leftButton',
                        spritewidth: 102,
                        width: 204,
                        height: 105,
                        zIndex: 100,
                        direction: 'left'
                    }),
                    rightButton = ScrollButton(920, 300, {
                        name: 'rightButton',
                        image: 'rightButton',
                        spritewidth: 102,
                        width: 204,
                        height: 105,
                        zIndex: 100,
                        direction: 'right'
                    }),
                    leftScrollArea = ScrollArea(0, 0, {
                        name: 'leftScrollArea',
                        width: 100,
                        height: me.game.viewport.getHeight(),
                        direction: 'left',
                        debug: true
                    }),
                    rightScrollArea = ScrollArea(me.game.viewport.getWidth() - 100, 0, {
                        name: 'rightScrollArea',
                        width: 100,
                        height: me.game.viewport.getHeight(),
                        direction: 'right',
                        debug: true
                    }),
                    kitty1 = Base(200, 300, {                               
                        name: 'kitty',
                        image: 'kitty',
                        spritewidth: 198,
                        width: 198,
                        height: 226
                    }).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        }
                    }),
                    kitty2 = Base(400, 350, {                               
                        name: 'kitty2',
                        image: 'kitty',
                        spritewidth: 198,
                        width: 198,
                        height: 226
                    }).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        }
                    }),
                    kitty3 = Base(600, 400, {                               
                        name: 'kitty3',
                        image: 'kitty',
                        spritewidth: 198,
                        width: 198,
                        height: 226
                    }).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        }
                    }),
                    door = Base(1000, 53, {
                        name: 'door',
                        image: 'door',
                        spritewidth: 245,
                        width: 491,
                        height: 414,
                        zIndex: 20
                    }).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        },
                        drop: function (draggableEntity) {
                            console.log('drop', draggableEntity);
                        },
                        hoverOver: function () {
                            if(this.renderable) {
                                this.renderable.setCurrentAnimation('hovered');
                            }
                        },
                        hoverOut: function () {
                            if(this.renderable) {
                                this.renderable.setCurrentAnimation('normal');
                            }
                        },
                    });

                cameraManager = CameraManager(0, 0, {
                    name: 'cameraManager',
                    width: 1,
                    height: 1
                });

                if(door.renderable) {
                    door.renderable.addAnimation('normal', [0]);
                    door.renderable.addAnimation('hovered', [1]);
                }

                Droptarget(door);
                Hoverable(door);
                Draggable(kitty1);
                kitty1.setCustomResetPosition({y: 300});
                kitty1.setResetCallback(function () {
                    if (this.pos.y <= 300) {
                        this.pos.y = 300;
                    }
                });
                Draggable(kitty2);
                Draggable(kitty3);

                Glue.game.add(cameraManager, 1);
                Glue.game.add(leftButton, 50);
                Glue.game.add(rightButton, 50);
                Glue.game.add(leftScrollArea, 1);
                Glue.game.add(rightScrollArea, 1);
                Glue.game.add(kitty1, 2);
                Glue.game.add(kitty2, 2);
                Glue.game.add(kitty3, 2);
                Glue.game.add(door, 2);
            };
        
        beforeAll(function () {
            setUpGame();
        });

        if (manualTest) {
            describe('Manual test', function () {
                it('', function () {});
            });
            return;
        }

        describe('Screen scrolling', function () {
            it('Should be able to scroll the screen to the right', function (done) {
                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                    gameX: 970,
                    gameY: 350
                }]);
                setTimeout(function () {
                    expect(cameraManager.getScreenPosition().x).toBe(2048);
                    Glue.event.fire(Glue.input.POINTER_UP, [{
                        gameX: 3016,
                        gameY: 350
                    }]);
                    done();
                }, testTimeout);
            });
            it('Should be able to scroll the screen to the left', function (done) {
                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                    gameX: 2100,
                    gameY: 350
                }]);
                setTimeout(function () {
                    expect(cameraManager.getScreenPosition().x).toBe(0);
                    Glue.event.fire(Glue.input.POINTER_UP, [{
                        gameX: 50,
                        gameY: 350
                    }]);
                    Glue.event.fire(Glue.input.POINTER_DOWN, [{
                        gameX: 350,
                        gameY: 350
                    }]);
                    Glue.event.fire(Glue.input.POINTER_UP, [{
                        gameX: 350,
                        gameY: 350
                    }]);
                    done();
                }, testTimeout);
            });
        });
    });
});
