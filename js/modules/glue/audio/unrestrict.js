/*global define, RSVP*/
/*
 *  @module Unrestrict
 *  @copyright (C) SpilGames
 *  @author Martin Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
/**
 * This class contains what is needed to work with and detect mobile devices. As
 * such it contains code to 'arm' the audio.
 * 
 * It will also contain all utility methods required for working with mobile
 * devices, such as `isTouch()`.
 * 
 */
define(
    'unrestrict',
    function() {
    'use strict';
    
    //Always doing this because it won't hurt devices that don't need it...
    var eventtypes = ["touchstart","touchmove","touchenter","touchcancel","click","scroll"],
        eventhandlers = [],
        b = document.body,
        i, eventtype, l = eventtypes.length,

        listener = function() {
            unrestrict.trigger("userInteraction");
            cleanup();
        },
        cleanup = function() {
            for (i = 0; i < l; ++i) {
                eventtype = eventtypes[i];
                b.removeEventListener(eventtype, listener);
            }
            eventhandlers = [];
            unrestrict.off("userInteraction");
        },
        unrestrict = {
            /**
             * This 'arms' the event-listeners that are legal for triggering
             * audio. This is used internally to 'unlock' audio on mobile
             * devices. It is exposed so that any developer can 'arm' the
             * listeners when a new audio-file is loading.
             * 
             * If you want to react to the event that is triggered on legal
             * user-interaction you should register a listener for
             * 'userInteraction' on the unrestrict instance. You should also be
             * aware that all these listeners are cleared upon the first
             * successful invocation. (Which is a cheap way to prevent
             * accidental double-fires)
             */
            arm: function() {
                if (eventhandlers.length > 0) {
                    return; //Already armed
                }
                for (i = 0; i < l; ++i) {
                    eventtype = eventtypes[i];
                    b.addEventListener(eventtype, listener);
                }
            },
            /**
             * Returns true if both software and hardware is touch-capable. At the time of
             * implementation this method was considered reliable. Hopefully by the time it no
             * longer is, the need has also dissipated.
             */
            isTouch: ( function() {
                //from http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-
                //a-touch-screen-device-using-javascript
                var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));

                return function() {
                    return isTouch;
                };
            }())
        }
    ;
    
    unrestrict.arm();
    RSVP.EventTarget.mixin(unrestrict);
    return unrestrict;

});
