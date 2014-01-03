glue.module.create(
    'vendors/spine/spineable', [
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
         * @memberOf Spineable
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
                currentAnimationStr = '',
                time = new Date().getTime(),
                vertices = Array(8),
                settings,
                skeletonRectangles = {},
                cornerPoints = {},
                origins = {},
                /**
                 * Initalizes the animation
                 * @name initSpine
                 * @memberOf Spineable
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
                 * @memberOf Spineable
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
                 * @memberOf Spineable
                 * @function
                 */
                addSkeletonData = function (spineSettings) {
                    skeletonJson[currentSkeleton] = new spine.SkeletonJson(
                        new spine.AtlasAttachmentLoader(atlas[currentSkeleton])
                    );
                    if (spineSettings.skeletonResolution) {
                        skeletonJson[currentSkeleton].scale = spineSettings.skeletonResolution;
                    }

                    skeletonData[currentSkeleton] = skeletonJson[currentSkeleton].readSkeletonData(
                        Loader.getJSON(spineSettings.skeleton)
                    );
                    skeletons[currentSkeleton] = new spine.Skeleton(skeletonData[currentSkeleton]);
                    spine.Bone.yDown = true;
                    if (obj.visible) {
                        skeletons[currentSkeleton].getRootBone().x = obj.visible.getPosition().x;
                        skeletons[currentSkeleton].getRootBone().y = obj.visible.getPosition().y;
                    }
                    skeletons[currentSkeleton].updateWorldTransform();

                    stateData[currentSkeleton] = new spine.AnimationStateData(skeletonData[currentSkeleton]);
                    state[currentSkeleton] = new spine.AnimationState(stateData[currentSkeleton]);

                    calculateRectangle();
                },
                /**
                 * Calculate rectangle by setting up the skeleton once
                 * @name calculateRectangle
                 * @memberOf Spineable
                 * @function
                 */
                calculateRectangle = function () {
                    var skeleton = skeletons[currentSkeleton],
                        i = 0,
                        l = skeleton.slots.length,
                        slot = {},
                        attachment = {},
                        boneRectangle = Rectangle(0, 0, 0, 0),
                        rootBone = skeleton.getRootBone(),
                        skeletonRectangle = Rectangle(0, 0, 0, 0);
                    if (obj.visible) {
                        skeletonRectangle.x1 = obj.visible.getPosition().x;
                        skeletonRectangle.y1 = obj.visible.getPosition().y;
                    }
                    // set up the skeleton to get width/height of the sprite
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
                        skeletonRectangle.union(boneRectangle);
                    }
                    skeletonRectangles[currentSkeleton] = skeletonRectangle;
                    cornerPoints[currentSkeleton] = Vector(0, 0);
                    cornerPoints[currentSkeleton].x = skeletonRectangle.get().x1 - rootBone.x;
                    cornerPoints[currentSkeleton].y = skeletonRectangle.get().y1 - rootBone.y;
                    origins[currentSkeleton] = Vector(0, 0);
                    updateVisible();
                },
                /**
                 * Update visible component's rectangle and dimension to correct skeleton
                 * @name updateBoundingbox
                 * @memberOf Spineable
                 * @function
                 */
                updateVisible = function () {
                    var skeletonRectangle,
                        position,
                        rectangle = Rectangle(0, 0, 0, 0),
                        dimension = Vector(0, 0),
                        offset = Vector(0, 0);
                    if (obj.visible) {
                        skeletonRectangle = skeletonRectangles[currentSkeleton];
                        position = obj.visible.getPosition();
                        //rectangle = obj.visible.getBoundingBox();
                        //dimension = obj.visible.getDimension();
                        offset.x = cornerPoints[currentSkeleton].x + origins[currentSkeleton].x;
                        offset.y = cornerPoints[currentSkeleton].y + origins[currentSkeleton].y;

                        rectangle.x1 = skeletonRectangle.x1 + position.x - offset.x;
                        rectangle.y1 = skeletonRectangle.y1 + position.y - offset.y;
                        rectangle.x2 = rectangle.x1 + skeletonRectangle.getWidth();
                        rectangle.y2 = rectangle.y1 + skeletonRectangle.getHeight();

                        dimension.x = rectangle.getWidth();
                        dimension.y = rectangle.getHeight();
                    }
                },
                /**
                 * Updates the skeleton's position to set it to the object's position
                 * @name updateAnimatable
                 * @memberOf Spineable
                 * @function
                 */
                updatePosition = function () {
                    var skeleton = skeletons[currentSkeleton],
                        position = Vector(0, 0),
                        scale = Vector(1, 1);
                    if (obj.visible) {
                        position = obj.visible.getPosition();
                    }
                    if (obj.scalable) {
                        scale = obj.scalable.getScale();
                    }
                    // divide by scale here because the position is
                    // superposed inside computeVertices in the draw function
                    skeleton.getRootBone().x = position.x / scale.x;
                    skeleton.getRootBone().y = position.y / scale.y;
                };

            // - external interface -
            obj = obj || {};
            obj.spineable = {
                /**
                 * Draw the spine component
                 * @name draw
                 * @memberOf Spineable
                 * @function
                 */
                draw: function (deltaT, context, scroll) {
                    var slot = {},
                        attachment = {},
                        fx, fy, x, y, w, h,
                        px, py,
                        scaleX, scaleY,
                        scale = Vector(1, 1),
                        boneScaleX, boneScaleY,
                        angle,
                        skeleton = skeletons[currentSkeleton],
                        i = 0,
                        l = skeleton.drawOrder.length;
                    if (obj.scalable) {
                        scale = obj.scalable.getScale();
                    }
                    for (i; i < l; ++i) {
                        slot = skeleton.drawOrder[i];
                        attachment = slot.attachment;
                        if (!(attachment instanceof spine.RegionAttachment)) {
                            continue;
                        }
                        attachment.computeVertices(skeleton.x, skeleton.y, slot.bone, vertices);
                        fx = skeleton.flipX ? -1 : 1;
                        fy = skeleton.flipY ? -1 : 1;
                        x = (vertices[2] - (cornerPoints[currentSkeleton].x + origins[currentSkeleton].x) * fx) * scale.x;
                        y = (vertices[3] - (cornerPoints[currentSkeleton].y + origins[currentSkeleton].y) * fy) * scale.y;
                        w = attachment.rendererObject.width;
                        h = attachment.rendererObject.height;
                        px = attachment.rendererObject.x;
                        py = attachment.rendererObject.y;
                        scaleX = attachment.scaleX * fx * fy;
                        scaleY = attachment.scaleY * fx * fy;
                        boneScaleX = slot.bone.scaleX;
                        boneScaleY = slot.bone.scaleY;
                        angle = -(slot.bone.worldRotation + attachment.rotation) * Math.PI / 180 * fx * fy;

                        context.save();
                        context.translate(~~x, ~~y);
                        context.rotate(angle);
                        context.globalAlpha = slot.a;
                        context.scale(boneScaleX * scaleX * scale.x, boneScaleY * scaleY * scale.y);

                        context.drawImage(attachment.rendererObject.page.image, px, py, w, h, 0, 0, w, h);
                        context.restore();
                    }
                },
                /**
                 * Update the animation
                 * @name update
                 * @memberOf Spineable
                 * @function
                 */
                update: function (deltaT) {
                    var skeleton = skeletons[currentSkeleton];
                    state[currentSkeleton].update(deltaT);
                    state[currentSkeleton].apply(skeleton);
                    skeleton.updateWorldTransform();
                    updatePosition();
                    return true;
                },
                /**
                 * Setup the spineable
                 * @name setup
                 * @memberOf Spineable
                 * @function
                 */
                setup: function (s) {
                    settings = s;
                    initSpine(settings);
                },
                /**
                 * Set a new animation
                 * @name setAnimationByName
                 * @memberOf Spineable
                 * @function
                 * @param {Number} trackIndex: Track number
                 * @param {String} animationName: Name of the animation
                 * @param {Bool} loop: Wether the animation loops
                 */
                setAnimationByName: function (trackIndex, animationName, loop) {
                    currentAnimationStr = animationName;
                    state[currentSkeleton].setAnimationByName(trackIndex, animationName, loop);
                    skeletons[currentSkeleton].setSlotsToSetupPose();
                },
                /**
                 * Set a new animation if it's not playing yet, returns true if successful
                 * @name setAnimation
                 * @memberOf Spineable
                 * @function
                 * @param {String} animationName: Name of the animation
                 */
                setAnimation: function (animationName) {
                    if (currentAnimationStr === animationName) {
                        return false;
                    }
                    obj.spineable.setAnimationByName(0, animationName, true);
                    return true;
                },
                /**
                 * Get current animation being played
                 * @name getAnimation
                 * @memberOf Spineable
                 * @function
                 */
                getAnimation: function () {
                    return currentAnimationStr;
                },
                /**
                 * Retrieves the root bone object of the current skeleton
                 * @name getRootBone
                 * @memberOf Spineable
                 * @function
                 */
                getRootBone: function () {
                    return skeletons[currentSkeleton].getRootBone();
                },
                /**
                 * Gets the current skeleton scale
                 * @name getResolution
                 * @memberOf Spineable
                 * @function
                 */
                getSkeletonResolution: function () {
                    return skeletonJson[currentSkeleton].scale;
                },
                /**
                 * Mirrors the sprite in the x direction around the anchor point
                 * @name flipX
                 * @memberOf Spineable
                 * @function
                 */
                flipX: function (bool) {
                    skeletons[currentSkeleton].flipX = bool;
                },
                /**
                 * Mirrors the sprite in the y direction around the anchor point
                 * @name flipY
                 * @memberOf Spineable
                 * @function
                 */
                flipY: function (bool) {
                    skeletons[currentSkeleton].flipY = bool;
                },
                /**
                 * Adds another skeleton json to the spineable
                 * @name addSkeleton
                 * @memberOf Spineable
                 * @function
                 * @param {Object} spineSettings: object with atlasImage, atlas, skeleton and optionally scale and resolution
                 */
                addSkeleton: function (spineSettings) {
                    initSpine(spineSettings);
                },
                /**
                 * Sets the current skeleton json
                 * @name setSkeleton
                 * @memberOf Spineable
                 * @function
                 * @param {String} strSkeleton: skeleton json name (as specified in resources)
                 */
                setSkeleton: function (strSkeleton) {
                    if (currentSkeleton === strSkeleton) {
                        return;
                    }
                    currentSkeleton = strSkeleton;
                    obj.spineable.update();
                },
                /**
                 * Returns the name of the current skeleton json
                 * @name getSkeleton
                 * @memberOf Spineable
                 * @function
                 */
                getSkeleton: function () {
                    return currentSkeleton;
                },
                /**
                 * Sets the origin of the current skeleton
                 * @name setOrigin
                 * @memberOf Spineable
                 * @function
                 * @param {Object} pos: x and y position relative to the upper left corner point
                 */
                setOrigin: function (pos) {
                    origins[currentSkeleton] = pos;
                    updateVisible();
                },
                /**
                 * Gets the origin of the current skeleton
                 * @name getOrigin
                 * @memberOf Spineable
                 * @function
                 */
                getOrigin: function () {
                    return origins[currentSkeleton];
                },
                /**
                 * Resets the origin of the current skeleton to the root bone position
                 * @name resetOrigin
                 * @memberOf Spineable
                 * @function
                 */
                resetOrigin: function () {
                    origins[currentSkeleton] = {
                        x: -cornerPoints[currentSkeleton].x,
                        y: -cornerPoints[currentSkeleton].y
                    };
                    updateVisible();
                }
            };
            return obj;
        };
    }
);