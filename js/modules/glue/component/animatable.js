/*
 *  @module Animatable
 *  @namespace component
 *  @desc Represents an animatable component
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 *
 *  Only when performance issues: Remove the need for getters and setters in visible
 */
glue.module.create(
    'glue/component/animatable',
    [
        'glue',
        'glue/component',
        'glue/component/visible',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/math/rectangle'
    ],
    function (Glue, Component, Visible, Vector, Dimension, Rectangle) {
        return function (obj) {
            var animationSettings,
                animations = {},
                currentAnimation,
                currentFrame = 0,
                frameCount = 1,
                fps = 60,
                timeBetweenFrames = 1 / fps,
                timeSinceLastFrame = timeBetweenFrames,
                frameWidth,
                startFrame,
                endFrame,
                image,
                setAnimation = function () {
                    if (!image) {
                        image = currentAnimation.image;
                        this.visible.setImage(image);
                    }
                    frameCount = currentAnimation.endFrame - currentAnimation.startFrame;
                    timeBetweenFrames = currentAnimation.fps ?
                        1 / currentAnimation.fps :
                        1 / animationSettings.fps;
                    timeSinceLastFrame = timeBetweenFrames;
                    frameWidth = currentAnimation.frameCount ?
                        image.width / currentAnimation.frameCount :
                        image.width / animationSettings.frameCount;
                    startFrame = currentAnimation.startFrame;
                    endFrame = currentAnimation.endFrame;
                    currentFrame = startFrame;
                },
                successCallback,
                errorCallback;

            obj = obj || {};
            obj.animatable = Component(Visible).add({
                setup: function (settings) {
                    var animation;
                    if (settings) {
                        if (settings.animation) {
                            animationSettings = settings.animation;
                            if (settings.animation.animations) {
                                animations = settings.animation.animations;
                            }
                        }
                    }
                    this.visible.setup(settings);
                    if (settings.image) {
                        image = settings.image;
                    }
                },
                update: function (deltaT) {
                    timeSinceLastFrame -= deltaT;
                    if (timeSinceLastFrame <= 0) {
                        timeSinceLastFrame = timeBetweenFrames;
                        ++currentFrame;
                        if (currentFrame === endFrame) {
                            currentFrame = startFrame;
                        }
                    }
                },
                draw: function (deltaT, context) {
                    var position = this.visible.getPosition(),
                        sourceX = frameWidth * currentFrame;

                    //console.log(frameWidth, currentFrame);

                    //  Save the current context so we can only make changes to one graphic
                    context.save();
                    //  First we translate to the current x and y, so we can scale the image relative to that
                    context.translate(position.x, position.y);
                    //  Now we scale the image according to the scale (set in update function)
                    //context.scale(scale, scale);
                    context.drawImage
                    (
                        image,
                        sourceX,
                        0,
                        frameWidth,
                        image.height,
                        0,
                        0,
                        frameWidth,
                        image.height
                    );
                    /*
                    console.log(
                        'image: ' + image,
                        'sourceX: ' + sourceX,
                        'frameWidth: ' + frameWidth,
                        'image.height: ' + image.height,
                        'frameWidth: ' + frameWidth,
                        'current frame: ' + currentFrame,
                        'frame count: ' + frameCount);
                    */
                    context.restore();
                },
                setAnimation: function(name) {
                    if (animations[name]) {
                        currentAnimation = animations[name];
                        setAnimation();
                    }
                },
                getPosition: function () {
                    return this.visible.getPosition();
                },
                setPosition: function () {
                    return this.visible.setPosition();
                },
                getDimension: function () {
                    var dimension = this.visible.getDimension();
                    dimension.width = frameWidth;
                    return dimension;
                },
                setDimension: function () {
                    return this.visible.setDimension();
                },
                getBoundingBox: function () {
                    var rectangle = this.visible.getBoundingBox();
                    rectangle.y2 = rectangle.y1 + frameWidth;
                    return rectangle;
                },
                setBoundingBox: function () {
                    return this.visible.setBoundingBox();
                },
                getFrameWidth: function () {
                    return frameWidth;
                }
            });
            return obj;
        };
    }
);
