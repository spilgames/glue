/*
 *  @module Fadable
 *  @namespace component
 *  @desc Represents an fadable component
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/fadable',
    [
        'glue',
        'glue/basecomponent'
    ],
    function (Glue, BaseComponent) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('fadable', object),
                alpha,
                targetAlpha,
                fadingIn = false,
                fadingOut = false,
                fadeSpeed = 0.5,
                atTargetCallback = null;

            baseComponent.set({
                update: function (gameData) {
                    var deltaT = gameData.deltaT;
                    if (fadingIn === true) {
                        if (alpha < targetAlpha - (deltaT * fadeSpeed)) {
                            alpha += fadeSpeed * deltaT;
                        } else {
                            alpha = targetAlpha;
                            fadingIn = false;
                            if (atTargetCallback !== null) {
                                atTargetCallback();
                            }
                        }
                    }
                    else if (fadingOut === true) {
                        if (alpha > targetAlpha + (deltaT * fadeSpeed)) {
                            alpha -= fadeSpeed * deltaT;
                        } else {
                            alpha = targetAlpha;
                            fadingOut = false;
                            if (atTargetCallback !== null) {
                                atTargetCallback();
                            }
                        }
                    }
                },
                draw: function (gameData) {
                    gameData.context.globalAlpha = alpha;
                },
                fade: function (callback, startAlpha, endAlpha) {
                    alpha = startAlpha;
                    targetAlpha = endAlpha;
                    fadingIn = startAlpha < endAlpha ? true : false;
                    fadingOut = startAlpha > endAlpha ? true : false;
                    if (Sugar.isDefined(callback)) {
                        atTargetCallback = callback;
                    }
                },
                fadeIn: function (callback, endAlpha) {
                    alpha = 0;
                    targetAlpha = endAlpha || 1;
                    fadingIn = true;
                    if (Sugar.isDefined(callback)) {
                        atTargetCallback = callback;
                    }
                },
                fadeOut: function (callback, endAlpha) {
                    alpha = 1;
                    targetAlpha = endAlpha || 0;
                    fadingOut = true;
                    if (Sugar.isDefined(callback)) {
                        atTargetCallback = callback;
                    }
                },
                setAlpha: function (value) {
                    if (Sugar.isNumber(value)) {
                        alpha = value;
                    }
                },
                getAlpha: function () {
                    return alpha;
                },
                setTargetAlpha: function (value) {
                    if (Sugar.isNumber(value)) {
                        targetAlpha = value;
                    }
                },
                getTargetAlpha: function () {
                    return targetAlpha;
                },
                setFadeSpeed: function (value) {
                    if (Sugar.isNumber(value)) {
                        fadeSpeed = value;
                    }
                },
                getFadeSpeed: function () {
                    return fadeSpeed;
                },
                atTarget: function () {
                    return !fadingIn && !fadingOut;
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
