glue.module.create(
    'glue/modules/entity/managers/camera',
    [
        'glue',
        'glue/modules/entity/base',
    ],
    function (Glue, Base) {
        /**
         * Constructor
         * @memberOf scrollButton
         * @function
         * @param {Object} obj: the entity object
         */
        return function (x, y, settings) {
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf scrollButton
                 * @function
                 */
            var setupEvents = function () {
                    Glue.event.on('SCROLL_SCREEN', scrollScreen);
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf scrollButton
                 * @function
                 */
                tearDownEvents = function () {
                    Glue.event.off('SCROLL_SCREEN', scrollScreen);
                },
                /**
                 * Variables
                 */
                screenPosition = {
                    x: 0,
                    y: 0
                },
                /**
                 * defines the scroll speed
                 */
                scrollSpeed = 20,
                /**
                 * defines the viewport bounds
                 */
                viewportBounds = {
                    top: 0,
                    left: 0,
                    bottom: me.game.viewport.getHeight(),
                    right: me.game.viewport.getWidth()
                },
                scrollScreen = function (direction) {
                    switch(direction) {
                        case 'left':  
                            if((screenPosition.x - scrollSpeed) > viewportBounds.left) {
                                screenPosition.x -= scrollSpeed;
                            }else{
                                screenPosition.x = 0;
                            }
                            break;
                        case 'right': 
                            if((screenPosition.x + scrollSpeed) < viewportBounds.right*2) {
                                screenPosition.x += scrollSpeed;
                            }else{
                                screenPosition.x = viewportBounds.right*2;
                            }
                            break;
                        default: break;
                    }
                    me.game.viewport.reset(screenPosition.x, 0);
                },
                /**
                 * Returns the entity with its behaviours
                 * @name obj
                 * @memberOf scrollButton
                 * @function
                 */
                obj = Base(x, y, settings).inject({
                    draw: function (context) {
                        this.parent(context);
                    },
                    update: function () {
                        return true;
                    },
                    /**
                     * gets the screen position
                     */
                    getScreenPosition: function () {
                        return screenPosition;
                    },
                    /**
                     * sets the screen position
                     */
                    setScreenPosition: function (position) {
                        screenPosition = position;
                    },
                    /**
                     * gets the screen speed
                     */
                    getScrollSpeed: function () {
                        return scrollSpeed;
                    },
                    /**
                     * sets the screen speed
                     */
                    setScrollSpeed: function (speed) {
                        screenSpeed = speed;
                    }
                });
            
            obj.floating = true;

            // setup the module events
            setupEvents();

            // adds the entity to the game
            Glue.game.add(obj, settings.zIndex || 1);

            // returns the entity with its behaviours
            return obj;
        };
    }
);
