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
        ],
        // glue specs
        specs = [
            'spec/modules/glue/example'
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
                // load spec modules
                glue.module.get(
                    specs,
                    function (Game, Glue) {
                        Game.setup({
                            canvas: {
                                id: 'canvas',
                                dimension: {
                                    width: 800,
                                    height: 600
                                }
                            }
                        }, function () {
                            // load jasmine
                            loadJasmine();
                        });
                        return;
                    }
                );
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
