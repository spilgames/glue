/**
 *  @module Director
 *  @desc Directs a game
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 *  TODO: add scenes
 */
glue.module.create(
    'glue/director',
    [
        'glue',
        'glue/game',
        'glue/screen'
    ],
    function (Glue, Game, Screen) {
        'use strict';
        var Sugar = Glue.sugar,
            screens = [],
            cache = {},
            getScreen = function (name) {
                var i = 0,
                    l = screens.length,
                    foundScreen;

                for (i; i < l; ++i) {
                    console.log(name, screens[i].getName())
                    console.log(screens)
                    if (screens[i].getName && screens[i].getName() === name) {
                        foundScreen = screens[i];
                        console.log('found...')
                        break;
                    }
                }
                return foundScreen;
            },
            object = {
                addScreen: function (screen) {
                    if (Sugar.isObject(screen)) {
                        screens.push(screen);
                    }                    
                },
                getScreens: function () {
                    return screens;
                },
                displayScreen: function (name) {
                    var screen,
                        components,
                        i = 0,
                        l;

                    if (Sugar.isString(name)) {
                        if (cache[name]) {
                            screen = cache[name]
                        } else {
                            screen = getScreen(name);
                        }
                        components = screen.getComponents();
                        l = components.length;
                        for (i; i < l; ++i) {
                            Game.add(components[i]);
                        }
                    }
                },
                hideScreen: function (name) {
                    var screen,
                        components,
                        i = 0,
                        l;

                    if (Sugar.isString(name)) {
                        screen = getScreen(name);
                        if (screen.cached()) {
                            cache[name] = screen;
                        }
                        components = screen.getComponents();
                        l = components.length;
                        for (i; i < l; ++i) {
                            Game.remove(components[i]);
                        }
                    }
                }
            };
        return object;
    }
);
