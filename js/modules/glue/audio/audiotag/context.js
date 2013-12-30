/*global define, RSVP*/
/*
 *  @module Context
 *  @copyright (C) 2013 SpilGames
 *  @author Martin Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
define('audiotag/context', ["audiotag/sound"],function( Sound ) {
    'use strict';

    var sounds = {},
        loadSound = function( url ) {
            var promise = new RSVP.Promise( function( resolve, reject ) {
    
                var tag = new Audio();
                tag.addEventListener( "canplay", function() {
                    resolve( Sound( tag ) );
                } );
                tag.src = url;
    
            } );
            return promise;
        },
        addSound = function( id, url ) {
            return loadSound( url ).then( function( sound ) {
                sounds[id] = sound;
                return sound;
            } );
        }
    ;

    return {

        /**
         * Load a sound-tag and create a `Sound` object.
         */
        loadSound: function( url ) {
            return loadSound( url );
        },
        
        parse: function( soundSet, baseUrl, ext ) {
            var i = 0,
            all = [],
            spriteName, url;

            for (spriteName in soundSet.spritemap) {
                url = baseUrl + "_00" + (++i) + "." + ext;
                all.push( addSound( spriteName, url ) );
            }
    
            return RSVP.all( all );
        },
        
        play: function( id ) {
            var sound = null;
            if (sounds[id]) {
                sound = sounds[id]
                sounds[id] = Sound( sound.tag.cloneNode() );
                sound.play();
            }
            return sound;
        }

    };

});