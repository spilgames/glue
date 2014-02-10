/*
 *  @module Loader
 *  @desc Used to load assets in the beginning of the game, shows a progress bar
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/loader',
    [
        'glue'
    ],
    function (Glue) {
        var Audio = Glue.audio,
            loaded = false,
            assetCount = 0,
            loadCount = 0,
            assetPath = null,
            assets = {},
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
            assetErrorHandler = function (name) {
                throw 'An error occurred while trying to load asset ' + name;
            },
            loadImage = function (name, source, success, failure) {
                // TODO: Implement failure
                var asset = new Image();
                asset.src = assetPath + 'image/' + source;
                asset.addEventListener('load', success, false);
                loadedAssets[name] = asset;
            },
            loadAudio = function (name, source, success, failure) {
                // TODO: Implement failure
                var asset = new Audio({
                    urls: [assetPath + 'audio/' + source],
                    onload: success
                });
                loadedAssets[name] = asset;
            },            
            loadJSON = function (name, source, success, failure) {
                var xhr = new XMLHttpRequest();
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType('application/json');
                }
                xhr.open('GET', source, true);
                xhr.onerror = function () {
                    failure(name);
                };
                xhr.ontimeout = function () {
                    failure(name);
                };
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if ((xhr.status === 200) || ((xhr.status === 0) && xhr.responseText)) {
                            loadedAssets[name] = JSON.parse(xhr.responseText);
                            success();
                        } else {
                            failure(name);
                        }
                    }
                };
                xhr.send(null);
            },
            loadBinary = function (name, source, success, failure) {
                var xhr = new XMLHttpRequest(),
                    arrayBuffer,
                    byteArray,
                    buffer,
                    i = 0;

                xhr.open('GET', source, true);
                xhr.onerror = function () {
                    failure(name);
                };
                xhr.responseType = 'arraybuffer';
                xhr.onload = function (e) {
                    arrayBuffer = xhr.response;
                    if (arrayBuffer) {
                        byteArray = new Uint8Array(arrayBuffer);
                        buffer = [];
                        for (i; i < byteArray.byteLength; ++i) {
                            buffer[i] = String.fromCharCode(byteArray[i]);
                        }
                        loadedAssets[name] = buffer.join('');
                        success();
                    }
                };
                xhr.send();
            },
            loadAsset = function (name, type, source) {
                var asset;
                switch (type) {
                    case module.ASSET_TYPE_IMAGE:
                        loadImage(name, source, assetLoadedHandler, assetErrorHandler);
                    break;
                    case module.ASSET_TYPE_AUDIO:
                        loadAudio(name, source, assetLoadedHandler, assetErrorHandler);
                    break;
                    case module.ASSET_TYPE_JSON:
                        loadJSON(name, source, assetLoadedHandler, assetErrorHandler);
                    break;
                    case module.ASSET_TYPE_BINARY:
                        loadBinary(name, source, assetLoadedHandler, assetErrorHandler);
                    break;
                }
            },
            module = {
                ASSET_TYPE_IMAGE: 'image',
                ASSET_TYPE_AUDIO: 'audio',
                ASSET_TYPE_JSON: 'json',
                ASSET_TYPE_BINARY: 'binary',
                setAssetPath: function (value) {
                    assetPath = value;
                },
                setAssets: function (type, value) {
                    assets[type] = value;
                    for (asset in value) {
                        if (value.hasOwnProperty(asset)) {
                            ++assetCount;
                        }
                    }
                },
                load: function (onReady) {
                    var typeList;
                    if (percentageBar !== null) {
                        percentageBar.innerHTML = '0%';
                    }
                    completedHandler = onReady;
                    for (type in assets) {
                        if (assets.hasOwnProperty(type)) {
                            typeList = assets[type];
                            for (name in typeList) {
                                if (typeList.hasOwnProperty(name)) {
                                    loadAsset(name, type, typeList[name]);
                                }
                            }
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

        return module;
    }
);
