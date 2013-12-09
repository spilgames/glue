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
                ++loadCount;
                // temp console log, will be hooked to loading bar later on
                console.log('Loaded ' + loadCount + ' from ' + assetCount + ' assets');
                var percentage = ((loadCount / assetCount) * 100).toFixed();
                document.getElementById('loaded').style.width = percentage + '%';

                if (assetCount === loadCount) {
                    //document.getElementById('loadbar').style.display = 'none';
                    loaded = true;
                    console.log('done')
                    //completedHandler();
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

/*
var AssetManager = function()
{
    var _oInstance = null;

    return new function()
    {
        this.Instance = function()
        {
            if ( _oInstance == null )
            {
                _oInstance = new AssetManager();
                _oInstance.constructor = null;
            }
            return _oInstance;
        }
    };

    function AssetManager()
    {
        var sources = {
            player_stand_up: 'stand-up.gif',
            player_stand_right: 'stand-right.gif',
            player_stand_down: 'stand-down.gif',
            player_stand_left: 'stand-left.gif',
            player_stand_down_left: 'stand-down-left.gif',
            player_stand_down_right: 'stand-down-right.gif',
            player_walk_up: 'stand-up.gif',
            player_walk_right: 'walk-right.gif',
            player_walk_down: 'stand-down.gif',
            player_walk_left: 'walk-left.gif'
        }
        var _sBasePath = '../../example/';
        var _sImagePath = _sBasePath + 'image/player/';

        var images = [];

        function _loadImage(source) {
            var image = new Image();
            image.src = _sImagePath + source;
            return image;
        };

        this.loadImages = function (callback) {
            var loadedImages = 0;
            var numImages = 0;
            for (var src in sources) {
                ++numImages;
            }

            for(var src in sources) {
                images[src] = new Image();
                images[src].onload = function() {
                    if (++loadedImages >= numImages) {
                        callback(images);
                    }
                };
                if (src !== 'mix')
                images[src].src = _sImagePath + sources[src];
            }
        }

        this.get = function( sName )
        {
            var oAsset = images[sName];
            if ( oAsset != null && oAsset != '' )
            {
                return oAsset;
            }
            return false;
        };

    };

}();
*/