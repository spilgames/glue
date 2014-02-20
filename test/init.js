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
            '../build/glue.js'
            //'../build/glue.min.js'
        ],
        init = function () {
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
        },
        // glue specs
        specs = [
            'spec/modules/glue/baseobject.js',
            'spec/modules/glue/component/spritable.js',
            'spec/modules/glue/sugar.js'
        ],
        // enable game canvas below for debugging
        showCanvas = false,
        loadCount = 0,
        game = {},
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
                specs.unshift('glue/math/dimension');
                // load spec modules
                glue.module.get(
                    specs,
                    function (Dimension, Game, Glue) {
                        Game.setup({
                            game: {
                                name: 'Director'
                            },
                            canvas: {
                                id: 'canvas',
                                dimension: Dimension(800, 600)
                            },
                            asset: {
                                path: '../example/',
                                image: {
                                    glue: 'glue-logo.png',
                                    spil: 'spil-logo.png',
                                    dog: 'dog-sit.png'
                                }
                            }
                        }, function () {
                            document.getElementById('canvas').style.display = 'none';
                            loadJasmine();
                        });
                    }
                );
            }
        };

    init();
}());
