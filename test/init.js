(function () {
    var i, l,
        //  Add includes and test specification scripts here
        testScripts = [
            // jasmine
            '../bower_components/jasmine/lib/jasmine-core/jasmine.js',
            '../bower_components/jasmine/lib/jasmine-core/jasmine-html.js',
            // plugins/helpers
            'plugins/plugins.js',
            'spec/spechelper.js',
            // glue
            '../build/glue.js',
            // specs for wrapped functionality (glue internals)
            'spec/adapters/melonjs.js',
            'spec/modules/glue/sugar.js'
        ],
        // glue specs
        specs = [
            //'spec/api',
            'spec/modules/spilgames/entity/behaviour/mixin',
            'spec/modules/spilgames/entity/behaviour/clickable',
            'spec/modules/spilgames/entity/behaviour/draggable',
            'spec/modules/spilgames/entity/behaviour/droptarget',
            'spec/modules/spilgames/entity/behaviour/hoverable',

            //'spec/modules/glue/component/mixin',
            //'spec/modules/glue/component/clickable',
            //'spec/modules/glue/component/draggable',
            //'spec/modules/glue/component/droptarget',
            //'spec/modules/glue/component/hoverable',
            
            //'spec/modules/glue/component/base',
            //'spec/modules/glue/component/visible',
            //'spec/modules/glue/component/mix',
            'spec/backend/api.js',
            'spec/game/clickthrough'
        ],
        // enable game canvas below for debugging
        showCanvas = false,
        useGlueEngine = false,
        loadCount = 0,
        game = {},

        // TODO: changes all of this to using glue instead of melon directly

        initMelon = function (callback) {
            game.PlayScreen = me.ScreenObject.extend({
                /** 
                 *  action to perform on state change
                 */
                onResetEvent: function() {
                    // clear the background
                    me.game.add(new me.ColorLayer('background', '#000000', 0), 0);
                    if (!showCanvas) {
                        me.video.getScreenCanvas().style.display = 'none';
                    }
                    callback();
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

            me.loader.onload = function () {
                me.state.set(me.state.PLAY, new game.PlayScreen());
                me.state.change(me.state.PLAY);
            };

            me.loader.preload([
                {name: 'door',  type: 'image', src: 'data/img/sprites/door.png'},
                {name: 'kitty', type: 'image', src: 'data/img/sprites/kitty.png'},
                {name: 'leftButton', type: 'image', src: 'data/img/gui/left-button.png'},
                {name: 'rightButton', type: 'image', src: 'data/img/gui/right-button.png'},
                {name: 'hallway_level_tiles',  type: 'image', src: 'data/img/maps/hallway_level_tiles.png'},
                {name: 'hallway', type: 'tmx', src: 'data/map/hallway.tmx'}
            ]);
        },
        // loads the Jasmine environment, runs tests
        loadJasmine = function () {
            // get the environment
            var environment = jasmine.getEnv();
            // add the reporter
            environment.addReporter(new jasmine.HtmlReporter());
            // exectute the tests
            environment.execute();
        },
        // called when a spec is loaded
        callback = function () {
            ++loadCount;
            if (loadCount === testScripts.length) {
                // init MelonJS
                window.onReady(function onReady() {
                    // config our module paths
                    glue.module.config({
                        baseUrl: '../js/',
                        paths: {
                            base: 'base',
                            modules: 'modules',
                            screens: 'screens',
                            entities: 'entities',
                            spec: '../test/spec'
                        }
                    });
                    // load non spec module dependencies
                    specs.unshift('glue');
                    specs.unshift('glue/game');
                    // load spec modules
                    glue.module.get(
                        specs,
                        function (GlueGame, Glue) {
                            // init Glue Game (temp)
                            if (useGlueEngine) {
                                window['gg'] = GlueGame(window, 'canvas');
                                // load jasmine
                                loadJasmine();
                                return;
                            }
                            // init used engines
                            initMelon(function () {
                                // initialize glue input system
                                Glue.input.init();

                                Glue.levelManager.loadLevel('hallway');
                                // Mobile browser hacks
                                if (me.device.isMobile && !navigator.isCocoonJS) {
                                    // Prevent the webview from moving on a swipe
                                    window.document.addEventListener('touchmove', function (e) {
                                        e.preventDefault();
                                        windown.scroll(0, 0);
                                        return false;
                                    }, false);

                                    window.document.addEventListener('touchstart', function (e) {
                                        e.preventDefault();
                                        return false;
                                    }, false);

                                    // Scroll away mobile GUI
                                    (function () {
                                        window.scrollTo(0, 1);
                                        me.video.onresize(null);
                                    }).defer();

                                    Glue.event.on(me.event.WINDOW_ONRESIZE, function (e) {
                                        window.scrollTo(0, 1);
                                    });
                                }
                                // load jasmine
                                loadJasmine();
                            });
                        }
                    );
                });
            }
        };
    // load includes and test scripts
    for (i = 0, l = testScripts.length; i < l; ++i) {
        var script = document.createElement('script');
        // create script and append to head
        script.src = testScripts[i];
        script.async = false;
        document.head.appendChild(script);
        // call the callback function when a script is loaded
        script.onreadystatechange = script.onload = function () {
            var state = script.readyState;
            if (!state || /loaded|complete/.test(state)) {
                callback();
            }
        };
    }
}());
