/*global define, RSVP*/
/*
 *  @module Sound
 *  @copyright (C) 2013 SpilGames
 *  @author Martin Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
define('webaudio/sound', function() {
    'use strict';
    
    var Sound = function( buffer, ctx ) {
            var n = createBufferSource( buffer, ctx );
            return {
                play: function() {
                    play( n );
                },
                stop: function() {
                    n = stop( n, buffer, ctx );
                },
                getLength: function() {
                    return getLength( n );
                },
                loop: function( value ) {
                    loop( n, value );
                }
            }
        },
        createBufferSource = function( buffer, context ) {
            var node = context.createBufferSource();
            node.buffer = buffer;
            node.connect(context.destination);
            return node;
        },
        play = function( node ) {
            //Connect to speakers
            if ( node.start ) {
                node.start( 0 );
            } else {
                node.noteOn( 0 );
            }
        },
        stop = function( node, buffer, ctx ) {
            if ( node.stop ) {
                node.stop( 0 );
            } else {
                node.noteOff( 0 );
            }
            //Disconnect from speakers, allow garbage collection
            node.disconnect();
            //Create new buffersource so we can fire this sound again
            return createBufferSource( buffer, ctx );
        },
        getLength = function( node ) {
            return node.buffer.length / node.buffer.sampleRate;
        },
        loop = function( node, value ) {
            node.loop = value;
        }
    ;

    return Sound;

});
