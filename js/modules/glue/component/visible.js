/*
 *  @module Visible
 *  @namespace component.visible
 *  @desc Represents a visible component
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 *
 *  Setup with and height of image automatically
 *  Removed the need for getters and setters in visible
 */
glue.module.create(
    'glue/component/visible',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            var position = null,
                dimension = null,
                image = null,
                frameCount = 0,
                frame = 1;

            obj = obj || {};
            obj.visible = {
                ready: false,
                setup: function (settings) {
                    var readyNeeded = [],
                        readyList = [],
                        successCallback,
                        errorCallback,
                        readyCheck = function () {
                            if (Glue.sugar.arrayMatch(readyNeeded, readyList)) {
                                successCallback();
                            }
                        },
                        imageLoadHandler = function () {
                            readyList.push('image');
                            readyCheck();
                        };

                    if (settings) {
                        if (settings.position) {
                            position = settings.position;
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

                },
                draw: function (deltaT, context) {
                    context.drawImage(image, position.x, position.y)
                },
                getPosition: function () {
                    return position
                },
                getDimension: function () {
                    return dimension;
                }
            };
            return obj;
        };
    }
);
