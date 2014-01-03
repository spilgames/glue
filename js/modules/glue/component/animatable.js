/*
 *  @module Animatable
 *  @namespace component
 *  @desc Represents an animatable component
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 *
 *  Only when performance issues: Remove the need for getters and setters in visible
 */
glue.module.create(
    'glue/component/animatable',
    [
        'glue',
        'glue/math/vector'
    ],
    function (Glue, Vector) {
        return function (obj) {
            var Sugar = Glue.sugar,
                animationSettings,
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
                        obj.visible.setImage(currentAnimation.image);
                        image = obj.visible.getImage();
                    }
                    frameCount = currentAnimation.endFrame - currentAnimation.startFrame;
                    timeBetweenFrames = currentAnimation.fps ?
                        1 / currentAnimation.fps :
                        1 / animationSettings.fps;
                    timeSinceLastFrame = timeBetweenFrames;
                    frameWidth = currentAnimation.frameCount ?
                        image.width / currentAnimation.frameCount :
                        image.width / animationSettings.frameCount;
                    startFrame = currentAnimation.startFrame - 1;
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
                    if (Sugar.isDefined(obj.visible)) {
                        obj.visible.setup(settings);
                    } else {
                        if (window.console) {
                            throw 'Animatable needs a Visible component';
                        }
                    }
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
                draw: function (deltaT, context, scroll) {
                    var position = obj.visible.getPosition(),
                        sourceX = frameWidth * currentFrame;

                    scroll = scroll || Vector(0, 0);
                    context.save();
                    context.translate(
                        position.x - scroll.x,
                        position.y - scroll.y
                    );
                    if (Sugar.isDefined(obj.rotatable)) {
                        obj.rotatable.draw(deltaT, context);
                    }
                    if (Sugar.isDefined(obj.scalable)) {
                        obj.scalable.draw(deltaT, context);
                    }
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
