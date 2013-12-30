/*global define, RSVP*/
/*
 *  @module Manager
 *  @copyright (C) 2013 SpilGames
 *  @author Martin Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
define(
    'manager',
    function() {
    'use strict';

    function getConfig( uri ) {
        return new RSVP.Promise( function( resolve, reject ) {

            var client = new XMLHttpRequest( );
            client.open( "GET", uri, true );
            client.onload = function( ) {
                resolve( JSON.parse(client.responseText) );
            };
            client.send();

        } );
    }
});
