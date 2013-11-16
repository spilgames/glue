glue.module.create(
    'glue/modules/spilgames/entity/ui/scrollarea',
    [
        'glue',
        'glue/modules/spilgames/entity/base',
        'glue/modules/spilgames/entity/behaviour/hoverable'
    ],
    function (Glue, Base, Hoverable) {
        /**
         * Constructor
         * @memberOf scrollArea
         * @function
         * @param {Object} obj: the entity object
         */
        return function (x, y, settings) {
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf scrollArea
                 * @function
                 */
            var setupEvents = function () {
                    Glue.event.on(Glue.input.DRAG_START, function (obj) {
                        isDragging = true;
                    });
                    Glue.event.on(Glue.input.DRAG_END, function (obj) {
                        isDragging = false;
                    });
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf scrollArea
                 * @function
                 */
                tearDownEvents = function () {
                },
                /**
                 * Variables
                 */
                isHovering = false,
                isDragging = false,
                /**
                 * Returns the entity with its behaviours
                 * @name obj
                 * @memberOf scrollArea
                 * @function
                 */
                obj = Base(x, y, settings).inject({
                    draw: function (context) {
                        this.parent(context);
                    },
                    hoverOver: function () {
                        isHovering = true;
                    },
                    hoverOut: function () {
                        isHovering = false;
                    },
                    dragStart: function () {
                        isDragging = true;
                    },
                    dragEnd: function () {
                        isDragging = false;
                    },
                    update: function () {
                        //console.log(isDragging, this.isHovering(), settings.direction);
                        if(isDragging && this.isHovering()) {
                            Glue.event.fire('SCROLL_SCREEN', [settings.direction]);
                        }
                        return true;
                    },
                    /**
                     * Can be used to destruct this entity
                     * @name destructClickable
                     * @memberOf scrollArea
                     * @function
                     */
                    destructClickable: function () {
                        tearDownEvents();
                    }
                });
            
            obj.floating = true;

            // setup the module events
            setupEvents();

            // setup the behaviours of this entity
            Hoverable(obj);

            // returns the entity with its behaviours
            return obj;
        };
    }
);
