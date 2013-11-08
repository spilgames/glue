/**
 *  @desc Tests for Spilgames adapter
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
(function (SpilgamesAdapter, MelonJS) {
    describe('base.glue.adapters.spilgames', function () {
        'use strict';
        describe('Creation', function () {
            describe('.name', function () {
                it('Shoud be able to load the spilgames adapter', function () {
                    expect(SpilgamesAdapter.name).toBe('Spilgames-adapter');
                });
            });
        });

    });
}(adapters.spilgames, me));
