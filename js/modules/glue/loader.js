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
            loader = document.getElementById('loader'),
            loadBar = document.getElementById('loadbar'),
            percentageBar = document.getElementById('percentagebar'),
            percentageLoaded,
            assetLoadedHandler = function (e) {
                ++loadCount;
                //console.log('Loaded ' + loadCount + ' from ' + assetCount + ' assets');
                percentageLoaded = Math.floor((loadCount / assetCount) * 100);
                if (loadBar !== null) {
                    loadBar.style.width = percentageLoaded + '%';
                }
                if (percentageBar !== null) {
                    percentageBar.innerHTML = percentageLoaded + '%';
                }
                if (assetCount === loadCount) {
                    if (loader !== null) {
                        loader.style.display = 'none';
                    }
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
                    if (percentageBar !== null) {
                        percentageBar.innerHTML = '0%';
                    }
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
