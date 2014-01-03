/*global console */
/*jshint -W020*/ //ignore 'Read only' warning for overwriting Audio
/*jshint -W083*/ //ignore 'Don't create functions in loops'
/*
 *  @module Testframework
 *  @copyright (C) SpilGames
 *  @author Martin Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
/**
 * Test framework for testing audio-based code. This is no more, or less, than
 * a mock class for the AudioContext of the WebAudio API. Well, a little more,
 * as it's default destination is an analyzer node, which allows for calculation
 * on values like average volume, frequency buckets, etc...
 * Will also include a method to retrieve an Audio Element slaved to this mock so
 * that it's output can be unit-tested.
 * 
 */
var AudioTestFramework = ( function() {
    "use strict";

    var getContext = ( function( AC ){
            var ctx = null,
                get = function() {
                    if ( ctx === null ) {
                        ctx = new AC();
                    }
                    return ctx;
                };
            
            get.reset = function() {
                ctx = null;
            };
            
            return get;
        }(
            window.AudioContext || 
            window.webkitAudioContext || 
            window.mozAudioContext || 
            window.oAudioContext || 
            window.msAudioContext
        )),
        getAnalyzer = ( function() {
            
            var analyzer = null,
                get = function() {
                    if ( analyzer === null ) {
                        analyzer = getContext().createAnalyser();
                        analyzer.smoothingTimeConstant = 0; //No delays, realtime
                        analyzer.fftSize = 1024;
                    }
                    
                    return analyzer;
                }
            ;
            
            get.reset = function() {
                analyzer = null;
            };
            
            return get;
            
        }()),
        connectAudio = function( at, context ) {

            var an = getContext().createMediaElementSource( at );
    
            //console.log("connecting audio to context");
            an.connect( context.destination );
            at.pause();
            at.audionode = an;
            at.tc = context;
            at.isConnected = true;
            at.context = context;
            at.orgClone = at.cloneNode;
            at.cloneNode = function() {
                var newTag = at.orgClone();
                connectAudio( newTag, context );
                return newTag;
            }

        },
        orgContext = window.AudioContext,
        OrgAudio = Audio,
        lastContext = null,
        m
    ;

    /**
     * Constructor for test-framework.
     * This constructor will create an analyzer node to be supplied as a
     * destination instead of the built-in destination. It will still be
     * connected to the original destination, otherwise audio won't play.
     * Constructor will also overwrite the Audio constructor.
     * 
     * @constructor
     */
    function AudioContextWrapper() {
        //console.warn("Creating AudioContextWrapper!");
        this.ctx = getContext();
        this.destination = getAnalyzer();
        this.destination.connect(getContext().destination);
        lastContext = this;

        var self = this;

        /**
         * Audio constructor overwrite. This overwrite will tie the Audio-element
         * to the active analyzer node, allowing output inspection and thus being
         * able to unit-test fades, cross-overs, etc...
         * Currently fails in Safari because Safari does not support the `canplay`
         * event.
         */
        Audio = function( url ) {
            var at = new OrgAudio(  );
            at.autoplay = true;

            // Cannot attach audio tag to context before it is ready to play
            // or it won't actually attach to the context. This is a work-around
            // for a known bug.
            // More info: crbug.com/112368
            at.addEventListener("canplay", function() {
                connectAudio( at, self );
            }, 0 );

            if ( url ) {
                at.src = url;
            }

            lastContext = at;
            return at;
        };

    }

    AudioContextWrapper.prototype = {
        getContext: function() {
            return this.ctx;
        },
        /**
         * isPlaying will return true if any source in the context is
         * attempting to produce sound. Nomatter if it is or is not
         * connected to the speakers.
         */
        isPlaying: function() {
            return this.ctx.activeSourceCount > 0;
        }
    };
    
    /**
     * Attempts to get average output volume of all frequencies as
     * reported by a RealtimeAnalyzerNode. Information gained lags
     * a little, take this into account in unit-testing.
     */
    AudioContextWrapper.getVolumeAverage = function( override ) {
        var values = 0,
            array =  new Uint8Array(getAnalyzer().frequencyBinCount),
            length, average, i;

        getAnalyzer().getByteFrequencyData(array);
        length = array.length;

        // get all the frequency amplitudes
        for (i = 0; i < length; ++i) {
            values += array[i];
        }
 
        average = values / length;
        return average;
    };
    
    AudioContextWrapper.reset = function() {
        getAnalyzer.reset();
        lastContext.destination = getAnalyzer();
    };

    /**
     * Create pass-through methods for all methods on the real
     * WebAudioContext.
     */
    for ( m in getContext() ) {
        if (!Object.hasOwnProperty(m)) {
            (function( method ) { 
                //console.log('Mapping context method: ', method);
                AudioContextWrapper.prototype[method] = function() {
                    var ctx = getContext();
                    //console.log(method, arguments);
                    return ctx[method].apply( ctx, arguments );
                };
            }(m));
        }
    }

    /**
     * Restore original Objects.
     */
    AudioContextWrapper.undo = function() {
        window.AudioContext = orgContext;
        Audio = OrgAudio;
    };
    /**
     * Hijack AudioContext
     */
    window.AudioContext = AudioContextWrapper;

    /**
     * Return constructor
     */
    return AudioContextWrapper;
    
}());
