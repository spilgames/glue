/**
 *  @desc Tests for basic clickthrough game functionality
 *  - Click
 *  - Hover
 *  - Drag and Drop
 *  - Screen scrolling
 *  - Level changing
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
        var setUpGame = function () {
            var cameraManager = CameraManager(0, 0, {
                    name: 'cameraManager',
                    width: 1,
                    height: 1
                }),
                leftButton = ScrollButton(0, 300, {
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
                    direction: 'left'
                }),
                rightScrollArea = ScrollArea(0, 0, {
                    name: 'rightScrollArea',
                    width: 100,
                    height: me.game.viewport.getHeight(),
                    direction: 'right'
                }),
                kitty1 = Base(200, 100, {                               
                    name: 'kitty',
                    image: 'kitty',
                    spritewidth: 198,
                    width: 198,
                    height: 226,
                    zIndex: 3}).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        },
                        dragStart: function () {
                            Glue.event.fire(Glue.input.DRAG_START, this);
                        },
                        dragEnd: function () {
                            Glue.event.fire(Glue.input.DRAG_END, this);
                        }
                    }
                ),
                kitty2 = Base(400, 100, {                               
                    name: 'kitty',
                    image: 'kitty',
                    spritewidth: 198,
                    width: 198,
                    height: 226,
                    zIndex: 3}).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        },
                        dragStart: function () {
                            Glue.event.fire(Glue.input.DRAG_START, this);
                        },
                        dragEnd: function () {
                            Glue.event.fire(Glue.input.DRAG_END, this);
                        }
                    }
                );

            Draggable(kitty1);
            Draggable(kitty2);

            leftButton.floating = true;
            rightButton.floating = true;

            Glue.game.add(cameraManager, 1);
            Glue.game.add(leftButton, 1);
            Glue.game.add(rightButton, 1);
            Glue.game.add(leftScrollArea, 1);
            Glue.game.add(rightScrollArea, 1);
            Glue.game.add(kitty1, 1);
            Glue.game.add(kitty2, 1);
        };
        
        beforeAll(function () {
            setUpGame();
        });

        describe('Click', function () {
            it('Chould be able to detect a click on an entity', function (done) {
                var clicked = false;
            });
        });
    });
});
