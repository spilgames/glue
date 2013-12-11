module.exports = function (grunt) {
    require('matchdep').filterDev('grunt-contrib*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                files: {
                    'build/src/libraries.js': [
                        'bower_components/requirejs/require.js'
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
                        'js/modules/glue/**/**/*.js',
                        'js/modules/vendors/**/**/*.js'
                    ],
                    'build/glue.js': [
                        'build/src/libraries.js',
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
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-rev');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    // Default task(s).
    grunt.registerTask('default', [
        'clean:beforeRelease',
        'concat',
        'uglify',
        'clean:afterRelease'
    ]);
    // Default task(s).
    grunt.registerTask('dev', [
        'clean:beforeRelease',
        'concat',
        'clean:afterRelease'
    ]);
};
