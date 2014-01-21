module.exports = function (grunt) {
    // Load Grunt tasks declared in the package.json file
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'regex-replace': {
            head: {
                src: ['bower_components/howler/howler.js'],
                actions: [
                    {
                        name: 'name anonymous define',
                        search: new RegExp(
                        /define\(function/g),
                        replace: function () {
                            return 'define(\'howler\', function';
                        }
                    }
                ]
            }
        },
        concat: {
            dist: {
                files: {
                    'build/src/vendors.js': [
                        'bower_components/requirejs/require.js',
                        'bower_components/spine/spine-js/spine.js',
                        'bower_components/howler/howler.js'
                    ],
                    'build/src/adapters.js': [
                        'js/adapters/**/*'
                    ],
                    'build/src/base.js': [
                        'js/glue.js'
                    ],
                    'build/src/sugar.js': [
                        'js/modules/glue/sugar.js'
                    ],
                    'build/src/modules.js': [
                        'js/modules/spilgames/**/**/*.js',
                        'js/modules/glue/**/**/**/*.js',
                        'js/modules/vendors/**/**/*.js'
                    ],
                    'build/glue.js': [
                        'build/src/vendors.js',
                        'build/src/sugar.js',
                        'build/src/adapters.js',
                        'build/src/base.js',
                        'build/src/modules.js'
                    ]
                }
            },
        },
        uglify: {
            dist: {
                files: {
                    'build/glue.min.js': [
                        'build/glue.js'
                    ]
                }
            }
        },
        clean: {
            beforeRelease: [
                'build/**/*.js'
            ],
            afterRelease: [
                'build/src'
            ]
        }
    });

    // Load the plugins.
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    // Default task(s).
    grunt.registerTask('default', [
        'clean:beforeRelease',
        'regex-replace',
        'concat',
        'uglify',
        'clean:afterRelease'
    ]);
    // Default task(s).
    grunt.registerTask('dev', [
        'clean:beforeRelease',
        'regex-replace',
        'concat',
        'clean:afterRelease'
    ]);
};
