/*
 *  @module Loader
 *  @desc Used to load assets in the beginning of the game
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/loader', [
        'glue'
    ],
    function (Glue) {
        var Audio = Glue.audio,
            Sugar = Glue.sugar,
            loaded = false,
            assetCount = 0,
            loadCount = 0,
            assetPath = null,
            assets = {},
            loadedAssets = {
                image: {},
                audio: {},
                json: {},
                binary: {}
            },
            completedHandler,
            assetLoadCallback,
            percentageLoaded,
            assetLoadedHandler = function (e) {
                ++loadCount;
                percentageLoaded = Math.floor((loadCount / assetCount) * 100);
                // callback for single asset loaded
                if (Sugar.isFunction(assetLoadCallback)) {
                    assetLoadCallback(percentageLoaded);
                }
                // finish
                if (assetCount === loadCount) {
                    loaded = true;
                    if (Sugar.isFunction(completedHandler)) {
                        completedHandler();
                    }
                }
            },
            assetErrorHandler = function (name) {
                throw 'An error occurred while trying to load asset ' + name;
            },
            loadImage = function (name, source, success, failure) {
                // TODO: Implement failure
                var asset = new Image();
                asset.src = source;
                asset.addEventListener('load', success, false);
                loadedAssets.image[name] = asset;
            },
            loadAudio = function (name, source, success, failure) {
                // TODO: Implement failure
                var asset = new Audio({
                    urls: [source],
                    onload: success
                });
                loadedAssets.audio[name] = asset;
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
                            loadedAssets.json[name] = JSON.parse(xhr.responseText);
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
                        loadedAssets.binary[name] = buffer.join('');
                        success();
                    }
                };
                xhr.send();
            },
            loadAudioSprite = function (name, source, success, failure) {
                var asset,
                    object,
                    onJSONLoaded = function () {
                        object = loadedAssets.json[name + '_json'];
                        object.onload = function () {
                            loadedAssets.audio[name] = asset;
                            success();
                        };
                        asset = new Audio(object);
                        success();
                    };

                loadJSON(name + '_json', assetPath + 'json/' + source, onJSONLoaded, failure);
            },
            loadSpine = function (name, source, success, failure) {
                var imageLoaded = false,
                    jsonLoaded = false,
                    atlasLoaded = false,
                    checkReady = function () {
                        if (imageLoaded && jsonLoaded && atlasLoaded) {
                            success();
                        }
                    };
                loadImage(name, source + '.png', function () {
                    imageLoaded = true;
                    checkReady();
                }, failure);
                loadBinary(name, source + '.atlas', function () {
                    atlasLoaded = true;
                    checkReady();
                }, failure);
                loadJSON(name, source + '.json', function () {
                    jsonLoaded = true;
                    checkReady();
                }, failure);
            },
            loadAsset = function (name, type, source) {
                var asset;
                switch (type) {
                case module.ASSET_TYPE_IMAGE_REMOTE:
                    loadImage(name, source, assetLoadedHandler, assetErrorHandler);
                    break;
                case module.ASSET_TYPE_IMAGE:
                    loadImage(name, assetPath + 'image/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                case module.ASSET_TYPE_AUDIO:
                    loadAudio(name, assetPath + 'audio/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                case module.ASSET_TYPE_JSON:
                    loadJSON(name, assetPath + 'json/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                case module.ASSET_TYPE_BINARY:
                    loadBinary(name, assetPath + 'binary/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                case module.ASSET_TYPE_AUDIOSPRITE:
                    loadAudioSprite(name, source, assetLoadedHandler, assetErrorHandler);
                    break;
                case module.ASSET_TYPE_SPINE:
                    loadSpine(name, assetPath + 'spine/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                }
            },
            module = {
                ASSET_TYPE_IMAGE: 'image',
                ASSET_TYPE_AUDIO: 'audio',
                ASSET_TYPE_JSON: 'json',
                ASSET_TYPE_BINARY: 'binary',
                ASSET_TYPE_AUDIOSPRITE: 'audiosprite',
                ASSET_TYPE_SPINE: 'spine',
                ASSET_TYPE_IMAGE_REMOTE: 'remoteimage',
                /**
                 * Sets the root folder for assets
                 * @name setAssetPath
                 * @memberOf loader
                 * @function
                 * @param {String} value: path to the root of the asset folder
                 */
                setAssetPath: function (value) {
                    assetPath = value;
                },
                /**
                 * Assign assets to load for the loader
                 * @name setAssets
                 * @memberOf loader
                 * @function
                 * @param {String} type: asset type name (enumerations available)
                 * @param {Object} value: object containing key/value pairs for assets (key: asset name, value: asset path)
                 */
                setAssets: function (type, value) {
                    var asset;
                    assets[type] = value;
                    for (asset in value) {
                        if (value.hasOwnProperty(asset)) {
                            ++assetCount;
                        }
                    }
                },
                /**
                 * Load all the assets assigned by setAssets
                 * @name load
                 * @memberOf loader
                 * @function
                 * @param {Function} onReady: Callback function for completion
                 * @param {Function} onLoad: Callback function for single asset load
                 */
                load: function (onReady, onLoad) {
                    var typeList, type, name;
                    loaded = false;
                    completedHandler = onReady;
                    assetLoadCallback = onLoad;
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
                    // reset assets so it can be reused for another loading session
                    assets = {};
                },
                /**
                 * Are the assets loaded
                 * @name isLoaded
                 * @memberOf loader
                 * @function
                 * @return Boolean whether asset loading is done or not
                 */
                isLoaded: function () {
                    return loaded;
                },
                /**
                 * Gets all assets
                 * @name getAssets
                 * @memberOf loader
                 * @function
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return Object containing references to all assets
                 */
                getAssets: function () {
                    return loadedAssets;
                },
                /**
                 * Gets the image asset
                 * @name getimage
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when asset cannot be found
                 * @return Image object
                 */
                getImage: function (name) {
                    var asset = loadedAssets.image[name];
                    if (!Sugar.isDefined(asset)) {
                        throw ('Asset ' + name + ' could not be found');
                    }
                    return asset;
                },
                /**
                 * Gets the audio asset
                 * @name getAudio
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when asset cannot be found
                 * @return Audio object (depends on adapter set for audio)
                 */
                getAudio: function (name) {
                    var asset = loadedAssets.audio[name];
                    if (!Sugar.isDefined(asset)) {
                        throw ('Asset ' + name + ' could not be found');
                    }
                    return asset;
                },
                /**
                 * Gets the json asset
                 * @name getJSON
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when asset cannot be found
                 * @return JSON parsed object
                 */
                getJSON: function (name) {
                    var asset = loadedAssets.json[name];
                    if (!Sugar.isDefined(asset)) {
                        throw ('Asset ' + name + ' could not be found');
                    }
                    return asset;
                },
                /**
                 * Gets the binary asset
                 * @name getBinary
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when asset cannot be found
                 * @return Binary object
                 */
                getBinary: function (name) {
                    var asset = loadedAssets.binary[name];
                    if (!Sugar.isDefined(asset)) {
                        throw ('Asset ' + name + ' could not be found');
                    }
                    return asset;
                },
                /**
                 * Get the first asset with the provided name
                 * @name getAsset
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 */
                getAsset: function (name) {
                    if (Sugar.has(loadedAssets.image, name)) {
                        return loadedAssets.image[name];
                    } else if (Sugar.has(loadedAssets.audio, name)) {
                        return loadedAssets.audio[name];
                    } else if (Sugar.has(loadedAssets.json, name)) {
                        return loadedAssets.json[name];
                    } else if (Sugar.has(loadedAssets.binary, name)) {
                        return loadedAssets.binary[name];
                    }
                    throw ('Asset ' + name + ' could not be found');
                }
            };

        return module;
    }
);