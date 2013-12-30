/*global define, RSVP*/
/*
 *  @module Audio51
 *  @copyright (C) 2013 SpilGames
 *  @author Martin Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
define( 
    'audio51',
    ["webaudio/context",
     "audiotag/context",
     "audiotag/restricted",
     "unrestrict"],
    function(wac, atc, ratc, unrestrict) {
    'use strict';
    
    var fileTypes = {
            //Safe format, but relatively large
            'mp3': 'audio/mpeg',
            //Chrome on Android can't seek in ogg (or so it appeared 2013-04-25)
            //Bad support, small size though
            'ogg': 'audio/ogg',
            //Not always supported, but medium size
            'ac3': 'audio/ac3'
        },
        getContext = ( function() {
            var ctx = null;

            //Determine override type, if provided.
            return function( override ) {
                if ( override ) {

                    switch (override) {
                    case 3:
                        ctx = ratc;
                        break;

                    case 2:
                        ctx = atc;
                        break;

                    default:
                        ctx = wac;
                        break;
                    }

                } else if (ctx === null) {

                    //If WebAudio API is available it should be used
                    if ( wac.canIUse() ) {
                        //WebAudio API has internal 'arming' so mobile and desktop are the same
                        ctx = wac;
                    } else {

                        //Check for touch, touch probably means mobile,
                        //acceptable margin of error
                        if ( unrestrict.isTouch() ) {
                            ctx = ratc;
                        } else {
                            ctx = atc;
                        }

                    }
                }

                //Return cached context
                return ctx;
            };
        }()),
        soundSet = {}
    ;

    return {
        RESTRICTED: 3,
        AUDIOTAG: 2,
        WEBAUDIO: 1,
        /**
         * Get an `AudioContext` audio51 style. This method will figure out which scenario fits
         * the current environment best. In case you find a use-case where you need to overrule
         * this automation, you can provide an override.
         * Internal caching will ensure that you can always quickly call this method to retreive
         * an `AudioContext`, override will always break the cache, but on subsequent calls will
         * be cached if the override parameter is omitted.
         * 
         * @param {int} override Force this method to return a context of your own chosing.
         */
        getContext: function( override ) {
            return getContext( override );
        },

        /**
         * Expecting a generated audio-sprite using `audiosprite`.
         * The best command-line configuration would be as follows:
         * `audiosprite -e mp3,ogg,ac3 -p mp3,ogg,ac3 -c 2 -o [output-url] [input-urls]`
         * 
         * This will generate the best covering set of sound-files, it will also make sure
         * the sound output remains in stereo. The order of the different encodings is also
         * important, as these are in order of best to worst support. Finally it will also 
         * generate the raw parts in the same 'safe' formats for use with the webaudio API.
         * 
         * @param {String} uri the location of the sprite's JSON configuration file
         * @resolves {Promise}
         */
        loadSoundSet: function( uri ) {
            var client = new XMLHttpRequest( ),
                self = this;

            return new RSVP.Promise( function( resolve, reject ) {
                
                client.open( "GET", uri, true );
                client.onload = function( ) {
                    resolve( self.parseSoundSet( JSON.parse(client.response) ) );
                };
                client.send();

            } );
        },

        /**
         * 
         * @returns {Promise}
         */
        parseSoundSet: function( newSet ) {
            var tag = document.createElement('audio'),
                i, ext, type, baseUrl, url, exts = [];

            soundSet = newSet;
            
            for ( i = 0; i < newSet.resources.length; ++i ) {
                url = newSet.resources[i];
                baseUrl = url.substr( 0, url.lastIndexOf(".") );
                ext = url.substr( baseUrl.length + 1 );
                type = fileTypes[ext];
                if (type && tag.canPlayType && tag.canPlayType(type)) {
                    break;
                }
            }

            return getContext().parse( newSet, baseUrl, ext );
        },
        
        play: function( id ) {

            return getContext().play( id );

        }

    };

});
