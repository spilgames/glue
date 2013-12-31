/*
 *  @module Fadable
 *  @namespace component
 *  @desc Represents an fadable component
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/fadable',
    [
        'glue'
    ],
    function (Glue) {
        var Sugar = Glue.sugar;
        return function (component) {
            var alpha,
                targetAlpha,
                fadingIn = false,
                fadingOut = false,
                fadeSpeed = 0.5;

            component = component || {};
            component.fadable = {
                update: function (deltaT) {
                    if (fadingIn === true) {
                        if (alpha < targetAlpha + (deltaT * fadeSpeed)) {
                            alpha += fadeSpeed * deltaT;
                        } else {
                            alpha = targetAlpha;
                            fadingIn = false;
                        }
                    }
                    else if (fadingOut === true) {
                        if (alpha > targetAlpha - (deltaT * fadeSpeed)) {
                            alpha -= fadeSpeed * deltaT;
                        } else {
                            alpha = targetAlpha;
                            fadingOut = false;
                        }
                    }
                },
                draw: function (context, deltaT) {
                    context.globalAlpha = alpha;
                    return context;
                },
                fade: function (startAlpha, endAlpha) {
                    alpha = startAlpha;
                    targetAlpha = endAlpha;
                    fadingIn = startAlpha < endAlpha ? true : false;
                    fadingOut = startAlpha > endAlpha ? true : false;
                },
                fadeIn: function (endAlpha) {
                    alpha = 0;
                    targetAlpha = endAlpha || 1;
                    fadingIn = true;
                },
                fadeOut: function (endAlpha) {
                    alpha = 1;
                    targetAlpha = endAlpha || 0;
                    fadingOut = true;
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
                }
            };
            return component;
        };
    }
);
