/**
 *  @module Sugar
 *  @namespace modules.glue
 *  @desc Provides javascript sugar functions
 *  @author Jeroen Reurings
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
var modules = modules || {};
modules.glue = modules.glue || {};

modules.glue.sugar = (function (win, doc) {
    'use strict';
    var i,
        /**
         * Is a given value a dimension?
         * @param {Object}
         * @return {Boolean}
         */
        isDimension = function (value) {
            return isNumber(value.width) && isNumber(value.height);
        },
        /**
         * Is a given value a vector?
         * @param {Object}
         * @return {Boolean}
         */
        isVector = function (value) {
            return isNumber(value.x) && isNumber(value.y);
        },
        /**
         * Is a given value a matrix?
         * @param {Object}
         * @return {Boolean}
         */
        isMatrix = function (obj) {
            if (has(obj, 'get') && isFunction(obj.get) &&
                has(obj, 'getValue') && Sugar.isFunction(obj.getValue) &&
                has(obj, 'iterate') && isFunction(obj.iterate) &&
                has(obj, 'set') && isFunction(obj.iterate) &&
                has(obj, 'unset') && isFunction(obj.iterate)) {
                    return true;
            }
        },
        /**
         * Is a given value a string?
         * @param {Object}
         * @return {Boolean}
         */
        isString = function (value) {
            return typeof value === 'string' || value instanceof String;
        },
        /**
         * Is a given value an array?
         * Delegates to ECMA5's native Array.isArray
         * @param {Object}
         * @return {Boolean}
         */
        isArray = Array.prototype.isArray || function (value) {
            return Object.prototype.toString.call(value) === '[object Array]';
        },
        /**
         * Is a given value a literal object?
         * @param {Object}
         * @return {Boolean}
         */
        isObject = function (value) {
            return Object.prototype.toString.call(value) === '[object Object]';
        },
        /**
         * Is a given value a function?
         * @param {Object}
         * @return {Boolean}
         */
        isFunction = function (value) {
            return Object.prototype.toString.call(value) === '[object Function]';
        },
        /**
         * Are the two given arrays identical (even when they have a different reference)
         * @param {Array} first array to check
         * @param {Array} second array to check
         * @return {Boolean} true if they are identical, false if they are not
         */
        arrayMatch = function (a, b) {
            var i = a.length;
            if (i != b.length) return false;
            while (i--) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        },
        /**
         * Extends two objects by copying the properties
         * If a property is an object, it will be cloned
         * @param {Object} The first object
         * @param {Object} The second object
         * @return {Object} The combined object
         */
        extend = function (obj1, obj2) {
            var prop;
            for (prop in obj2) {
                if (obj2.hasOwnProperty(prop)) {
                    if (this.isObject(obj2[prop])) {
                        obj1[prop] = this.extend({}, obj2[prop]);
                    } else {
                        obj1[prop] = obj2[prop];
                    }
                }
            }
            return obj1;
        },
        /**
         * Can be used to provide the same functionality as a self executing function used in the
         * module pattern. The passed dependencies will by applied to the callback function.
         * The modules can be located in multi-level namespaces. This is done by using dots as a separator.
         * @name import
         * @memberOf me
         * @function
         * @param {Array} dependencies: the dependencies you want to import
         * @param {Function} callback: the callback function where the dependencies will be applied to
         */
        imports = function (dependencies, callback) {
            var imports = [],
                p,
                d,
                pLn,
                dLn,
                currentPart,
                parent = win,
                parts,
                module;

            // iterate over the dependencies
            for (d = 0, dLn = dependencies.length; d < dLn; ++d) {
                parent = win;
                parts = dependencies[d].split('.');
                if (parts.length === 1) {
                    // get the module from global space
                    module = win[parts];
                } else {
                    for (p = 0, pLn = parts.length; p < pLn; ++p) {
                        currentPart = parts[p];
                        if (p === (pLn - 1)) {
                            // get the module from the namespace
                            module = parent[currentPart];
                        } else {
                            if (parent[currentPart]) {
                                parent = parent[currentPart];
                            }
                        }
                    }
                }
                // check if the module is found and if the type is 'object' or 'function'
                if (module && this.isFunction(module)) {
                    // add the module to the imports array
                    imports.push(module);
                } else {
                    // throw an error if the module is not found, or is not a function
                    throw('glue.sugar.imports: Module ' + dependencies[d] + ' not found or not a function');
                }
            }
            // apply the dependencies to the callback function and return it
            return callback.apply(glue, imports);
        },
        /**
         * An empty function
         */
        emptyFn = function () {},
        /**
         * Is a given value a number?
         * @param {Object}
         * @return {Boolean}
         */
        isNumber = function (obj) {
            return Object.prototype.toString.call(obj) ===
                '[object Number]';
        },
        /**
         * Is a given value a boolean?
         * @param {Object}
         * @return {Boolean}
         */
        isBoolean = function (obj) {
            return obj === true || obj === false ||
                Object.prototype.toString.call(obj) === '[object Boolean]';
        },
        /**
         * Is a given value a date?
         * @param {Object}
         * @return {Boolean}
         */
        isDate = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Date]';
        },
        /**
         * Is a given value an integer?
         * @param {Object}
         * @return {Boolean}
         */
        isInt = function (obj) {
            return parseFloat(obj) === parseInt(obj, 10) && !isNaN(obj);
        },
        /**
         * Has own property?
         * @param {Object}
         * @param {String}
         */
        has = function (obj, key) {
            return Object.prototype.hasOwnProperty.call(obj, key);
        },
        /**
         * Is a given variable undefined?
         * @param {Object}
         * @return {Boolean}
         */
        isUndefined = function (obj) {
            return obj === void 0;
        },
        /**
         * Is a given variable defined?
         * @param {Object}
         * @return {Boolean}
         */
        isDefined = function (obj) {
            return obj !== void 0;
        },
        /**
         * Is a given variable empty?
         * @param {Object}
         * @return {Boolean}
         */
        isEmpty = function (obj) {
            var temp;
            if (obj === "" || obj === 0 || obj === "0" || obj === null ||
                    obj === false || this.isUndefined(obj)) {
                return true;
            }
            //  Check if the array is empty
            if (this.isArray(obj) && obj.length === 0) {
                return true;
            }
            //  Check if the object is empty
            if (this.isObject(obj)) {
                for (temp in obj) {
                    if (this.has(obj, temp)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        },
        /**
         * Is a given variable an argument object?
         * @param {Object}
         * @return {Boolean}
         */
        isArgument = function (obj) {
            return Object.prototype.toString.call(obj) ===
                '[object Arguments]';
        },
        /**
         * Returns a random value within a given range
         * @param {Number} min - The minimum value of the range
         * @param {Number} max - The maximum value of the range
         * @return {Number} A random whole number within the passed range
         */
        getRandom = function (min, max) {
            return min + Math.floor(Math.random() * (max - min + 1));
        },
        /**
         * Will uppercase the first character of a given string
         * @param {String}
         * @return {String}
         */
        upperFirst = function (str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        /**
         * Will check all given arguments for a specific type
         * @param arguments[0]: {String} the type to check for
         * @param arguments[1-n]: {Argument} the objects to check
         * @return {Boolean} true if all arguments are of the given type,
         * false if one of them is not
         */            
        multiIs = function () {
            var params = this.toArray(arguments),
                method = this['is' + this.upperFirst(params.shift())],
                max = params.length;

            while (max--) {
                if (!method.call(null, params[max])) {
                    return false;
                }
            }
            return true;
        },
        /**
         * Will combine two objects (or arrays)
         * The properties of the second object will be added to the first
         * If the second object contains the same property name as the first
         * object, the property will be saved in the base property
         * @param {Object} The first object
         * @param {Object} The second object
         * @return {Object} If both params are objects: The combined first
         * object
         * @return {Object} If one of the params in not an object
         * (or array): The first object
         */
        combine = function (obj1, obj2) {
            var prop;
            if (this.multiIs('array', obj1, obj2)) {
                return obj1.concat(obj2);
            }
            for (prop in obj2) {
                if (this.has(obj2, prop)) {
                    if (this.has(obj1, prop)) {
                        obj1['base'] = obj1['base'] || {};
                        obj1['base'][prop] = obj1[prop];
                    }
                    if (this.isObject(obj2[prop])) {
                        obj1[prop] = this.combine({}, obj2[prop]);
                    } else {
                        obj1[prop] = obj2[prop];
                    }
                }
            }
            return obj1;
        },
        /**
         * Is a given variable a DOM node list?
         * @param {Object}
         * @return {Boolean}
         */
        isDomList = function (obj) {
            return (/^\[object (HTMLCollection|NodeList|Object)\]$/).test(
                toString.call(obj)) && this.isNumber(obj.length) &&
                    (obj.length === 0 || (typeof obj[0] === "object" &&
                        obj[0].nodeType > 0));
        },
        /**
         * Converts any iterable type into an array
         * @param {Object}
         * @return {Array}
         */
        toArray = function (iterable) {
            var name,
                arr = [];

            if (!iterable) {
                return [iterable];
            }
            if (this.isArgument(iterable)) {
                return Array.prototype.slice.call(iterable);
            }
            if (this.isString(iterable)) {
                iterable.split('');
            }
            if (this.isArray(iterable)) {
                return Array.prototype.slice.call(iterable);
            }
            if (this.isDomList(iterable)) {
                return Array.prototype.slice.call(iterable);
            }
            for (name in iterable) {
                if (this.has(iterable, name)) {
                    arr.push(iterable[name]);
                }
            }
            return arr;
        },
        /**
         * function to check if a string, array, or object contains a needed
         * string
         * @param {Sting|Array|Object} obj
         * @param {String} The needed string
         */
        contains = function (obj, needed) {
            if (this.isString(obj)) {
                if (obj.indexOf(needed) !== -1) {
                    return true;
                }
                return false;
            }
            if (this.isArray(obj)) {
                if (this.indexOf(obj, needed) !== -1) {
                    return true;
                }
                return false;
            }
            return this.has(obj, needed);
        },
        /**
         * Returns the position of the first occurrence of an item in an
         * array, or -1 if the item is not included in the array.
         * Delegates to ECMAScript 5's native indexOf if available.
         */
        indexOf = function (array, needs) {
            var max = 0;
            if (array === null) {
                return -1;
            }
            if (array.indexOf) {
                return array.indexOf(needs);
            }
            max = array.length;
            while (max--) {
                if (array[max] === needs) {
                    return max;
                }
            }
            return -1;
        },
        /**
         * Is a given value a DOM element?
         * @param {Object}
         * @return {Boolean}
         */
        isElement = function (obj) {
            return !!(obj && obj.nodeType === 1);
        },
        /**
         * Will return the size of an object
         * The object you pass in will be iterated
         * The number of iterations will be counted and returned
         * If you pass in another datatype, it will return the length
         * property (if suitable)
         * @param {Object} The object you want to know the size of
         * @return {Number} The size of the object
         */
        size = function (obj) {
            var size = 0,
                key;
            if (!obj) {
                return 0;
            }
            if (this.isObject(obj)) {
                for (key in obj) {
                    if (this.has(obj, key)) {
                        ++size;
                    }
                }
            }
            if (this.isString(obj) || this.isArray(obj) ||
                this.isArguments(obj)) {
                size = obj.length;
            }
            if (this.isNumber(obj)) {
                size = obj.toString().length;
            }
            return size;
        },
        /**
         * Will clone a object
         * @param {Object} object that you want to clone
         * @return cloned object.
         */
        clone = function (obj) {
            return this.combine({}, obj, true);
        },
        /**
         * Is a given value a regular expression?
         * @param {Object}
         * @return {Boolean}
         */
        isRegex = function (obj) {
            return !!(obj && obj.test && obj.exec && (obj.ignoreCase ||
                obj.ignoreCase === false));
        },
        /**
         * Retrieve the names of an object's properties.
         * Delegates to ECMAScript 5's native Object.keys
         * @params {Object}
         * returns {Array}
         */
        keys = Object.prototype.keys || function (obj) {
            var keys = [],
                key;
            if (obj == Object(obj)) {
                for (key in obj) {
                    if (this.has(obj, key)) {
                        keys[keys.length] = key;
                    }
                }
            }
            return keys;
        },
        /**
         * Will ensure that the given function will be called only once.
         * @param {Function}
         * @param {Function}
         */
        once = function (func) {
            var ran = false;
            return function () {
                if (ran) {
                    return;
                }
                ran = true;
                return func.apply(func, arguments);
            };
        },
        /**
         * Memoize an expensive function by storing its results.
         * @param {Function}
         * @param {Function} hasher, the hasher must return a hash of the
         * arguments that are send to the function
         */
        memoize = function (func, hasher) {
            var memo = {};
            //  Check if hasher is set else use default hasher
            hasher = hasher || function (key) {
                return key;
            };
            //  Return function
            return function () {
                var key = hasher.apply(null, arguments);
                return this.has(memo, key) ? memo[key] : (memo[key] =
                    func.apply(func, arguments));
            };
        },
        /**
         * Removes an object from an array
         * @param {Array} The array to remove the object from 
         * @param {Obj} The object to reomve
         */
        removeObject = function (arr, obj) {
            var i,
                ln;

            for (i = 0, ln = arr.length; i < ln; ++i) {       
                if (arr[i] === obj) {
                    arr.splice(i, 1);
                    break;
                }
            }
        },
        getStyle = function (el, prop, asNumber) {
            var style;
            if (el.style && this.isEmpty(el.style[prop])) {
                if (el.currentStyle) {
                    style = el.currentStyle[prop];
                }
                else if (win.getComputedStyle) {
                    style = doc.defaultView.getComputedStyle(el, null)
                        .getPropertyValue(prop);
                }
            } else {
                if (el.style) {
                    style = el.style[prop];
                }
            }
            return asNumber ? parseFloat(style) : style;
        },
        /**
         * Checks if the given argument is an existing function, 
         * using typeof
         * @param {possibleFunction} The function to check if it exists
         * returns {Boolean}
         */
        isFunctionByType = function (possibleFunction) {
            return (typeof(possibleFunction) == typeof(Function));
        },
        /**
         * Returns a node on the given coordinates if it's found
         * @param {x} The x coordinate of the position to test
         * @param {y} The y coordinate of the position to test
         * @param {omitNode} The node to omit (f.e. when dragging)
         * returns {Node} The node at the given coordinates
         */
        getNodeOnPoint = function (x, y, omitNode) {
            var element;
            if (omitNode) {
                omitNode.style.display = 'none';
            }
            element = doc.elementFromPoint(x, y);
            if (element && this && this.containsClass(element, 'omit')) {
                element = getNodeOnPoint(x, y, element);
            }
            if (omitNode) {
                omitNode.style.display = '';
            }
            return element;
        },
        /**
         * Returns an array of nodes on the given coords, if any are found
         * @param {x} The x coordinate of the position to test
         * @param {y} The y coordinate of the position to test
         * @param {omitNode} The node to omit (f.e. when dragging)
         * returns {Array} An array of nodes found at the given
         *         coordinates, topmost first
         *
         * Appears to be a bit hacky, we should replace this if
         * we have the opportunity (and a better solution)
         */
        getNodesOnPoint = function (x, y, omitNode) {
            var currentElement = false,
                elements = [],
                i;
            if (omitNode) {
                omitNode.style.display = 'none';
            }
            currentElement = doc.elementFromPoint(x,y);
            while (currentElement && currentElement.tagName !== 'BODY' &&
                currentElement.tagName !== 'HTML'){
                elements.push(currentElement);
                removeClass(currentElement, 'animated');
                currentElement.style.display = 'none';
                currentElement = doc.elementFromPoint(x,y);
            }
            for (i = 0; i < elements.length; ++i) {
                elements[i].style.display = 'block';
            }
            if (omitNode) {
                omitNode.style.display = 'block';
            }
            return elements;
        },
        /**
         * getData and setData are used to get and set data attributes
         * @param {Element} element, is the element to get/set the data from
         * @param {String} data, is the name of the data to get/set
         * @param {String} value (only in setData), is the value to set
         * returns the value set or get.
         */
        getData = function (element, data) {
            return element.getAttribute("data-"+data);
        },
        setData = function (element, data, value) {
            return element.setAttribute("data-"+data, value);
        },
        /**
         * Safe classList implementation - contains
         * @param {Element} elem
         * @param {String} className
         * returns {Boolean} elem has className
         * SOURCE: hacks.mozilla.org/2010/01/classlist-in-firefox-3-6
         */
        containsClass = function (elm, className) {
            if (doc.documentElement.classList) {
                containsClass = function (elm, className) {
                    return elm.classList.contains(className);
                }
            } else {
                containsClass = function (elm, className) {
                    if (!elm || !elm.className) {
                        return false;
                    }
                    var re = new RegExp('(^|\\s)' + className + '(\\s|$)');
                    return elm.className.match(re);
                }
            }
            return containsClass(elm, className);
        },
        /**
         * Safe classList implementation - add
         * @param {Element} elem
         * @param {Mixed} className (Classname string or array with classes)
         * returns {Function ref} the called function
         * SOURCE: hacks.mozilla.org/2010/01/classlist-in-firefox-3-6
         */
        addClass = function (elm, className) {
            var i, ln, self = this;
            if (doc.documentElement.classList) {
                addClass = function (elm, className) {
                    if (self.isArray(className)) {
                        for (i = 0, ln = className.length; i < ln; ++i) {
                            elm.classList.add(className[i]);  
                        }
                    } else {
                        elm.classList.add(className);
                    }
                }
            } else {
                addClass = function (elm, className) {
                    if (!elm) {
                        return false;
                    }
                    if (!containsClass(elm, className)) {
                        if (self.isArray(className)) {
                            for (i = 0, ln = className.length; i < ln; ++i) {
                                elm.className += (elm.className ? ' ' : '') + 
                                className[i];
                            }
                        } else {
                            elm.className += (elm.className ? ' ' : '') + 
                            className;
                        }
                    }
                }
            }
            return addClass(elm, className);
        },
        /**
         * Safe classList implementation - remove
         * @param {Element} elem
         * @param {String} className
         * returns {Function ref} the called function
         * SOURCE: hacks.mozilla.org/2010/01/classlist-in-firefox-3-6
         */
        removeClass = function (elm, className) {
            if (doc.documentElement.classList) {
                removeClass = function (elm, className) {
                    elm.classList.remove(className);
                }
            } else {
                removeClass = function (elm, className) {
                    if (!elm || !elm.className) {
                        return false;
                    }
                    var regexp = new RegExp("(^|\\s)" + className +
                        "(\\s|$)", "g");
                    elm.className = elm.className.replace(regexp, "$2");
                }
            }
            return removeClass(elm, className);
        },
        removeClasses = function (elm) {
            elm.className = '';
            elm.setAttribute('class','');
        },
        /**
         * Safe classList implementation - toggle
         * @param {Element} elem
         * @param {String} className
         * returns {Boolean} elem had className added
         * SOURCE: hacks.mozilla.org/2010/01/classlist-in-firefox-3-6
         */
        toggleClass = function (elm, className)
        {
            if (doc.documentElement.classList &&
                doc.documentElement.classList.toggle) {
                toggleClass = function (elm, className) {
                    return elm.classList.toggle(className);
                }
            } else {
                toggleClass = function (elm, className) {
                    if (containsClass(elm, className))
                    {
                        removeClass(elm, className);
                        return false;
                    } else {
                        addClass(elm, className);
                        return true;
                    }
                }
            }
            return toggleClass(elm, className);
        },
        // Cross-browser helper for triggering events on elements
        triggerEvent = function (el, type) {
            if (document.createEvent) {
                var evt = document.createEvent('MouseEvents');
                evt.initEvent(type, true, false);
                el.dispatchEvent(evt);
                return true;
            } else if (document.createEventObject) {
                el.fireEvent('on' + type);
                return true;
            } else if (typeof el['on' + type] === 'function') {
                el['on' + type]();
                return true;
            }
            return false;
        },
        $ = function (query) {
            return doc.querySelector(query);
        },
        setAnimationFrameTimeout = function (callback, timeout) {
            var now = new Date().getTime(),
                rafID = null;
            
            if (timeout === undefined) timeout = 1;
            
            function animationFrame() {
                var later = new Date().getTime();
                
                if (later - now >= timeout) {
                    callback();
                } else {
                    rafID = requestAnimationFrame(animationFrame);
                }
            }

            animationFrame();
            return {
                /**
                 * On supported browsers cancel this timeout.
                 */
                cancel: function() {
                    if (typeof cancelAnimationFrame !== 'undefined') {
                        cancelAnimationFrame(rafID);
                    }
                }
            };
        },
        /**
         * Adds or removes a CSS3 cross vendor animation listener to an element
         * @param {Element} elememt: the element to add the listeners to
         * @param {String} eventName: the event name you want to listen to:
         * 'start', 'iteration' or 'end'
         * @param {Function} callback: The callback function
         * @param {String} type: The type of operation: 'add' or 'remove', defaults to 'add'
         */
        animationEvent = function (element, eventName, callback, type) {
            var vendors = {
                    start: ['animationstart', 'animationstart', 'webkitAnimationStart',
                        'oanimationstart', 'MSAnimationStart'],
                    iteration: ['animationiteration', 'animationiteration',
                        'webkitAnimationIteration', 'oanimationiteration',
                            'MSAnimationIteration'],
                    end: ['animationend', 'animationend', 'webkitAnimationEnd',
                        'oanimationend', 'MSAnimationEnd'],
                    tend: ['transitionend', 'transitionend', 'webkitTransitionEnd',
                          'otransitionend', 'MSTransitionEnd']
                },
                vendor = vendors[eventName] || [],
                type = type || 'add',
                l, i;

            for (i = 0, l = vendor.length; i < l; ++i) {
                if (type === 'add') {
                    element.addEventListener(vendor[i], callback, false);
                } else if (type === 'remove') {
                    element.removeEventListener(vendor[i], callback, false);
                }
            }
        },
        domReady = function (callback) {
            var state = doc.readyState;
            if (state === 'complete' || state === 'interactive') {
                callback();
            } else {
                if (!!(win.addEventListener)) {
                    win.addEventListener('DOMContentLoaded', callback);
                } else {
                    win.attachEvent('onload', callback);
                }
            }
        };

        if (!Object.prototype.hasOwnProperty) {
            Object.prototype.hasOwnProperty = function(prop) {
                var proto = obj.__proto__ || obj.constructor.prototype;
                return (prop in this) && (!(prop in proto) || proto[prop] !== this[prop]);
            };
        }

        // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        // http://my.opera.com/emoller/blog/2011/12/20
        //  /requestanimationframe-for-smart-er-animating

        // requestAnimationFrame polyfill by Erik M&#246;ller. fixes from
        //  Paul Irish and Tino Zijdel

        // MIT license
        (function() {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            var win = window;
            for(var x = 0; x < vendors.length && !win.requestAnimationFrame;
                ++x) {
                    win.requestAnimationFrame = win[vendors[x]+
                        'RequestAnimationFrame'];
                    win.cancelAnimationFrame = win[vendors[x]+
                        'CancelAnimationFrame'] ||
                    win[vendors[x]+'CancelRequestAnimationFrame'];
            }

            if (!win.requestAnimationFrame) {
                win.requestAnimationFrame = function(callback, element) {
                    var currTime = new Date().getTime();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = win.setTimeout(
                        function() {
                            callback(currTime + timeToCall); 
                        }, 
                        timeToCall
                    );
                    lastTime = currTime + timeToCall;
                    return id;
                };
            }

            if (!win.cancelAnimationFrame) {
                win.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
        }());

        CanvasRenderingContext2D.prototype.clear = 
            CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
                if (preserveTransform) {
                    this.save();
                    this.setTransform(1, 0, 0, 1, 0, 0);
                }
                this.clearRect(0, 0, this.canvas.width, this.canvas.height);

                if (preserveTransform) {
                    this.restore();
                }           
            };

    return {
        isVector: isVector,
        isDimension: isDimension,
        isMatrix: isMatrix,
        isString: isString,
        isArray: isArray,
        isObject: isObject,
        isFunction: isFunction,
        emptyFn: emptyFn,
        isNumber: isNumber,
        isBoolean: isBoolean,
        isDate: isDate,
        isInt: isInt,
        has: has,
        isUndefined: isUndefined,
        isDefined: isDefined,
        isEmpty: isEmpty,
        isArgument: isArgument,
        getRandom: getRandom,
        upperFirst: upperFirst,
        multiIs: multiIs,
        combine: combine,
        imports: imports,
        isDomList: isDomList,
        toArray: toArray,
        contains: contains,
        indexOf: indexOf,
        isElement: isElement,
        size: size,
        clone: clone,
        isRegex: isRegex,
        keys: keys,
        once: once,
        memoize: memoize,
        removeObject: removeObject,
        getStyle: getStyle,
        isFunctionByType: isFunctionByType,
        getNodeOnPoint: getNodeOnPoint,
        getNodesOnPoint: getNodesOnPoint,
        getData: getData,
        setData: setData,
        containsClass: containsClass,
        addClass: addClass,
        removeClass: removeClass,
        removeClasses: removeClasses,
        toggleClass: toggleClass,
        triggerEvent: triggerEvent,
        $: $,
        setAnimationFrameTimeout: setAnimationFrameTimeout,
        animationEvent: animationEvent,
        domReady: domReady,
        arrayMatch: arrayMatch
    };
}(window, window.document));
