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
            var draggedObject = null,
                dragStart = function (e, obj) {
                    isDragging = true;
                    draggedObject = obj;
                },
                dragEnd = function (e, obj) {
                    isDragging = false;
                },
                setupEvents = function () {
                    Glue.event.on(Glue.input.DRAG_START, dragStart);
                    Glue.event.on(Glue.input.DRAG_END, dragEnd);
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf scrollArea
                 * @function
                 */
                tearDownEvents = function () {
                    Glue.event.off(Glue.input.DRAG_START, dragStart);
                    Glue.event.off(Glue.input.DRAG_END, dragEnd);
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
                        if (settings.debug) {
                            context.fillStyle = 'blue';
                            context.fillRect(this.pos.x,this.pos.y,this.width,this.height);
                        }
                    },
                    hoverOver: function (e) {
                        isHovering = true;
                    },
                    hoverOut: function () {
                        isHovering = false;
                    },
                    update: function () {
                        //console.log(isDragging, this.isHovering(), settings.direction);
                        if(isDragging && this.isHovering()) {
                            Glue.event.fire('SCROLL_SCREEN', [settings.direction]);
                            // testing
                            draggedObject.pos =
                            me.game.viewport.localToWorld(draggedObject.pos.x, draggedObject.pos.y);
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
