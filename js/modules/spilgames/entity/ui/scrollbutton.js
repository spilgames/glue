glue.module.create(
    'glue/modules/spilgames/entity/ui/scrollbutton',
    [
        'glue',
        'glue/modules/spilgames/entity/base',
        'glue/modules/spilgames/entity/behaviour/hoverable',
        'glue/modules/spilgames/entity/behaviour/clickable'
    ],
    function (Glue, Base, Hoverable, Clickable) {
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
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf scrollButton
                 * @function
                 */
                tearDownEvents = function () {
                },
                /**
                 * Variables
                 */
                isHovered = false,
                isClicked = false,
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
                        if(isClicked) {
                            Glue.event.fire('SCROLL_SCREEN', [settings.direction]);
                        }
                        return true;
                    },
                    clickUp: function (e) {
                        isClicked = false;
                    },
                    hoverOver: function (e) {
                        isHovering = true;
                        if(this.renderable) {
                            this.renderable.setCurrentAnimation('hovered');
                        }
                    },
                    hoverOut: function (e) {
                        isHovering = false;
                        if(this.renderable) {
                            this.renderable.setCurrentAnimation('normal');
                        }
                    },
                    isHovering: function () {
                        return isHovering;
                    },
                    /**
                     * Returns if this entity is clicked
                     * @name clicked
                     * @memberOf scrollButton
                     * @function
                     */
                    clickDown: function (e) {
                        isClicked = true;
                    },
                    isClicked: function () {
                        return isClicked;
                    },
                    /**
                     * Can be used to destruct this entity
                     * @name destructClickable
                     * @memberOf scrollButton
                     * @function
                     */
                    destructClickable: function () {
                        tearDownEvents();
                    }
                });

                if(obj.renderable) {
                    obj.renderable.addAnimation('normal', [0]);
                    obj.renderable.addAnimation('hovered', [1]);
                }

            // setup the module events
            setupEvents();

            // setup the behaviours of this entity
            Hoverable(obj);
            Clickable(obj);

            // returns the entity with its behaviours
            return obj;
        };
    }
);
