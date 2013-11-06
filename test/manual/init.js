// bootstrap & mobile optimization tricks
// set game API

// config our module paths
glue.module.config({
    baseUrl: '../../js/',
    paths: {
        base: 'base',
        modules: 'modules',
        screens: 'screens',
        entities: 'entities',
        test: '../../test/manual'
    }
});

glue.module.get(['test/game'], function (Game) {
    var win = window,
        Glue = glue;

    // init game
    Game().load();
    // init input
    Glue.input.init();

    // Mobile browser hacks
        if (me.device.isMobile && !navigator.isCocoonJS) {
            // Prevent the webview from moving on a swipe
            win.document.addEventListener('touchmove', function (e) {
                e.preventDefault();
                win.scroll(0, 0);
                return false;
            }, false);

            // Scroll away mobile GUI
            (function () {
                win.scrollTo(0, 1);
                me.video.onresize(null);
            }).defer();

            Glue.event.on(me.event.WINDOW_ONRESIZE, function (e) {
                win.scrollTo(0, 1);
            });
        }
});
