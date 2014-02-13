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
        'glue/component/spritable'
    ],
    function (Glue, Vector, Spritable) {
        return function (object) {
            var Sugar = Glue.sugar,
                spritable = Spritable(object).spritable,
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
                        spritable.setImage(currentAnimation.image);
                        image = currentAnimation.image;
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

            object = object || {};
            object.animatable = {
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
                    var position = object.getPosition(),
                        sourceX = frameWidth * currentFrame,
                        origin = object.getOrigin();
                    scroll = scroll || Vector(0, 0);
                    context.save();
                    context.translate(
                        position.x - scroll.x,
                        position.y - scroll.y
                    );
                    if (Sugar.isDefined(object.rotatable)) {
                        object.rotatable.draw(deltaT, context);
                    }
                    if (Sugar.isDefined(object.scalable)) {
                        object.scalable.draw(deltaT, context);
                    }    
                    context.translate(-origin.x, -origin.y);
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
                    var dimension = object.getDimension();
                    dimension.width = frameWidth;
                    return dimension;
                },
                getBoundingBox: function (rectangle) {
                    rectangle.x2 = rectangle.x1 + frameWidth;
                    return rectangle;
                },
                getFrameWidth: function () {
                    return frameWidth;
                }
            };

            object.register('draw', object.animatable.draw);
            object.register('update', object.animatable.update);

            return object;
        };
    }
);
