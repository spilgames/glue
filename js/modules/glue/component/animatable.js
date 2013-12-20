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
    function () {
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
                        obj.visible.setImage(image);
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
            obj.animatable = {
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
                    obj.visible.setup(settings);
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
                    var position = obj.visible.getPosition(),
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
                getDimension: function () {
                    var dimension = obj.visible.getDimension();
                    dimension.width = frameWidth;
                    return dimension;
                },
                getBoundingBox: function () {
                    var rectangle = obj.visible.getBoundingBox();
                    rectangle.y2 = rectangle.y1 + frameWidth;
                    return rectangle;
                },
                getFrameWidth: function () {
                    return frameWidth;
                }
            };
            return obj;
        };
    }
);
