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
                        if (imageLoaded && jsonLoaded && atlasLoaded)
                        success();
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
                 */
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
                    if (!loaded) {
                        throw('Assets are not loaded yet');
                    }
                    return loadedAssets;
                },
                /**
                 * Gets the image asset
                 * @name getimage
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return Image object 
                 */
                getImage: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets.image[name];
                },
                /**
                 * Gets the audio asset
                 * @name getAudio
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return Audio object (depends on adapter set for audio) 
                 */
                getAudio: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets.audio[name];
                },
                /**
                 * Gets the json asset
                 * @name getJSON
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return JSON parsed object  
                 */
                getJSON: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets.json[name];
                },
                /**
                 * Gets the binary asset
                 * @name getBinary
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return Binary object 
                 */
                getBinary: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets.binary[name];
                },
                /**
                 * Get the first asset with the provided name
                 * @name getAsset
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 */
                getAsset: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    if (Sugar.has(loadedAssets.image, name)) {
                        return loadedAssets.image[name];
                    } else if (Sugar.has(loadedAssets.audio, name)) {
                        return loadedAssets.audio[name];
                    } else if (Sugar.has(loadedAssets.json, name)) {
                        return loadedAssets.json[name];
                    } else if (Sugar.has(loadedAssets.binary, name)) {
                        return loadedAssets.binary[name];
                    }
                    throw('Asset ' + name + ' could not be found');
                }
            };

        return module;
    }
);
