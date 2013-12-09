/*
 *  @module Loader
 *  @desc Used to load assets in the beginning of the game, shows a progress bar
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/loader',
    [
        'glue'
    ],
    function (Glue) {
        var loaded = false,
            assetCount = 0,
            loadCount = 0,
            assetPath = null,
            assets = null,
            loadedAssets = {},
            completedHandler,
            assetLoadedHandler = function (e) {
                var meter = document.getElementById('meter');
                meter.style.width = parseInt(meter.style.width) + 10 + 'px';
                ++loadCount;
                // temp console log, will be hooked to loading bar later on
                console.log('Loaded ' + loadCount + ' from ' + assetCount + ' assets');
                if (assetCount === loadCount) {
                    //document.getElementById('loadbar').style.display = 'none';
                    loaded = true;
                    completedHandler();
                }
            },
            loadAsset = function (source) {
                var asset = new Image();
                asset.src = assetPath + source;
                asset.addEventListener('load', assetLoadedHandler, false);
                return asset;
            },
            obj = {
                setAssetPath: function (value) {
                    assetPath = value;
                },
                setAssets: function (value) {
                    assets = value;
                    for (asset in assets) {
                        if (assets.hasOwnProperty(asset)) {
                            ++assetCount;
                        }
                    }
                },
                load: function (onReady) {
                    completedHandler = onReady;
                    for (asset in assets) {
                        if (assets.hasOwnProperty(asset)) {
                            loadedAssets[asset] = loadAsset(assets[asset]);
                        }
                    }
                },
                isLoaded: function () {
                    return loaded;
                },
                getAssets: function () {
                    if (!loaded) {
                        throw('Assets are not loaded yet');
                    }
                    return loadedAssets;
                },
                getAsset: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets[name];
                }
            };

        return obj;
    }
);
