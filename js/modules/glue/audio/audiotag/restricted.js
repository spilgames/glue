/*global define, RSVP, requestAnimationFrame, cancelAnimationFrame*/
/*
 *  @module Restricted
 *  @copyright (C) SpilGames
 *  @author Martin Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
define('audiotag/restricted', ["audiotag/context", "audiotag/sprite"],function( Context, Sprite ) {
    'use strict';

    var sprites = {},
        spriteMap = null,
        sound = null,
        /**
         * A cheap wrapper around requestAnimationFrame to keep the scope
         * of the animation chain preserved without generating new function
         * on every itteration.
         * The 'callback' function should return true if the animation chain
         * must continue, false if it is finished.
         */
        animationScope = function (scope, callback) {
            var rafID = null,
                requestAnimationFrame = window.requestAnimationFrame||webkitRequestAnimationFrame,
                cancelAnimationFrame = window.cancelAnimationFrame||webkitCancelRequestAnimationFrame;
    
            function animationFrame () {
                if (callback(scope)) {
                    rafID = requestAnimationFrame(animationFrame);
                }
            }
    
            return {
                /**
                 * Start the animation chain.
                 * @returns
                 */
                start: function () {
                    rafID = requestAnimationFrame(animationFrame);
                },
                /**
                 * On supported browsers stop the animation chain.
                 * @returns
                 */
                stop: function () {
                    if (typeof cancelAnimationFrame !== 'undefined') {
                        cancelAnimationFrame(rafID);
                    }
                }
            };
        },
        addSprite = function( id, context ) {
            var sprite = new Sprite( id, context );
            sprites[id] = sprite;
            return sprite;
        },
        seekSprite = function (sprite) {
            sound.tag.currentTime = sprite.start;
        }
    ;

    return {
        loadSound: function() {
            throw "Cannot load separate sounds in this context!";
        },
        parse: function( soundSet, baseUrl, ext ) {
            var i = 0,
            all = [],
            spriteName, url;
            
            spriteMap = soundSet.spritemap;

            for (spriteName in soundSet.spritemap) {
                all.push(addSprite( spriteName, this ));
            }

            return Context.loadSound(baseUrl + "." + ext).then( function( oSound ) {
                sound = oSound;
                return all;
            });
        },
        play: function( id ) {
            //console.log("%c Looking for a sound!", "background: #bada55; color: yellow;", id);
            var sprite = null;
            if (sprites[id]) {
                sprite = sprites[id];
                sprite.play();
            }
            return sprite;
        },
        stop: function() {
            sound.stop();
        },
        playSprite: function( id ) {
            var sprite = spriteMap[id];

            //console.log("%c Starting sprite play", "background: #bada55; color: yellow;", id);
            //Fix start/end times for really short sprites
            var t =  sprite.end - sprite.start;
            if ( t < 0.5 ) {
                sprite.start = sprite.start - 0.1;
                sprite.end = Math.floor(sprite.end) + 0.5;
            }
            
            seekSprite(sprite);

            if (this.animationScope) {
                this.animationScope.stop();
                this.animationScope = null;
            }
            
            var self = this;

            this.animationScope = animationScope(
                {
                    context: self,
                    sound: sound,
                    sprite: sprite
                },
                function (scope) {
                    var context = scope.context,
                        sound = scope.sound,
                        sprite = scope.sprite
                    ;
                    
                    if (sound.tag.currentTime > sprite.end) {
                        context.stop();
                        return false;
                    }
                    return true;
                }
            );

            this.animationScope.start();
            sound.play();

        }

    };
    
});