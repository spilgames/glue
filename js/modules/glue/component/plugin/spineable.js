glue.module.create(
    'glue/component/plugin/spineable', [
        'glue',
        'glue/math/rectangle',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/loader'
    ],
    function (Glue, Rectangle, Vector, Dimension, Loader) {
        // - cross instance private members -

        /**
         * Constructor
         * @name
         * @memberOf Spineable
         * @function
         * @param {Object} obj: the entity object
         * @param {Object} spineSettings: contains json and atlas
         */
        return function (object) {
            // - per instance private members -
            var Sugar = Glue.sugar,
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
                rectangle = Rectangle(0, 0, 0, 0),
                skeletonRectangles = {},
                cornerPoints = {},
                origins = {},
                // remembers the skeleton attached to the animation
                animations = {},
                /**
                 * Initalizes the animation
                 * @name initSpine
                 * @memberOf Spineable
                 * @function
                 */
                initSpine = function (spineSettings) {
                    var i = 0;
                    if (!Sugar.isDefined(spineSettings)) {
                        throw 'Specify settings object to Spine';
                    }
                    if (!Sugar.isDefined(spineSettings.assets)) {
                        throw 'Specify assets to Spine';
                    }
                    // convert to array of strings
                    if (typeof spineSettings.assets === 'string') {
                        spineSettings.assets = [spineSettings.assets];
                    }
                    for (i; i < spineSettings.assets.length; ++i) {
                        currentSkeleton = spineSettings.assets[i];
                        addAtlas(spineSettings.assets[i]);
                        addSkeletonData(spineSettings.assets[i]);
                    }
                    if (spineSettings.position && object.visible) {
                        object.visible.setPosition(spineSettings.position);
                    }
                    // set skeleton back to first specified
                },
                /**
                 * Loads the atlas data
                 * @name loadAtlas
                 * @memberOf Spineable
                 * @function
                 */
                addAtlas = function (assetName) {
                    var atlasText = Loader.getBinary(assetName),
                        p = {},
                        image = Loader.getImage(assetName);
                    atlas[currentSkeleton] = new spine.Atlas(atlasText, {
                        load: function (page, path) {
                            var texture = image;
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
                addSkeletonData = function (assetName) {
                    var i = 0,
                        name;
                    skeletonJson[currentSkeleton] = new spine.SkeletonJson(
                        new spine.AtlasAttachmentLoader(atlas[currentSkeleton])
                    );
                    if (settings.skeletonResolution) {
                        skeletonJson[currentSkeleton].scale = settings.skeletonResolution;
                    }

                    skeletonData[currentSkeleton] = skeletonJson[currentSkeleton].readSkeletonData(
                        Loader.getJSON(assetName)
                    );
                    skeletons[currentSkeleton] = new spine.Skeleton(skeletonData[currentSkeleton]);
                    spine.Bone.yDown = true;
                    if (object.visible) {
                        skeletons[currentSkeleton].getRootBone().x = object.visible.getPosition().x;
                        skeletons[currentSkeleton].getRootBone().y = object.visible.getPosition().y;
                    }
                    skeletons[currentSkeleton].updateWorldTransform();

                    stateData[currentSkeleton] = new spine.AnimationStateData(skeletonData[currentSkeleton]);
                    state[currentSkeleton] = new spine.AnimationState(stateData[currentSkeleton]);

                    // remember which animations belong to which animation
                    for (i; i < skeletonData[currentSkeleton].animations.length; ++i) {
                        name = skeletonData[currentSkeleton].animations[i].name;
                        if (Sugar.has(animations, name)) {
                            throw ('Animation with name ' + name + ' already exists');
                        }
                        animations[name] = currentSkeleton;
                    }
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
                    if (object.visible) {
                        skeletonRectangle.x1 = object.visible.getPosition().x;
                        skeletonRectangle.y1 = object.visible.getPosition().y;
                    }
                    // set up the skeleton to get width/height of the sprite
                    for (i; i < l; ++i) {
                        slot = skeleton.slots[i];
                        attachment = slot.attachment;
                        if (!(attachment instanceof spine.RegionAttachment)) {
                            continue;
                        }
                        attachment.computeVertices(skeleton.x, skeleton.y, slot.bone, vertices);
                        boneRectangle.x1 = vertices[2];
                        boneRectangle.y1 = vertices[3];
                        boneRectangle.setWidth(attachment.width);
                        boneRectangle.setHeight(attachment.height);
                        skeletonRectangle.union(boneRectangle);
                    }
                    skeletonRectangles[currentSkeleton] = skeletonRectangle;
                    cornerPoints[currentSkeleton] = Vector(0, 0);
                    cornerPoints[currentSkeleton].x = skeletonRectangle.x1 - rootBone.x;
                    cornerPoints[currentSkeleton].y = skeletonRectangle.y1 - rootBone.y;
                    origins[currentSkeleton] = Vector(0, 0);
                    updateVisible();
                },
                /**
                 * Update visible component's dimension to correct skeleton
                 * @name updateBoundingbox
                 * @memberOf Spineable
                 * @function
                 */
                updateVisible = function () {
                    var scale = Vector(1, 1),
                        skeletonRectangle = skeletonRectangles[currentSkeleton],
                        width,
                        height;
                    if (object.visible) {
                        if (object.scalable) {
                            scale = object.scalable.getScale();
                        }
                        // update visible dimension
                        width = skeletonRectangle.getWidth() * Math.abs(scale.x);
                        height = skeletonRectangle.getHeight() * Math.abs(scale.y);
                        object.visible.setDimension(Dimension(width, height));
                    }
                };

            // - external interface -
            object = object || {};
            object.spineable = {
                /**
                 * Draw the spine component
                 * @name draw
                 * @memberOf Spineable
                 * @function
                 */
                draw: function (deltaT, context, scroll) {
                    var slot = {},
                        attachment = {},
                        skeleton = skeletons[currentSkeleton],
                        i = 0,
                        l = skeleton.drawOrder.length,
                        x, y, w, h,
                        px, py,
                        scaleX, scaleY,
                        boneScaleX, boneScaleY,
                        angle,
                        corner = cornerPoints[currentSkeleton],
                        origin = origins[currentSkeleton],
                        vOrigin = Vector(0, 0),
                        position = Vector(0, 0),
                        offset;
                    context.save();
                    if (object.visible) {
                        vOrigin = object.visible.getOrigin();
                        position = object.visible.getPosition();
                        context.translate(~~position.x, ~~position.y);
                    }
                    offset = Vector((corner.x + origin.x + vOrigin.x), (corner.y + origin.y + vOrigin.y));
                    if (object.scalable) {
                        object.scalable.draw(deltaT, context);
                    }
                    if (object.rotatable) {
                        object.rotatable.draw(deltaT, context);
                    }
                    for (i; i < l; ++i) {
                        slot = skeleton.drawOrder[i];
                        attachment = slot.attachment;
                        if (!(attachment instanceof spine.RegionAttachment)) {
                            continue;
                        }
                        attachment.computeVertices(skeleton.x, skeleton.y, slot.bone, vertices);
                        x = (vertices[2] - offset.x);
                        y = (vertices[3] - offset.y);
                        w = attachment.rendererObject.width;
                        h = attachment.rendererObject.height;
                        px = attachment.rendererObject.x;
                        py = attachment.rendererObject.y;
                        scaleX = attachment.scaleX;
                        scaleY = attachment.scaleY;
                        boneScaleX = slot.bone.scaleX;
                        boneScaleY = slot.bone.scaleY;
                        angle = -(slot.bone.worldRotation + attachment.rotation) * Math.PI / 180;

                        context.save();
                        context.translate(~~x, ~~y);
                        context.rotate(angle);
                        context.globalAlpha = slot.a;
                        context.scale(boneScaleX * scaleX, boneScaleY * scaleY);

                        context.drawImage(attachment.rendererObject.page.image, px, py, w, h, 0, 0, w, h);
                        context.restore();
                    }
                    context.restore();

                    // draw boundingbox
                    // var b = object.visible.getBoundingBox();
                    // context.strokeRect(b.x1, b.y1, b.getWidth(), b.getHeight());
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
                 * Set a new animation if it's not playing yet, returns true if successful
                 * @name setAnimation
                 * @memberOf Spineable
                 * @function
                 * @param {String} animationName: Name of the animation
                 * @param {Boolean} loop: (Optional) Wether the animation should loop, default is true
                 * @param {Number} speed:(Optional)  Speed of the animation, default is 1.0
                 * @param {Function} onComplete: (Optional) Callback function when animation ends/loops
                 */
                setAnimation: function (animationName, loop, speed, onComplete) {
                    if (!Sugar.has(animations, animationName)) {
                        throw ('There is no skeleton which contains an animation called ' + animationName);
                    }
                    if (currentAnimationStr === animationName) {
                        return false;
                    }
                    // set to correct skeleton if needed
                    object.spineable.setSkeleton(animations[animationName]);
                    // set callback
                    if (Sugar.isDefined(onComplete)) {
                        state[currentSkeleton].onComplete = onComplete;
                    } else {
                        state[currentSkeleton].onComplete = null;
                    }
                    if (!Sugar.isDefined(loop)) {
                        loop = true;
                    }
                    if (!Sugar.isDefined(speed)) {
                        speed = 1.0;
                    }
                    // set animation
                    currentAnimationStr = animationName;
                    state[currentSkeleton].setAnimationByName(0, animationName, loop);
                    state[currentSkeleton].timeScale = speed;
                    skeletons[currentSkeleton].setSlotsToSetupPose();
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
                    updateVisible();
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
                 * Sets the origin of the a skeleton (it's summed with visible's origin)
                 * @name setOrigin
                 * @memberOf Spineable
                 * @function
                 * @param {Object} pos: x and y position relative to the upper left corner point
                 */
                setOrigin: function (pos, skeletonName) {
                    if (Sugar.has(origins, skeletonName)) {
                        throw ("This skeleton doesn't exist: " + skeletonName);
                    }
                    origins[skeletonName] = pos;
                    if (currentSkeleton === skeletonName) {
                        updateVisible();
                    }
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

            object.register('update', object.spineable.update);
            object.register('draw', object.spineable.draw);

            return object;
        };
    }
);