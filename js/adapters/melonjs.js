/**
 *  @module MelonJS
 *  @namespace adapters
 *  @desc Provides adapters to interface with MelonJS
 *  @copyright © 2013 - SpilGames
 */
var adapters = adapters || {};
adapters.melonjs = (function (MelonJS) {
    'use strict';
    return {
        name: 'melonJS-adapter',
        audio: {
            init: function (formats) {
                return MelonJS.audio.init(formats);
            }
        },
        entity: {
            base: function () {
                return MelonJS.ObjectEntity;
            }
        },
        event: {
            on: MelonJS.event.subscribe,
            off: MelonJS.event.unsubscribe,
            fire: MelonJS.event.publish
        },
        game: {
            add: MelonJS.game.add,
            remove: function (obj) {
                if (obj.destruct) {
                    obj.destruct();
                }
                MelonJS.game.remove(obj);
            },
            viewport: MelonJS.game.viewport
        },
        levelManager: {
            loadLevel: function (levelName) {
                MelonJS.levelDirector.loadLevel(levelName);
            },
            unloadLevel: function () {
                var entities = MelonJS.game.world.children,
                    i,
                    l,
                    obj;

                for (i = 0, l = entities.length; i < l; ++i) {
                    obj = entities[i];
                    if (obj.destruct) {
                        obj.destruct();
                    }
                    MelonJS.game.remove(obj);
                }
            }
        },
        input: {
            /**
            *  @name pointerEvent
            *  @public
            *  @function
            *  @desc Transforms a pointer event to a mouse event, 
            *  because MelonJS is using mouse events as the base
            *  event (instead of embracing pointer events)
            *  eventTypes:
            *
            *  pointerdown: The event occurs when a user presses a 
            *  pointer button over an element
            *
            *  pointerup: The event occurs when a user releases a
            *  pointer button over an element
            *
            *  pointermove: The event occurs when the pointer is moving
            *  while it is over an element
            *
            *  pointerover: The event occurs when the pointer is moved
            *  onto an element
            *
            *  pointerout: The event occurs when a user moves the
            *  pointer out of an element
            *  @note The drag events could be separated later on
            *  @url http://www.w3.org/Submission/pointer-events
            */
            POINTER_UP: 'pointerup',
            POINTER_DOWN: 'pointerdown',
            POINTER_MOVE: 'pointermove',
            DRAG_START: 'dragstart',
            DRAG_END: 'dragend',
            pointer: {
                on: function (eventType, callback, rect, floating) {
                    eventType = eventType.replace('pointer', 'mouse');
                    MelonJS.input.registerPointerEvent(eventType, rect || MelonJS.game.viewport, callback, floating);
                },
                off: function (eventType, rect) {
                    eventType = eventType.replace('pointer', 'mouse');
                    MelonJS.input.releasePointerEvent(eventType, rect || MelonJS.game.viewport);
                }
            },
            init: function () {
                var self = this,
                    pointerUpCallback = function (evt) {
                        MelonJS.event.publish(self.POINTER_UP, [evt]);
                    },
                    pointerDownCallback = function (evt) {
                        MelonJS.event.publish(self.POINTER_DOWN, [evt]);
                    },
                    pointerMoveCallback = function (evt) {
                        MelonJS.event.publish(self.POINTER_MOVE, [evt]);
                    };

                this.pointer.on(
                    this.POINTER_UP,
                    pointerUpCallback
                );
                this.pointer.on(
                    this.POINTER_DOWN,
                    pointerDownCallback
                );
                this.pointer.on(
                    this.POINTER_MOVE,
                    pointerMoveCallback
                );
            },
            destroy: function () {
                this.pointer.off(this.POINTER_UP);
                this.pointer.off(this.POINTER_DOWN);
                this.pointer.off(this.POINTER_MOVE);
            }
        },
        loader: {
            setLoadCallback: function (callback) {
                MelonJS.loader.onload = callback;
                return MelonJS.loader.onload;
            },
            preload: function (resources) {
                MelonJS.loader.preload(resources);
            }
        },
        math: {
            vector: MelonJS.Vector2d
        },
        plugin: {
            register: function () {
                MelonJS.plugin.register.apply(null, arguments);
            }
        },
        state: {
            change: function () {
                MelonJS.state.change.apply(null, arguments);
            },
            set: function (state, gameObject) {
                MelonJS.state.set(state, gameObject);
            }
        },
        video: {
            init: function (containerId, dimensions) {
                // make sure scaling interpolation is used
                // to prevent pixelated images when resizing
                MelonJS.sys.scalingInterpolation = true;
                // init the video and return the result
                return MelonJS.video.init(
                    containerId, // the DOM id of the game canvas container
                    dimensions.width, // the width of the canvas
                    dimensions.height, // the height of the canvas
                    true, // double buffering
                    'auto', // scaling
                    true // maintian aspect ratio
                );
            },
            getCanvas: function () {
                return MelonJS.video.getScreenCanvas();
            }
        }
    };
}(window.me));
