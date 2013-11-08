glue.module.create(function () {
    var Loader = glue.loader,
        State = glue.state;

    return function () {
        return {
            // run on page load.
            load: function () {
                game.PlayScreen = me.ScreenObject.extend({
                    /** 
                     *  action to perform on state change
                     */
                    onResetEvent: function() {
                        // clear the background
                        me.game.add(new me.ColorLayer('background', '#000000', 0), 0);
                    }
                });

                // Initialize the video, set scale to 1 to get accurate test results
                if (!me.video.init('screen', 1024, 768, true, 1)) {
                    alert('Your browser does not support HTML5 canvas.');
                    return;
                }
                // add '#debug' to the URL to enable the debug Panel
                if (document.location.hash === '#debug') {
                    window.onReady(function () {
                        me.plugin.register.defer(debugPanel, 'debug');
                    });
                }
                // Initialize the audio
                me.audio.init('mp3,ogg');
                // switch to the Play Screen
                me.state.set(me.state.PLAY, new game.PlayScreen());
                // start the game
                State.change(me.state.PLAY);
            }
        };
    };
});
