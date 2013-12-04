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
        'glue/math/vector',
        'glue/math/dimension',
        'glue/math/rectangle'
    ],
    function (Glue, Vector, Dimension, Rectangle) {
        return function (obj) {
            var position = Vector(0, 0),
                dimension = null,
                image = null,
                rectangle,
                updateRectangle = function () {
                    rectangle.x1 = position.x;
                    rectangle.y1 = position.y;
                    rectangle.x2 = position.x + dimension.width;
                    rectangle.y2 = position.y + dimension.height;
                },
                currentFrame = 0,
                frameCount = 1,
                fps = 60,
                timeBetweenFrames = 1 / fps,
                timeSinceLastFrame = timeBetweenFrames,
                frameWidth,
                setAnimation = function (img, count, fps) {
                    image = img;
                    currentFrame = 0;
                    frameCount = count;
                    timeBetweenFrames = 1 / fps;
                    timeSinceLastFrame = timeBetweenFrames;
                    frameWidth = image.width / frameCount;
                };

            obj = obj || {};
            obj.animatable = {
                ready: false,
                setup: function (settings) {
                    var readyNeeded = [],
                        readyList = [],
                        successCallback,
                        errorCallback,
                        customPosition,
                        readyCheck = function () {
                            if (Glue.sugar.arrayMatch(readyNeeded, readyList)) {
                                successCallback();
                            }
                        },
                        imageLoadHandler = function () {
                            setAnimation(image, 8, 8);
                            dimension = Dimension(
                                image.naturalWidth,
                                image.naturalHeight
                            );
                            rectangle = Rectangle(
                                position.x,
                                position.y,
                                position.x + dimension.width,
                                position.y + dimension.height
                            );
                            readyList.push('image');
                            readyCheck();
                        };

                    if (settings) {
                        if (settings.position) {
                            // using proper rounding:
                            // http://jsperf.com/math-round-vs-hack/66
                            customPosition = settings.position;
                            position = Vector(
                                Math.round(customPosition.x),
                                Math.round(customPosition.y)
                            );
                        }
                        if (settings.dimension) {
                            dimension = settings.dimension;
                        }
                        if (settings.image) {
                            readyNeeded.push('image');
                            image = new Image();
                            image.addEventListener('load', function () {
                                imageLoadHandler();
                            }, false);
                            image.src = settings.image.src;
                            if (image.frameWidth) {
                                frameCount = dimension.width / image.frameWidth;
                            }
                        }
                    }
                    return {
                        then: function (onSuccess, onError) {
                            successCallback = onSuccess;
                            errorCallback = onError;
                        }
                    };
                },
                update: function (deltaT) {
                    timeSinceLastFrame -= deltaT;
                    if (timeSinceLastFrame <= 0)
                    {
                       timeSinceLastFrame = timeBetweenFrames;
                       ++currentFrame;
                       currentFrame %= frameCount;
                    }
                },
                draw: function (deltaT, context) {
                    //log('drawing player...');
                    //  Save the current context so we can only make changes to one graphic
                    context.save();

                    //  First we translate to the current x and y, so we can scale the image relative to that
                    context.translate(position.x, position.y);

                    //  Now we scale the image according to the scale (set in update function)
                    //context.scale(scale, scale);

                    var sourceX = frameWidth * currentFrame;

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
                    //context.drawImage(image, position.x, position.y)
                },
                getPosition: function () {
                    return position;
                },
                setPosition: function (value) {
                    position = value;
                    updateRectangle();
                },
                getDimension: function () {
                    return dimension;
                },
                setDimension: function (value) {
                    dimension = value;
                    updateRectangle();
                },
                getBoundingBox: function () {
                    return rectangle;
                },
                setBoundingBox: function (value) {
                    rectangle = value;
                },
                getFrameWidth: function () {
                    return frameWidth;
                }
            };
            return obj;
        };
    }
);
