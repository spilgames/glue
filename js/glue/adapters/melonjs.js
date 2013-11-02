/**
 *  @module MelonJS
 *  @namespace adapters
 *  @desc Provides adapters to interface with MelonJS
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.adapters = glue.adapters || {};
glue.adapters.melonjs = (function (MelonJS) {
    'use strict';
    return {
        name: 'melonJS-adapter',
        audio: {
            init: function (formats) {
                return MelonJS.audio.init(formats);
            }
        },
        event: {
            on: MelonJS.event.subscribe,
            off: MelonJS.event.unsubscribe,
            fire: MelonJS.event.publish
        },
        levelManager: {
            loadLevel: function (levelName) {
                MelonJS.levelDirector.loadLevel(levelName);

                // add our HUD to the game world    
                MelonJS.game.add(new game.HUD.Container());
            },
            unloadLevel: function () {
                MelonJS.game.world.removeChild(
                    MelonJS.game.world.getEntityByProp(
                        'name', 
                        'HUD'
                    )[0]
                );
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
            *  pointerup:   The event occurs when a user releases a
            *  pointer button over an element
            *
            *  pointermove: The event occurs when the pointer is moving
            *  while it is over an element
            *
            *  pointerover: The event occurs when the pointer is moved
            *  onto an element
            *
            *  pointerout:  The event occurs when a user moves the
            *  pointer out of an element
            *  @url http://www.w3.org/Submission/pointer-events
            */
            POINTER_UP:    'pointerup',
            POINTER_DOWN:  'pointerdown',
            POINTER_MOVE:  'pointermove',
            pointer: {
                on: function (eventType, rect, callback, floating) {
                    eventType = eventType.replace('pointer', 'mouse');
                    MelonJS.input.registerPointerEvent(eventType, rect, callback, floating);
                },
                off: function (eventType, rect, callback, floating) {
                    eventType = eventType.replace('pointer', 'mouse');
                    MelonJS.input.releasePointerEvent();
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
                    MelonJS.game.viewport,
                    pointerUpCallback,
                    true
                );
                this.pointer.on(
                    this.POINTER_DOWN,
                    MelonJS.game.viewport,
                    pointerDownCallback,
                    true
                );
                this.pointer.on(
                    this.POINTER_MOVE,
                    MelonJS.game.viewport,
                    pointerMoveCallback,
                    true
                );
            },
            destroy: function () {
                var settings = {};
                settings.eventType = 'pointermove';
                settings.rect = MelonJS.game.viewport;
                settings.eventType = settings.eventType.replace('pointer', 'mouse');
                MelonJS.input.releasePointerEvent(settings.eventType, settings.rect);
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
                    containerId,        // the DOM id of the game canvas container
                    dimensions.width,   // the width of the canvas
                    dimensions.height,  // the height of the canvas
                    true,               // double buffering
                    'auto',             // scaling
                    true                // maintian aspect ratio
                );  
            }
        },
    };
}(window.me));
