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
            var currentFrame = 0,
                frameCount = 1,
                fps = 60,
                timeBetweenFrames = 1 / fps,
                timeSinceLastFrame = timeBetweenFrames,
                frameWidth,
                image,
                setAnimation = function (img, count, fps) {
                    image = img;
                    currentFrame = 0;
                    frameCount = count;
                    timeBetweenFrames = 1 / fps;
                    timeSinceLastFrame = timeBetweenFrames;
                    frameWidth = image.width / frameCount;
                },
                successCallback,
                errorCallback;

            obj = obj || {};
            obj.animatable = Component(Visible).add({
                setup: function (settings) {
                    this.visible.setup(settings);
                    setAnimation(settings.image, settings.frameCount, settings.fps);
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
                    var position = this.visible.getPosition();

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
                    return this.visible.getPosition();
                },
                setPosition: function () {
                    return this.visible.setPosition();
                },
                getDimension: function () {
                    return this.visible.getDimension();
                },
                setDimension: function () {
                    return this.visible.setDimension();
                },
                getBoundingBox: function () {
                    return this.visible.getBoundingBox();
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
