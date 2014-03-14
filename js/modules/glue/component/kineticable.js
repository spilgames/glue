/*
 *  @module Kineticable
 *  @namespace component
 *  @desc Represents a kineticable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/kineticable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/math/circle',
        'glue/sat'
    ],
    function (Glue, BaseComponent, Mathematics, Vector, Dimension, Rectangle, Circle, SAT) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('kineticable', object),
                math = Mathematics(),
                velocity = Vector(0, 0),
                gravity = Vector(0, 0),
                position = Vector(0, 0),
                side = Vector(0, 0),
                maxVelocity = Vector(0, 0),
                dimension = Dimension(0, 0),
                radius,
                dynamic = true,
                bounce = 0,
                scale = Vector(1, 1),
                origin,
                max;

            baseComponent.set({
                setup: function (config) {
                    if (Sugar.isDefined(config)) {
                        if (Sugar.isDefined(config.gravity)) {
                            this.setGravity(config.gravity);
                        }
                        if (Sugar.isDefined(config.bounce)) {
                            this.setBounce(config.bounce);
                        }
                        if (Sugar.isDefined(config.velocity)) {
                            this.setVelocity(config.velocity);
                        }                    
                        if (Sugar.isDefined(config.maxVelocity)) {
                            this.setMaxVelocity(config.maxVelocity);
                        }
                        if (Sugar.isDefined(config.radius)) {
                            this.setRadius(config.radius);
                        }
                        if (Sugar.isDefined(config.dynamic)) {
                            this.setDynamic(config.dynamic);
                        }
                    }
                    position = object.getPosition();
                    origin = object.getOrigin(); 
                    if (Sugar.isDefined(object.scalable)) {
                        scale = object.scalable.getScale();
                    }
                    if (Sugar.isDefined(object.animatable)) {
                        dimension = object.animatable.getDimension();
                    } else {
                        dimension = object.getDimension();
                    }
                    dimension.width *= scale.x;
                    dimension.height *= scale.y;
                    
                    if (Sugar.isUndefined(radius)) {
                        max = Math.max(dimension.width, dimension.height);
                        radius = (Math.sqrt(
                            (-max / 2) * (-max / 2) +
                            (-max / 2) * (-max / 2)
                        ));
                    }
                },
                update: function (gameData) {
                    side.x = side.y = 0;
                    velocity.add(gravity);
                    if (maxVelocity.x !== 0 && Math.abs(velocity.x) > maxVelocity.x) {
                        velocity.x = maxVelocity.x * math.sign(velocity.x);
                    }
                    if (maxVelocity.y !== 0 && Math.abs(velocity.y) > maxVelocity.y) {
                        velocity.y = maxVelocity.y * math.sign(velocity.y);
                    }
                    position.add(velocity);
                    object.setPosition(position);
                },
                setVelocity: function (vector) {
                    if (Sugar.isVector(vector)) {
                        velocity = vector;
                    } else {
                        throw 'The argument must be a Vector';
                    }
                },
                setGravity: function (vector) {
                    if (Sugar.isVector(vector)) {
                        gravity = vector;
                    } else {
                        throw 'The argument must be a Vector';
                    }
                },
                setDimension: function (dimen) {
                    if (Sugar.isDimension(dimension)) {
                        dimension = dimen;
                    } else {
                        throw 'The argument must be a Dimension';
                    }
                },
                setDynamic: function (bool) {
                    if (Sugar.isBoolean(bool)) {
                        dynamic = bool;
                    } else {
                        throw 'The argument must be a Boolean';
                    }
                },
                setBounce: function (number) {
                    if (Sugar.isNumber(number)) {
                        bounce = number;
                    } else {
                        throw 'The argument must be a Number';
                    }
                },
                setRadius: function (number) {
                    if (Sugar.isNumber(number)) {
                        radius = number;
                    } else {
                        throw 'The argument must be a Number';
                    }
                },
                setPosition: function (vector) {
                    if (Sugar.isVector(vector)) {
                        object.setPosition(vector);
                    } else {
                        throw 'The argument must be a Vector';
                    }
                },
                setSide: function (vector) {
                    if (Sugar.isVector(vector)) {
                        side = vector;
                    } else {
                        throw 'The argument must be a Vector';
                    }
                },
                setMaxVelocity: function (vector) {
                    if (Sugar.isVector(vector)) {
                        maxVelocity = vector;
                    } else {
                        throw 'The argument must be a Vector';
                    }
                },
                getVelocity: function () {
                    return velocity;
                },
                getGravity: function () {
                    return gravity;
                },
                getPosition: function () {
                    return position;
                },
                getDimension: function () {
                    return dimension;
                },
                isDynamic: function () {
                    return dynamic;
                },
                getBounce: function () {
                    return bounce;
                },
                getRadious: function () {
                    return radius;
                },
                getMaxVelocity: function () {
                    return maxVelocity;
                },
                isTouching: function (sideTest) {
                    return (sideTest === SAT.TOP && side.y > 0) ||
                           (sideTest === SAT.BOTTOM && side.y < 0) || 
                           (sideTest === SAT.LEFT && side.x > 0) || 
                           (sideTest === SAT.RIGHT && side.x < 0);
                },
                toRectangle: function () {
                    return Rectangle(
                            position.x - origin.x * Math.abs(scale.x),
                            position.y - origin.y * Math.abs(scale.y),
                            dimension.width,
                            dimension.height
                        );
                },
                toCircle: function () {
                    return Circle(
                            position.x + dimension.width / 2,
                            position.y + dimension.height / 2,
                            radius
                        );
                },
                getSide: function () {
                    return side;
                },
                register: function () {
                    baseComponent.register('update');
                },
                unregister: function () {
                    baseComponent.unregister('update');
                }
            });

            return object;
        }
    }
);