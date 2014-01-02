glue.module.create(
    'vendors/spine/spinable', [
        'glue',
        'glue/math/rectangle',
        'glue/math/vector',
        'glue/loader'
    ],
    function (Glue, Rectangle, Vector, Loader) {
        // - cross instance private members -


        // temporary
        var assets = {},
            loadJSON = function (data, success, failure) {
                var xhr = new XMLHttpRequest();
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType('application/json');
                }
                xhr.open('GET', data.src, true);
                xhr.onerror = failure;
                xhr.ontimeout = failure;
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if ((xhr.status === 200) || ((xhr.status === 0) && xhr.responseText)) {
                            assets[data.name] = JSON.parse(xhr.responseText);
                            success();
                        } else {
                            failure();
                        }
                    }
                };
                xhr.send(null);
            },
            loadBinary = function (data, success, failure) {
                var xhr = new XMLHttpRequest(),
                    arrayBuffer,
                    byteArray,
                    buffer,
                    i = 0;

                xhr.open('GET', data.src, true);
                xhr.onerror = failure;
                xhr.responseType = 'arraybuffer';
                xhr.onload = function (e) {
                    arrayBuffer = xhr.response;
                    if (arrayBuffer) {
                        byteArray = new Uint8Array(arrayBuffer);
                        buffer = [];
                        for (i; i < byteArray.byteLength; ++i) {
                            buffer[i] = String.fromCharCode(byteArray[i]);
                        }
                        assets[data.name] = buffer.join('');
                        success();
                    }
                };
                xhr.send();
            };

        Loader.loadJSON = function (source, name, onLoad, onError) {
            loadJSON({
                name: name,
                src: source
            }, onLoad, onError);
        };
        Loader.loadBinary = function (source, name, onLoad, onError) {
            loadBinary({
                name: name,
                src: source
            }, onLoad, onError);
        };

        //load in assets 
        Loader.loadJSON('asset/capivara-skeleton.json', 'capivara_skeleton', function () {
            // console.log(assets);
        });
        Loader.loadJSON('asset/capivara-skeleton-sideview.json', 'capivara_sideview_skeleton', function () {
            // console.log(assets);
        });
        Loader.loadBinary('asset/capivara.atlas', 'capivara_atlas', function () {
            // console.log(assets);
        });
        Loader.loadBinary('asset/capivara-sideview.atlas', 'capivara_sideview_atlas', function () {
            console.log(assets);
        });

        //replacer functions for spine implementation
        Loader.getJSON = function (str) {
            return assets[str];
        };
        Loader.getBinary = function (str) {
            return assets[str];
        };
        Loader.getImage = function (str) {
            return Loader.getAsset(str);
        };


        /**
         * Constructor
         * @name
         * @memberOf Spinable
         * @function
         * @param {Object} obj: the entity object
         * @param {Object} spineSettings: contains json and atlas
         */
        return function (obj) {
            // - per instance private members -
            var sugar = Glue.sugar,
                atlas = {},
                skeletons = {},
                skeletonJson = {},
                skeletonData = {},
                stateData = {},
                state = {},
                currentSkeleton = '',
                currentAnimation = '',
                time = new Date().getTime(),
                vertices = Array(8),
                settings,
                rectangle,
                position = Vector(0, 0),
                scale = 1,  
                skeletonRectangles = {},
                cornerPoints = {}, 
                origins = {},
                /**
                 * Initalizes the animation
                 * @name initSpine
                 * @memberOf Spinable
                 * @function
                 */
                initSpine = function (spineSettings) {
                    if (!sugar.isDefined(spineSettings)) {
                        throw 'Specify settings object to Spine';                        
                    }
                    if (!sugar.isDefined(spineSettings.atlas)) {
                        throw 'Specify an atlas to settings object ';                        
                    }
                    if (!sugar.isDefined(spineSettings.atlasImage)) {
                        throw 'Specify an atlasImage to settings object ';                        
                    }
                    if (!sugar.isDefined(spineSettings.skeleton)) {
                        throw 'Specify a skeleton JSON to settings object ';                        
                    }
                    currentSkeleton = spineSettings.skeleton;
                    addAtlas(spineSettings);
                    addSkeletonData(spineSettings);
                },
                /**
                 * Loads the atlas data
                 * @name loadAtlas
                 * @memberOf Spinable
                 * @function
                 */
                addAtlas = function (spineSettings) {
                    var atlasText = Loader.getBinary(spineSettings.atlas),
                        p = {},
                        image = spineSettings.atlasImage;
                    atlas[currentSkeleton] = new spine.Atlas(atlasText, {
                        load: function (page, path) {
                            var texture = Loader.getImage(image);
                            page.image = texture;
                            page.width = texture.width;
                            page.height = texture.height;
                            p = page;
                        }
                    });
                    atlas[currentSkeleton].updateUVs(p);
                },
                /**
                 * Adds the skeleton data to arrays
                 * @name addSkeletonData
                 * @memberOf Spinable
                 * @function
                 */
                addSkeletonData = function (spineSettings) {
                    var skeleton;
                    skeletonJson[currentSkeleton] = new spine.SkeletonJson(
                        new spine.AtlasAttachmentLoader(atlas[currentSkeleton])
                    );
                    if (spineSettings.resolution) {
                        skeletonJson[currentSkeleton].scale = spineSettings.resolution;
                    }

                    skeletonData[currentSkeleton] = skeletonJson[currentSkeleton].readSkeletonData(
                        Loader.getJSON(spineSettings.skeleton)
                    );
                    skeletons[currentSkeleton] = new spine.Skeleton(skeletonData[currentSkeleton]);
                    skeleton = skeletons[currentSkeleton];
                    spine.Bone.yDown = true;
                    skeleton.getRootBone().x = position.x;
                    skeleton.getRootBone().y = position.y;
                    skeleton.updateWorldTransform();

                    stateData[currentSkeleton] = new spine.AnimationStateData(skeletonData[currentSkeleton]);
                    state[currentSkeleton] = new spine.AnimationState(stateData[currentSkeleton]);

                    calculateRectangle();
                },
                /**
                 * Calculate rectangle by setting up the skeleton once
                 * @name calculateRectangle
                 * @memberOf Spinable
                 * @function
                 */
                calculateRectangle = function () {
                    var skeleton = skeletons[currentSkeleton]
                        i = 0,
                        l = skeleton.slots.length,
                        slot = {},
                        attachment = {},
                        boneRectangle = Rectangle(0, 0, 0, 0);
                    // set up the skeleton to get width/height of the sprite
                    skeletonRectangles[currentSkeleton] = Rectangle(position.x, position.y, 0, 0);
                    for (i; i < l; ++i) {
                        slot = skeleton.slots[i];
                        attachment = slot.attachment;
                        if (!(attachment instanceof spine.RegionAttachment)) {
                            continue;
                        }
                        attachment.computeVertices(skeleton.x, skeleton.y, slot.bone,
                            vertices);
                        boneRectangle.setWidth(attachment.width);
                        boneRectangle.setHeight(attachment.height);
                        boneRectangle.get().x1 = vertices[2];
                        boneRectangle.get().y1 = vertices[3];
                        skeletonRectangles[currentSkeleton].union(boneRectangle);
                    }
                    cornerPoints[currentSkeleton] = {
                        x: 0,
                        y: 0
                    };
                    cornerPoints[currentSkeleton].x = skeletonRectangles[currentSkeleton].get().x1 - skeleton.getRootBone()
                        .x;
                    cornerPoints[currentSkeleton].y = skeletonRectangles[currentSkeleton].get().y1 - skeleton.getRootBone()
                        .y;
                    origins[currentSkeleton] = {
                        x: 0,
                        y: 0
                    };
                    updateBoundingBox();
                },
                /**
                 * Update rectangle to correct skeleton
                 * @name updateBoundingbox
                 * @memberOf Spinable
                 * @function
                 */
                updateBoundingBox = function () {
                    rectangle = skeletonRectangles[currentSkeleton];
                };

            // - external interface -
            obj = obj || {};
            obj.spinable = {
                /**
                 * Draw the animatable component
                 * @name drawAnimatable
                 * @memberOf Spinable
                 * @function
                 */
                draw: function (deltaT, context, scroll) {
                    var slot = {},
                        attachment = {},
                        fx, fy, x, y, w, h,
                        px, py,
                        scaleX, scaleY,
                        boneScaleX, boneScaleY,
                        angle,
                        skeleton = skeletons[currentSkeleton],
                        i = 0,
                        l = skeleton.drawOrder.length;
                    for (i; i < l; ++i) {
                        slot = skeleton.drawOrder[i];
                        attachment = slot.attachment;
                        if (!(attachment instanceof spine.RegionAttachment)) {
                            continue;
                        }
                        attachment.computeVertices(skeleton.x, skeleton.y, slot.bone,vertices);
                        fx = skeleton.flipX ? -1 : 1;
                        fy = skeleton.flipY ? -1 : 1;
                        x = (vertices[2] - (cornerPoints[currentSkeleton].x + origins[currentSkeleton].x) * fx) * scale;
                        y = (vertices[3] - (cornerPoints[currentSkeleton].y + origins[currentSkeleton].y) * fy) * scale;
                        w = attachment.rendererObject.width;
                        h = attachment.rendererObject.height;
                        px = attachment.rendererObject.x;
                        py = attachment.rendererObject.y;
                        scaleX = attachment.scaleX;
                        scaleY = attachment.scaleY;
                        boneScaleX = slot.bone.scaleX;
                        boneScaleY = slot.bone.scaleY;
                        angle = -(slot.bone.worldRotation + attachment.rotation) * Math.PI / 180;
                        if (skeleton.flipX) {
                            scaleX *= -1;
                            angle *= -1;
                        }
                        if (skeleton.flipY) {
                            scaleY *= -1;
                            angle *= -1;
                        }
                        context.save();
                        context.translate(~~x, ~~y);
                        context.rotate(angle);
                        context.globalAlpha = slot.a;
                        context.scale(boneScaleX * scaleX * scale, boneScaleY * scaleY * scale);

                        context.drawImage(attachment.rendererObject.page.image, px, py, w, h, 0, 0, w, h);
                        context.restore();
                    }
                },
                /**
                 * Update the animation
                 * @name update
                 * @memberOf Spinable
                 * @function
                 */
                update: function (deltaT) {
                    var skeleton=skeletons[currentSkeleton];
                    state[currentSkeleton].update(deltaT);
                    state[currentSkeleton].apply(skeleton);
                    skeleton.updateWorldTransform();
                    obj.spinable.updatePosition();
                    return true;
                },
                /**
                 * Setup the spinable
                 * @name updateAnimatable
                 * @memberOf Spinable
                 * @function
                 */
                setup: function (s) {
                    settings = s;
                    position = settings.position;
                    initSpine(settings);
                },
                /**
                 * Set a new animation
                 * @name drawAnimatable
                 * @memberOf Spinable
                 * @function
                 * @param {Number} trackIndex: Track number
                 * @param {String} animationName: Name of the animation
                 * @param {Bool} loop: Wether the animation loops
                 */
                setAnimationByName: function (trackIndex, animationName, loop) {
                    currentAnimation = animationName;
                    state[currentSkeleton].setAnimationByName(trackIndex, animationName, loop);
                    skeletons[currentSkeleton].setSlotsToSetupPose();
                },
                /**
                 * Set a new animation if it's not playing yet, returns true if successful
                 * @name drawAnimatable
                 * @memberOf Spinable
                 * @function
                 * @param {String} animationName: Name of the animation
                 */
                setAnimation: function (animationName) {
                    if (currentAnimation === animationName) {
                        return false;
                    }
                    obj.spinable.setAnimationByName(0, animationName, true);
                    return true;
                },
                /**
                 * Get current animation
                 * @name drawAnimatable
                 * @memberOf Spinable
                 * @function
                 */
                getAnimation: function () {
                    return currentAnimation;
                },
                /**
                 * Updates the animations's position to set it to the object's position
                 * @name updateAnimatable
                 * @memberOf Spinable
                 * @function
                 */
                updatePosition: function () {
                    // divide by scale here because the position is
                    // superposed inside computeVertices in the draw function
                    var skeleton = skeletons[currentSkeleton];
                    skeleton.getRootBone().x = position.x / scale;
                    skeleton.getRootBone().y = position.y / scale;
                },
                /**
                 * Retrieves world position of the animatable
                 * @name getAnimatablePosition
                 * @memberOf Spinable
                 * @function
                 */
                getAnimatablePosition: function () {
                    var skeleton = skeletons[currentSkeleton];
                    return {
                        x: (skeleton.getRootBone().x) * scale,
                        y: (skeleton.getRootBone().y) * scale
                    };
                },
                /**
                 * Retrieves the root bone object
                 * @name getRootBone
                 * @memberOf Spinable
                 * @function
                 */
                getRootBone: function () {
                    return skeletons[currentSkeleton].getRootBone();
                },
                /**
                 * Gets the current skeleton scale
                 * @name getResolution
                 * @memberOf Spinable
                 * @function
                 */
                getResolution: function () {
                    return skeletonJson[currentSkeleton].scale;
                },
                /**
                 * Gets the current sprite scale
                 * @name getScale
                 * @memberOf Spinable
                 * @function
                 */
                getScale: function () {
                    return scale;
                },
                /**
                 * Sets the current sprite scale
                 * @name setScale
                 * @memberOf Spinable
                 * @function
                 * @param {Number} s: the scale of the sprite to set
                 */
                setScale: function (s) {
                    scale = s;
                    updateBoundingBox();
                },
                /**
                 * Mirrors the sprite in the x direction around the anchor point
                 * @name flipX
                 * @memberOf Spinable
                 * @function
                 */
                flipX: function (bool) {
                    skeletons[currentSkeleton].flipX = bool;
                },
                /**
                 * Mirrors the sprite in the y direction around the anchor point
                 * @name flipY
                 * @memberOf Spinable
                 * @function
                 */
                flipY: function (bool) {
                    skeletons[currentSkeleton].flipY = bool;
                },
                /**
                 * Adds another skeleton json to the animatable
                 * @name addSkeleton
                 * @memberOf Spinable
                 * @function
                 * @param {Object} spineSettings: object with atlasImage, atlas, skeleton and optionally scale and resolution
                 */
                addSkeleton: function (spineSettings) {
                    initSpine(spineSettings);
                },
                /**
                 * Sets the current skeleton json
                 * @name setSkeleton
                 * @memberOf Spinable
                 * @function
                 * @param {String} strSkeleton: skeleton json name (as specified in resources)
                 */
                setSkeleton: function (strSkeleton) {
                    if (currentSkeleton === strSkeleton) {
                        return;
                    }
                    currentSkeleton = strSkeleton;
                    obj.spinable.update();
                },
                /**
                 * Returns the name of the current skeleton json
                 * @name getSkeleton
                 * @memberOf Spinable
                 * @function
                 */
                getSkeleton: function () {
                    return currentSkeleton;
                },
                /**
                 * Sets the anchor point
                 * @name setAnchorPoint
                 * @memberOf Spinable
                 * @function
                 * @param {Number} s: the scale of the sprite to set
                 */
                setAnchorPoint: function (pos) {
                    origins[currentSkeleton] = pos;
                    updateBoundingBox();
                },
                /**
                 * Gets the anchor point
                 * @name getAnchorPoint
                 * @memberOf Spinable
                 * @function
                 */
                getAnchorPoint: function () {
                    return origins[currentSkeleton];
                },
                /**
                 * Resets the anchor point to the root bone position
                 * @name resetAnchorPoint
                 * @memberOf Spinable
                 * @function
                 */
                resetAnchorPoint: function () {
                    origins[currentSkeleton] = {
                        x: -cornerPoints[currentSkeleton].x,
                        y: -cornerPoints[currentSkeleton].y
                    };
                    updateBoundingBox();
                },
                /**
                 * Get initial rectangle defined by the sprite
                 * @name getskeletonRectangle
                 * @memberOf Spinable
                 * @function
                 */
                getskeletonRectangle: function () {
                    return skeletonRectangles[currentSkeleton];
                }
            };
            return obj;
        };
    }
);