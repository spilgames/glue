/*
 *  @module Text
 *  @desc Text module to display text
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/text', [
        'glue',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/baseobject',
        'glue/component/scalable',
        'glue/component/rotatable',
        'glue/component/fadable'
    ],
    function (
        Glue,
        Vector,
        Dimension,
        Rectangle,
        BaseObject,
        Scalable,
        Rotatable,
        Fadable
    ) {
        'use strict';
        return function (settings) {
            var Sugar = Glue.sugar,
                textID,
                text = '',
                linebreaks = true,
                maxWidth,
                maxHeight,
                fontWeight = 'normal',
                gradient,
                gradientColors = ['black', 'white'],
                align = 'left',
                font = 'arial',
                fontSize = 37,
                fontColor = 'black',
                lineWidth = [0],
                maxLineWidth = 0,
                strokeStyle = ['black'],
                innerStroke = [false],
                textBaseline = 'top',
                strings = [],
                margin = Vector(0, 0),
                ySpacing = 0,
                overlaySprite = null,
                canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d'),
                canvasWidth = 1,
                canvasHeight = 1,
                compositeOperation = 'source-over',
                /**
                 * Prepare font settings, gradients, max width/height etc.
                 */
                init = function (textSettings) {
                    var i,
                        l,
                        maxLength;
                    /**
                     * Gradient settings
                     * overwrites fontColor behavior
                     */
                    if (textSettings.gradient) {
                        gradient = textSettings.gradient;
                    }
                    if (textSettings.gradientColors) {
                        gradientColors = [];
                        for (i = 0, l = textSettings.gradientColors.length; i < l; ++i) {
                            gradientColors[i] = textSettings.gradientColors[i];
                        }
                    }
                    if (textSettings.overlaySprite) {
                        overlaySprite = textSettings.overlaySprite;
                        if (!overlaySprite.initialized) {
                            overlaySprite.init();
                            overlaySprite.initialized = true;
                        }
                    }
                    /**
                     * Alignment settings
                     */
                    if (textSettings.align) {
                        align = textSettings.align;
                    }
                    if (Sugar.isDefined(textSettings.ySpacing)) {
                        ySpacing = textSettings.ySpacing;
                    }
                    /**
                     * Font settings
                     */
                    if (textSettings.font) {
                        font = textSettings.font;
                    }
                    if (Sugar.isDefined(textSettings.fontSize)) {
                        fontSize = textSettings.fontSize;
                    }
                    if (textSettings.fontColor) {
                        fontColor = textSettings.fontColor;
                    }
                    if (textSettings.textBaseline) {
                        textBaseline = textSettings.textBaseline;
                    }
                    if (Sugar.isDefined(textSettings.fontWeight)) {
                        fontWeight = textSettings.fontWeight;
                    }
                    /**
                     * Stroke settings
                     * Sets a stroke over the text. You can apply multiple strokes by
                     * supplying an array of lineWidths / strokeStyles
                     * By default, the strokes are outlines, you can create inner strokes
                     * by setting innerStroke to true (for each stroke by supplying an array).
                     *
                     * lineWidth: {Number / Array of Numbers} width of linestroke(s)
                     * strokeStyle: {strokeStyle / Array of strokeStyles} A strokestyle can be a
                     *              color string, a gradient object or pattern object
                     * innerStroke: {Boolean / Array of booleans} True = stroke becomes an inner stroke, false by default
                     */
                    if (Sugar.isDefined(textSettings.lineWidth)) {
                        if (!Sugar.isArray(textSettings.lineWidth)) {
                            lineWidth = [textSettings.lineWidth];
                        } else {
                            lineWidth = textSettings.lineWidth;
                        }
                    }
                    if (textSettings.strokeStyle) {
                        if (!Sugar.isArray(textSettings.strokeStyle)) {
                            strokeStyle = [textSettings.strokeStyle];
                        } else {
                            strokeStyle = textSettings.strokeStyle;
                        }
                    }
                    if (textSettings.innerStroke) {
                        if (!Sugar.isArray(textSettings.innerStroke)) {
                            innerStroke = [textSettings.innerStroke];
                        } else {
                            innerStroke = textSettings.innerStroke;
                        }
                    }
                    // align array lengths
                    maxLength = Math.max(lineWidth.length, strokeStyle.length, innerStroke.length);
                    while (lineWidth.length < maxLength) {
                        lineWidth.push(0);
                    }
                    while (strokeStyle.length < maxLength) {
                        strokeStyle.push('black');
                    }
                    while (innerStroke.length < maxLength) {
                        innerStroke.push(false);
                    }
                    // find max width
                    maxLineWidth = 0;
                    for (i = 0, l = lineWidth.length; i < l; ++i) {
                        // double lineWidth, because we only do outer/inner
                        maxLineWidth = Math.max(maxLineWidth, lineWidth[i] * 2);
                    }

                    /**
                     * Textbox settings
                     */
                    if (Sugar.isDefined(textSettings.linebreaks)) {
                        linebreaks = textSettings.linebreaks;
                    }
                    if (Sugar.isDefined(textSettings.maxWidth)) {
                        maxWidth = textSettings.maxWidth;
                    } else {
                        maxWidth = null;
                    }
                    if (Sugar.isDefined(textSettings.maxHeight)) {
                        maxHeight = textSettings.maxHeight;
                    } else {
                        maxHeight = null;
                    }
                    if (Sugar.isDefined(textSettings.margin)) {
                        margin = textSettings.margin;
                    }

                    // set up text
                    if (textSettings.text) {
                        textbox.setText(settings.text);
                    } else {
                        textbox.setText(text);
                    }
                },
                /**
                 * Draw text to canvas
                 */
                updateCanvas = function () {
                    var i,
                        j,
                        l,
                        x,
                        y,
                        scale,
                        // extra offset because we may draw a line around the text
                        offset = Vector(maxLineWidth / 2, maxLineWidth / 2),
                        origin = textbox.getOrigin(),
                        position = textbox.getPosition();
                    // resize canvas based on text size
                    canvas.width = canvasWidth + maxLineWidth + margin.x * 2;
                    canvas.height = canvasHeight + maxLineWidth + margin.y * 2;
                    // update baseobject
                    textbox.setDimension(Dimension(canvas.width, canvas.height));
                    textbox.updateBoundingBox();

                    // fit overlay onto canvas
                    if (overlaySprite) {
                        scale = canvas.width / overlaySprite.getDimension().width;
                        if (overlaySprite.scalable) {
                            overlaySprite.scalable.setScale(Vector(scale, scale));
                        }
                    }

                    // set alignment by setting the origin
                    switch (align) {
                        default:
                    case 'left':
                        origin.x = 0;
                        break;
                    case 'center':
                        origin.x = margin.x + canvasWidth / 2;
                        break;
                    case 'right':
                        origin.x = margin.x + canvasWidth;
                        break;
                    }
                    switch (textBaseline) {
                        default:
                    case 'top':
                        origin.y = 0;
                        break;
                    case 'middle':
                        origin.y = canvasHeight / 2;
                        break;
                    case 'bottom':
                        origin.y = canvasHeight;
                        break;
                    }

                    // draw text
                    setContext(ctx);
                    for (i = 0; i < strings.length; ++i) {
                        // gradient or solid color
                        if (Sugar.isDefined(strings[i].gradient)) {
                            ctx.fillStyle = strings[i].gradient;
                        } else {
                            ctx.fillStyle = fontColor;
                        }
                        // add 1 fontSize because text is aligned to the bottom (most reliable one)
                        x = offset.x + origin.x;
                        y = offset.y + (i + 1) * fontSize + margin.y + ySpacing * i;

                        // fillText
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillText(strings[i].string, x, y);

                        // pattern
                        if (!Sugar.isEmpty(overlaySprite)) {
                            ctx.globalCompositeOperation = 'source-atop';
                            overlaySprite.setPosition(Vector(x, y - fontSize));
                            overlaySprite.draw({
                                canvas: canvas,
                                context: ctx
                            });
                        }

                        // inner stroke
                        ctx.globalCompositeOperation = 'source-atop';
                        for (j = 0; j < lineWidth.length; ++j) {
                            if (lineWidth[j] && innerStroke[j]) {
                                ctx.lineWidth = lineWidth[j] * 2;
                                ctx.strokeStyle = strokeStyle[j];
                                ctx.strokeText(strings[i].string, x, y);
                            }
                        }

                        // outer stroke
                        ctx.globalCompositeOperation = 'destination-over';
                        for (j = lineWidth.length - 1; j >= 0; --j) {
                            if (lineWidth[j] && !innerStroke[j]) {
                                ctx.lineWidth = lineWidth[j] * 2;
                                ctx.strokeStyle = strokeStyle[j];
                                ctx.strokeText(strings[i].string, x, y);
                            }
                        }
                    }
                    restoreContext(ctx);
                },
                /**
                 * Draw function (registered in BaseObject)
                 * @param {Object} gameData - Glue gamedata
                 */
                draw = function (gameData) {
                    // draw the offscreen canvas
                    gameData.context.drawImage(canvas, 0, 0);
                },
                /**
                 * Restore context and previous font settings
                 * @param {Object} context - Canvas context
                 */
                restoreContext = function (context) {
                    context.textAlign = 'left';
                    context.textBaseline = 'bottom';
                    context.lineWidth = 0;
                    context.strokeStyle = 'black';
                    context.fillStyle = 'black';
                    context.globalCompositeOperation = compositeOperation;
                    context.restore();
                },
                /**
                 * Save context and set font settings for drawing
                 * @param {Object} context - Canvas context
                 */
                setContext = function (context) {
                    context.save();
                    context.textAlign = align;
                    context.textBaseline = 'bottom';
                    context.font = fontWeight + ' ' + fontSize.toString() + 'px ' + font;
                    compositeOperation = context.globalCompositeOperation;
                },
                /**
                 * Splits the string into an array per line (canvas does not support
                 * drawing of linebreaks in text)
                 */
                setupStrings = function () {
                    var singleStrings = ('' + text).split('\n'),
                        stringWidth,
                        singleString,
                        i,
                        j,
                        calcGrd,
                        subString,
                        remainingString,
                        spacePos;

                    strings.length = [];
                    canvasWidth = 1;
                    canvasHeight = 1;
                    setContext(ctx);
                    for (i = 0; i < singleStrings.length; ++i) {
                        singleString = singleStrings[i];
                        stringWidth = ctx.measureText(singleString).width;
                        // do we need to generate extra linebreaks?
                        if (linebreaks && !Sugar.isEmpty(maxWidth) && stringWidth > maxWidth) {
                            // start cutting off letters until width is correct
                            j = 0;
                            while (stringWidth > maxWidth) {
                                ++j;
                                subString = singleString.slice(0, singleString.length - j);
                                stringWidth = ctx.measureText(subString).width;
                                // no more letters left: assume 1 letter
                                if (j === singleString.length) {
                                    j = singleString.length - 1;
                                    break;
                                }
                            }
                            // find first space to split (if there are no spaces, we just split at our current position)
                            spacePos = subString.lastIndexOf(' ');
                            if (spacePos > 0 && spacePos != subString.length) {
                                // set splitting position
                                j += subString.length - spacePos;
                            }
                            // split the string into 2
                            remainingString = singleString.slice(singleString.length - j, singleString.length);
                            singleString = singleString.slice(0, singleString.length - j);

                            // remove first space in remainingString
                            if (remainingString.charAt(0) === ' ') {
                                remainingString = remainingString.slice(1);
                            }

                            // the remaining string will be pushed into the array right after this one
                            if (remainingString.length != 0) {
                                singleStrings.splice(i + 1, 0, remainingString);
                            }

                            // set width correctly and proceed
                            stringWidth = ctx.measureText(singleString).width;
                        }

                        if (stringWidth > canvasWidth) {
                            canvasWidth = stringWidth;
                        }
                        calcGrd = calculateGradient(stringWidth, i);
                        strings.push({
                            string: singleString,
                            width: stringWidth,
                            gradient: calcGrd
                        });
                        canvasHeight += fontSize + ySpacing;
                    }
                },
                /**
                 * Prepares the gradient object for every string line
                 * @param {Number} width - Gradient width
                 * @param {index} index - String index of strings array
                 */
                calculateGradient = function (width, index) {
                    var grd,
                        startGrd = {
                            x: 0,
                            y: 0
                        },
                        endGrd = {
                            x: 0,
                            y: 0
                        },
                        gradientValue,
                        i,
                        top,
                        bottom;

                    if (!gradient) {
                        return;
                    }

                    top = (fontSize + ySpacing) * index;
                    bottom = (fontSize + ySpacing) * (index + 1);

                    switch (gradient) {
                        default:
                    case 'top-down':
                        startGrd.x = 0;
                        startGrd.y = top;
                        endGrd.x = 0;
                        endGrd.y = bottom;
                        break;
                    case 'down-top':
                        startGrd.x = 0;
                        startGrd.y = bottom;
                        endGrd.x = 0;
                        endGrd.y = top;
                        break;
                    case 'left-right':
                        startGrd.x = 0;
                        startGrd.y = 0;
                        endGrd.x = width;
                        endGrd.y = 0;
                        break;
                    case 'right-left':
                        startGrd.x = width;
                        startGrd.y = 0;
                        endGrd.x = 0;
                        endGrd.y = 0;
                        break;
                    case 'topleft-downright':
                        startGrd.x = 0;
                        startGrd.y = top;
                        endGrd.x = width;
                        endGrd.y = bottom;
                        break;
                    case 'topright-downleft':
                        startGrd.x = width;
                        startGrd.y = top;
                        endGrd.x = 0;
                        endGrd.y = bottom;
                        break;
                    case 'downleft-topright':
                        startGrd.x = 0;
                        startGrd.y = bottom;
                        endGrd.x = width;
                        endGrd.y = top;
                        break;
                    case 'downright-topleft':
                        startGrd.x = width;
                        startGrd.y = bottom;
                        endGrd.x = 0;
                        endGrd.y = top;
                        break;
                    }
                    // offset with the linewidth
                    startGrd.x += maxLineWidth / 2;
                    startGrd.y += maxLineWidth / 2;
                    endGrd.x += maxLineWidth / 2;
                    endGrd.y += maxLineWidth / 2;

                    grd = ctx.createLinearGradient(
                        startGrd.x,
                        startGrd.y,
                        endGrd.x,
                        endGrd.y
                    );
                    for (i = 0.0; i < gradientColors.length; ++i) {
                        gradientValue = i * (1 / (gradientColors.length - 1));
                        grd.addColorStop(gradientValue, gradientColors[i]);
                    }

                    return grd;
                },
                // public
                textbox = BaseObject(Scalable, Rotatable, Fadable).add({
                    /**
                     * Retrieve current text
                     */
                    getText: function () {
                        return text;
                    },
                    /**
                     * Sets and displays current text
                     * @param {String} str - The string you want to set
                     * @param {Object} settings (optional) - Apply new settings for text visuals
                     */
                    setText: function (str, newSettings) {
                        if (newSettings) {
                            if (Sugar.isDefined(settings)) {
                                init(Sugar.combine(settings, newSettings));
                            } else {
                                init(newSettings);                                
                            }
                        }
                        text = str;
                        setupStrings();

                        // check width and height
                        while (fontSize > 0 && ((!Sugar.isEmpty(maxWidth) && canvasWidth > maxWidth) || (!Sugar.isEmpty(maxHeight) && canvasHeight > maxHeight))) {
                            // try again by reducing fontsize
                            fontSize -= 1;
                            setupStrings();
                        }
                        updateCanvas();
                    }
                });
            // register draw call so textbox module could be a rotatable and/or scalable 
            // pretends to be a spritable so it gets drawn last
            textbox.register('draw', draw, 'spritable');
            if (settings) {
                init(settings);
            }
            return textbox;
        }
    }
);