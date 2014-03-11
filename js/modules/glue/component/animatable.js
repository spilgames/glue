/*
 *  @module Animatable
 *  @namespace component
 *  @desc Represents an animatable component
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/animatable',
    [
        'glue',
        'glue/math/vector',
        'glue/basecomponent',
        'glue/component/spritable'
    ],
    function (Glue, Vector, BaseComponent, Spritable) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('animatable', object),
                spritable = Spritable(object).spritable,
                animationSettings,
                animations = {},
                currentAnimation,
                currentFrame = 0,
                frameCount = 1,
                fps = 60,
                timeBetweenFrames = 1 / fps,
                timeSinceLastFrame = timeBetweenFrames,
                successCallback,
                errorCallback,
                frameWidth,
                startFrame,
                endFrame,
                image,
                loopCount,
                currentLoop,
                looping,
                onCompleteCallback,
                setAnimation = function () {
                    if (!image) {
                        spritable.setImage(currentAnimation.image);
                        image = currentAnimation.image;
                    }
                    frameCount = currentAnimation.endFrame - currentAnimation.startFrame;
                    timeBetweenFrames = currentAnimation.fps ?
                        1 / currentAnimation.fps :
                        1 / animationSettings.fps;
                    timeSinceLastFrame = timeBetweenFrames;
                    frameWidth = image.width / animationSettings.frameCount;
                    startFrame = currentAnimation.startFrame;
                    endFrame = currentAnimation.endFrame;
                    currentFrame = startFrame;
                    loopCount = currentAnimation.loopCount || undefined;
                    onCompleteCallback = currentAnimation.onComplete || undefined;
                    currentLoop = 0;
                    looping = true;
                };

            baseComponent.set({
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
                    spritable.setup(settings);
                    if (settings.image) {
                        image = settings.image;
                    }
                },
                update: function (deltaT) {
                    if (!looping) {
                        return;
                    }
                    timeSinceLastFrame -= deltaT;
                    if (timeSinceLastFrame <= 0) {
                        timeSinceLastFrame = timeBetweenFrames;
                        ++currentFrame;
                        if (currentFrame > endFrame) {
                            if (Sugar.isDefined(loopCount)) {
                                ++currentLoop;
                                if (currentLoop === loopCount) {
                                    looping = false;
                                    if (Sugar.isDefined(onCompleteCallback)) {
                                        onCompleteCallback.call(this.animatable);
                                    }
                                }
                            }
                            currentFrame = startFrame;
                        }
                    }
                },
                draw: function (deltaT, context, scroll) {
                    var position = object.getPosition(),
                        sourceX = frameWidth * currentFrame,
                        origin = object.getOrigin();

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
                },
                setAnimation: function(name) {
                    if (animations[name]) {
                        currentAnimation = animations[name];
                        setAnimation();
                    }
                },
                getDimension: function () {
                    var dimension = object.getDimension();
                    dimension.width = frameWidth;
                    return dimension;
                },
                getBoundingBox: function () {
                    var rectangle = object.getBoundingBox();
                    rectangle.x2 = rectangle.x1 + frameWidth;
                    return rectangle;
                },
                getFrameWidth: function () {
                    return frameWidth;
                },
                register: function () {
                    baseComponent.register('draw');
                    baseComponent.register('update');
                },
                unregister: function () {
                    baseComponent.unregister('draw');
                    baseComponent.unregister('update');
                }
            });

            return object;
        };
    }
);