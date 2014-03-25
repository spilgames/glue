
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
                has(obj, 'getValue') && isFunction(obj.getValue) &&
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
        },
        stable = (function() {
            // https://github.com/Two-Screen/stable
            // A stable array sort, because `Array#sort()` is not guaranteed stable.
            // This is an implementation of merge sort, without recursion.
            var stable = function(arr, comp) {
                    return exec(arr.slice(), comp);
                },
                // Execute the sort using the input array and a second buffer as work space.
                // Returns one of those two, containing the final result.
                exec = function (arr, comp) {
                    if (typeof(comp) !== 'function') {
                        comp = function(a, b) {
                            return String(a).localeCompare(b);
                        };
                    }

                    // Short-circuit when there's nothing to sort.
                    var len = arr.length;
                    if (len <= 1) {
                        return arr;
                    }

                    // Rather than dividing input, simply iterate chunks of 1, 2, 4, 8, etc.
                    // Chunks are the size of the left or right hand in merge sort.
                    // Stop when the left-hand covers all of the array.
                    var buffer = new Array(len);
                    for (var chk = 1; chk < len; chk *= 2) {
                        pass(arr, comp, chk, buffer);

                        var tmp = arr;
                        arr = buffer;
                        buffer = tmp;
                    }
                    return arr;
                },
                // Run a single pass with the given chunk size.
                pass = function(arr, comp, chk, result) {
                    var len = arr.length;
                    var i = 0;
                    // Step size / double chunk size.
                    var dbl = chk * 2;
                    // Bounds of the left and right chunks.
                    var l, r, e;
                    // Iterators over the left and right chunk.
                    var li, ri;

                    // Iterate over pairs of chunks.
                    for (l = 0; l < len; l += dbl) {
                        r = l + chk;
                        e = r + chk;
                        if (r > len) r = len;
                        if (e > len) e = len;

                        // Iterate both chunks in parallel.
                        li = l;
                        ri = r;
                        while (true) {
                            // Compare the chunks.
                            if (li < r && ri < e) {
                                // This works for a regular `sort()` compatible comparator,
                                // but also for a simple comparator like: `a > b`
                                if (comp(arr[li], arr[ri]) <= 0) {
                                    result[i++] = arr[li++];
                                }
                                else {
                                    result[i++] = arr[ri++];
                                }
                            }
                            // Nothing to compare, just flush what's left.
                            else if (li < r) {
                                result[i++] = arr[li++];
                            }
                            else if (ri < e) {
                                result[i++] = arr[ri++];
                            }
                            // Both iterators are at the chunk ends.
                            else {
                                break;
                            }
                        }
                    }
                };
            stable.inplace = function(arr, comp) {
                var result = exec(arr, comp);

                // This simply copies back if the result isn't in the original array,
                // which happens on an odd number of passes.
                if (result !== arr) {
                    pass(result, null, arr.length, arr);
                }

                return arr;
            };
            // return it instead and keep the method local to this scope
            return stable;
        })();

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
        arrayMatch: arrayMatch,
        sort: {
            stable: stable
        }
    };
}(window, window.document));

/**
 *  @module Glue
 *  @namespace adapters
 *  @desc Provides adapters to interface with native Glue functionality
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
var adapters = adapters || {};
adapters.glue = (function (win, Glue) {
    'use strict';
    return {
        module: {
            create: win.define,
            get: win.require,
            config: win.requirejs.config
        },
        sugar: Glue.sugar,
        audio: Howl
    };
}(window, modules.glue));
/**
 *  @module Glue main
 *  @desc Provides an abstraction layer
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
(function (win) {
    var glue = (function (adapters) {
            'use strict';
            return {
                module: adapters.glue.module,
                sugar: adapters.glue.sugar,
                audio: adapters.glue.audio
            };
        }(adapters));

    win.glue = {
        module: glue.module
    };
    win.game = {};
    glue.module.create('glue', function () {
        return glue;
    });
}(window));
/*
 *  @module BaseComponent
 *  @desc Represents the base for all components
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/basecomponent',
    [
        'glue'
    ],
    function (Glue) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (componentName, baseObject) {
            var name,
                object,
                component;

            if (Sugar.isString(componentName)) {
                name = componentName;
                object = baseObject || {};
            }

            return {
                set: function (componentObject) {
                    if (Sugar.isObject(componentObject)) {
                        component = componentObject;
                        object[componentName] = componentObject;
                        if (Sugar.isFunction(componentObject.register)) {
                            componentObject.register();
                        }
                        return object;
                    }
                },
                getName: function () {
                    return name;
                },
                getBaseObject: function () {
                    return object;
                },
                getComponent: function () {
                    return component;
                },
                register: function (functionName) {
                    object.register(functionName, component[functionName], name);
                },
                unregister: function (functionName) {
                    object.unregister(functionName, name);
                }
            };
        };
    }
);

/*
 *  @module BaseObject
 *  @desc Represents a base object
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/baseobject',
    [
        'glue',
        'glue/math/vector',
        'glue/math/rectangle',
        'glue/math/dimension'
    ],
    function (Glue, Vector, Rectangle, Dimension) {
        var Sugar = Glue.sugar,
            crossInstanceID = 0;
        return function () {
            var name,
                mixins = Array.prototype.slice.call(arguments),
                mixin = null,
                position = Vector(0, 0),
                origin = Vector(0, 0),
                dimension = Dimension(0, 0),
                rectangle,
                l = mixins.length,
                i = 0,
                j = 0,
                typeRegistrants,
                typeRegistrantsLength,
                typeRegistrant,
                acceptedTypes = ['update', 'draw', 'pointerDown', 'pointerMove', 'pointerUp'],
                drawLast = ['animatable', 'spritable', 'spineable'],
                d,
                dLength = drawLast.length,
                drawRegistrant,
                registrants = {
                    destroy: {},
                    draw: {},
                    update: {},
                    pointerDown: {},
                    pointerMove: {},
                    pointerUp: {}
                },
                children = [],
                parent = null,
                uniqueID = ++crossInstanceID,
                callRegistrants = function (type, gameData) {
                    typeRegistrants = registrants[type];
                    for (registrant in typeRegistrants) {
                        if (type === 'draw' && Sugar.contains(drawLast, registrant)) {
                            continue;
                        }
                        typeRegistrants[registrant].call(module, gameData);
                    }
                },
                module = {
                    add: function (object) {
                        return Sugar.combine(this, object);
                    },
                    setName: function (value) {
                        name = value;
                    },
                    getName: function (value) {
                        return name;
                    },
                    update: function (gameData) {
                        var i,
                            l;
                        callRegistrants('update', gameData);
                        // update children
                        for (i = 0, l = children.length; i < l; ++i) {
                            children[i].update(gameData);                            
                        }
                    },
                    count: 0,
                    updateWhenPaused: false,
                    draw: function (gameData) {
                        var scroll = gameData.scroll || Vector(0, 0),
                            context = gameData.context,
                            i,
                            l;

                        context.save();
                        context.translate(
                            position.x - scroll.x,
                            position.y - scroll.y
                        );

                        // draws rotatable, scalable etc.
                        callRegistrants('draw', gameData);

                        // translate to origin
                        context.translate(-origin.x, -origin.y);

                        // draws animatable and spritable
                        for (d = 0; d < dLength; ++d) {
                            drawRegistrant = registrants.draw[drawLast[d]];
                            if (drawRegistrant) {
                                drawRegistrant(gameData);
                            }
                        }
                        // draw children
                        for (i = 0, l = children.length; i < l; ++i) {
                            children[i].draw(gameData);                            
                        }
                        
                        context.restore();
                    },
                    pointerDown: function (e) {
                        callRegistrants('pointerDown', e);
                    },
                    pointerMove: function (e) {
                        callRegistrants('pointerMove', e);
                    },
                    pointerUp: function (e) {
                        callRegistrants('pointerUp', e);
                    },
                    register: function (type, registrant, name) {
                        if (Sugar.contains(acceptedTypes, type) && Sugar.isFunction(registrant)) {
                            registrants[type][name] = registrant;
                        }
                    },
                    unregister: function (type, name) {
                        if (Sugar.contains(acceptedTypes, type) &&
                            Sugar.isFunction(registrants[type][name])) {
                            delete registrants[type][name];
                        }
                    },
                    getPosition: function () {
                        return position;
                    },
                    setPosition: function (value) {
                        if (Sugar.isVector(value)) {
                            position.x = value.x;
                            position.y = value.y;
                            this.updateBoundingBox();
                        }
                    },
                    setPositionObject: function (value) {
                        if (Sugar.isVector(value)) {
                            position = value;
                            this.updateBoundingBox();
                        }
                    },
                    getDimension: function () {
                        return dimension;
                    },
                    setDimension: function (value) {
                        if (Sugar.isDimension(value)) {
                            dimension = value;
                            this.updateBoundingBox();
                        }
                    },
                    getBoundingBox: function () {
                        return rectangle;
                    },
                    setBoundingBox: function (value) {
                        rectangle = value;
                    },
                    updateBoundingBox: function () {
                        var scale = module.scalable ? module.scalable.getScale() : Vector(1, 1),
                            x1 = position.x - origin.x * scale.x,
                            y1 = position.y - origin.y * scale.y,
                            x2 = position.x + (dimension.width - origin.x) * scale.x,
                            y2 = position.y + (dimension.height - origin.y) * scale.y;

                        // swap variables if scale is negative
                        if (scale.x < 0) {
                            x2 = [x1, x1 = x2][0];
                        }
                        if (scale.y < 0) {
                            y2 = [y1, y1 = y2][0];
                        }
                        rectangle = Rectangle(x1, y1, x2, y2);
                    },
                    setOrigin: function (value) {
                        if (Sugar.isVector(value)) {
                            origin.x = Sugar.isNumber(value.x) ? value.x : origin.x;
                            origin.y = Sugar.isNumber(value.y) ? value.y : origin.y;
                            this.updateBoundingBox();
                        }
                    },
                    getOrigin: function () {
                        return origin;
                    },
                    addChild: function (baseObject) {
                        children.push(baseObject);
                        baseObject.setParent(this);

                        if (baseObject.init) {
                            baseObject.init();
                        }
                    },
                    getChildren: function () {
                        return children;
                    },
                    setParent: function (obj) {
                        parent = obj;
                    },
                    getParent: function (obj) {
                        return parent = obj;
                    },
                    getID: function () {
                        return uniqueID;
                    }
                };

            for (i; i < l; ++i) {
                mixin = mixins[i];
                mixin(module);
            }
            return module;
        };
    }
);

/*
 *  @module Animatable
 *  @namespace component
 *  @desc Represents an animatable component
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/animatable', [
        'glue',
        'glue/math/vector',
        'glue/basecomponent',
        'glue/component/spritable'
    ],
    function (Glue, Vector, BaseComponent, Spritable) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('animatable', object),
                spritable = Spritable(object).spritable,
                animationSettings,
                animations = {},
                currentAnimation,
                currentFrame = 0,
                frameCount = 1,
                fps = 60,
                timeBetweenFrames = 1 / fps,
                timeSinceLastFrame = timeBetweenFrames,
                successCallback,
                errorCallback,
                frameWidth,
                frameHeight,
                columns,
                startFrame,
                endFrame,
                image,
                loopCount,
                currentLoop,
                looping,
                onCompleteCallback,
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
                    startFrame = currentAnimation.startFrame;
                    endFrame = currentAnimation.endFrame;
                    currentFrame = startFrame;
                    loopCount = currentAnimation.loopCount || undefined;
                    onCompleteCallback = currentAnimation.onComplete || undefined;
                    currentLoop = 0;
                    looping = true;
                };

            baseComponent.set({
                setup: function (settings) {
                    var animation;
                    if (settings) {
                        if (settings.animation) {
                            animationSettings = settings.animation;
                            if (settings.animation.animations) {
                                animations = settings.animation.animations;
                            }
                            if (!Sugar.isDefined(settings.animation.frameCount) && 
                                (!Sugar.isDefined(settings.animation.frameWidth) ||
                                !Sugar.isDefined(settings.animation.frameHeight))) {
                                throw 'Specify settings.animation.frameCount';
                            }
                        } else {
                            throw 'Specify settings.animation';
                        }
                    }
                    spritable.setup(settings);
                    if (settings.image) {
                        image = settings.image;
                        frameWidth = settings.animation.frameWidth ||
                            settings.image.width / settings.animation.frameCount;
                        frameHeight = settings.animation.frameHeight ||
                            settings.image.height;
                        columns = settings.image.width / frameWidth;
                    }
                },
                update: function (gameData) {
                    if (!looping) {
                        return;
                    }
                    timeSinceLastFrame -= gameData.deltaT;
                    if (timeSinceLastFrame <= 0) {
                        timeSinceLastFrame = timeBetweenFrames;
                        ++currentFrame;
                        if (currentFrame > endFrame) {
                            if (Sugar.isDefined(loopCount)) {
                                ++currentLoop;
                                if (currentLoop === loopCount) {
                                    looping = false;
                                    if (Sugar.isDefined(onCompleteCallback)) {
                                        onCompleteCallback.call(this.animatable);
                                    }
                                }
                            }
                            currentFrame = startFrame;
                        }
                    }
                },
                draw: function (gameData) {
                    var position = object.getPosition(),
                        sourceY = Math.floor((currentFrame / columns)) * frameHeight,
                        sourceX = (currentFrame % columns) * frameWidth,
                        origin = object.getOrigin();

                    gameData.context.drawImage(
                        image,
                        sourceX,
                        sourceY,
                        frameWidth,
                        frameHeight,
                        0,
                        0,
                        frameWidth,
                        frameHeight
                    );
                },
                setAnimation: function (name) {
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
                getBoundingBox: function () {
                    var rectangle = object.getBoundingBox();
                    rectangle.x2 = rectangle.x1 + frameWidth;
                    return rectangle;
                },
                getFrameWidth: function () {
                    return frameWidth;
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
/*
 *  @module Clickable
 *  @namespace component
 *  @desc Used to make a game component perfom an action when she's clicked
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/clickable',
    [
        'glue',
        'glue/basecomponent'
    ],
    function (Glue, BaseComponent) {
        'use strict';

        return function (object) {
            var baseComponent = BaseComponent('clickable', object),
                isClicked = function (e) {
                    return object.getBoundingBox().hasPosition(e.position);
                },
                pointerDownHandler = function (e) {
                    if (isClicked(e)) {
                        if (object.onClickDown) {
                            object.onClickDown(e);
                        }
                        if (object.onClick) {
                            object.onClick(e);
                        }
                    }
                },
                pointerUpHandler = function (e) {
                    if (isClicked(e) && object.onClickUp) {
                        object.onClickUp(e);
                    }
                };

            baseComponent.set({
                pointerDown: function (e) {
                    pointerDownHandler(e);
                },
                pointerUp: function (e) {
                    pointerUpHandler(e);
                },
                register: function () {
                    baseComponent.register('pointerDown');
                    baseComponent.register('pointerUp');
                },
                unregister: function () {
                    baseComponent.unregister('pointerDown');
                    baseComponent.unregister('pointerUp');
                }
            });

            return object;
        };
    }
);

/*
 *  @module Draggable
 *  @namespace component
 *  @desc Used to make a game entity draggable
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/draggable',
    [
        'glue',
        'glue/math/vector',
        'glue/event/system',
        'glue/basecomponent'
    ],
    function (Glue, Vector, Event, BaseComponent) {
        'use strict';
        var draggables = [],
            dragStartTimeout = 30;

        return function (object) {
            var baseComponent = BaseComponent('draggable', object),
                dragging = false,
                dragId,
                grabOffset = Vector(0, 0),
                isHeighestDraggable = function (object) {
                    var i = 0,
                        l = draggables.length,
                        draggable,
                        result = true;

                    for (i; i < l; ++i) {
                        draggable = draggables[i];
                        if (draggable !== object && draggable.z > object.z) {
                            result = false;
                            break;
                        }
                    }
                    return result;
                },
                checkOnMe = function (e) {
                    return object.getBoundingBox().hasPosition(e.position);
                },
                /**
                 * Gets called when the user starts dragging the entity
                 * @name dragStart
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragStart = function (e) {
                    if (checkOnMe(e) && dragging === false) {
                        draggables.push(object);
                        setTimeout(function () {
                            if (isHeighestDraggable(object)) {
                                dragging = true;
                                dragId = e.pointerId;
                                grabOffset = e.position.substract(object.getPosition());
                                if (object.dragStart) {
                                    object.dragStart(e);
                                }
                                return false;
                            }
                        }, dragStartTimeout);
                    }
                },
                /**
                 * Gets called when the user drags this entity around
                 * @name dragMove
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragMove = function (e) {
                    if (dragging === true) {
                        if (dragId === e.pointerId) {
                            object.setPosition(e.position.substract(grabOffset));
                            if (object.dragMove) {
                                object.dragMove(e);
                            }
                        }
                    }
                },
                /**
                 * Gets called when the user stops dragging the entity
                 * @name dragEnd
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragEnd = function (e) {
                    if (dragging === true) {
                        Event.fire('draggable.drop', object, e);
                        draggables = [];
                        dragId = undefined;
                        dragging = false;
                        if (object.dragEnd) {
                            object.dragEnd(e, function () {});
                        }
                        return false;
                    }
                };

            baseComponent.set({
                pointerDown: function (e) {
                    dragStart(e);
                },
                pointerMove: function (e) {
                    dragMove(e);
                },
                pointerUp: function (e) {
                    dragEnd(e);
                },
                dragStartTimeout: function (value) {
                    dragStartTimeout = value;
                },
                register: function () {
                    baseComponent.register('pointerDown');
                    baseComponent.register('pointerMove');
                    baseComponent.register('pointerUp');
                },
                unregister: function () {
                    baseComponent.unregister('pointerDown');
                    baseComponent.unregister('pointerMove');
                    baseComponent.unregister('pointerUp');
                }
            });

            return object;
        };
    }
);

/*
 *  @module Droptarget
 *  @namespace component
 *  @desc Used to make a game entity behave as a droptarget
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/droptarget',
    [
        'glue',
        'glue/event/system',
        'glue/basecomponent'
    ],
    function (Glue, Event, BaseComponent) {
        'use strict';

        return function (object) {
            var baseComponent = BaseComponent('droptarget', object),
                droppedOnMe = function (draggable, e) {
                    return object.getBoundingBox().hasPosition(e.position);
                },
                draggableDropHandler = function (draggable, e) {
                    if (droppedOnMe(object, e) && object.onDrop) {
                        object.onDrop(draggable, e);
                    }
                };

            baseComponent.set({
                setup: function () {
                    Event.on('draggable.drop', draggableDropHandler);
                },
                destroy: function () {
                    Event.off('draggable.drop', draggableDropHandler);
                }
            });

            return object;
        };
    }
);

/*
 *  @module Fadable
 *  @namespace component
 *  @desc Represents an fadable component
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
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

/*
 *  @module Hoverable
 *  @namespace component
 *  @desc Used to make a game component perfom an action when she's hovered over
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/hoverable',
    [
        'glue',
        'glue/basecomponent'
    ],
    function (Glue, BaseComponent) {
        'use strict';

        return function (object) {
            // TODO: add state constants
            var baseComponent = BaseComponent('hoverable', object),
                state = 'not hovered',
                isHovered = function (e) {
                    return object.getBoundingBox().hasPosition(e.position);
                },
                pointerMoveHandler = function (e) {
                    if (isHovered(e)) {
                        if (state === 'not hovered') {
                            if (object.hoverOver) {
                                object.hoverOver(e);
                            }
                            state = 'hovered';
                        }
                    } else {
                        if (state === 'hovered') {
                            if (object.hoverOut) {
                                object.hoverOut(e);
                            }
                            state = 'not hovered';
                        }
                    }
                };

            baseComponent.set({
                pointerMove: function (e) {
                    pointerMoveHandler(e);
                },
                register: function () {
                    baseComponent.register('pointerMove');
                },
                unregister: function () {
                    baseComponent.unregister('pointerMove');
                }
            });

            return object;
        };
    }
);

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
/*
 *  @module Movable
 *  @namespace component
 *  @desc Represents an movable component
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/movable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math/vector'
    ],
    function (Glue, BaseComponent, Vector) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('movable', object),
                position,
                targetPosition = null,
                moveSpeed = 100,
                atTarget = true,
                rotation = 0;

            baseComponent.set({
                update: function (gameData) {
                    var deltaT = gameData.deltaT;
                    if (targetPosition !== null) {
                        var radian,
                            deltaX,
                            deltaY;

                        position = object.getPosition();
                        deltaX = targetPosition.x - position.x,
                        deltaY = targetPosition.y - position.y;

                        // Pythagorean theorem : c = √( a2 + b2 )
                        // We stop moving if the remaining distance to the endpoint
                        // is smaller then the step iterator (moveSpeed * deltaT).
                        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < moveSpeed * deltaT) {
                            atTarget = true;
                            position = targetPosition;
                            object.setPosition(position);
                        } else {
                            // Update the x and y position, using cos for x and sin for y
                            // and get the right speed by multiplying by the speed and delta time.
                            radian = Math.atan2(deltaY, deltaX);
                            position.x += Math.cos(radian) * moveSpeed * deltaT;
                            position.y += Math.sin(radian) * moveSpeed * deltaT;
                            rotation = radian * 180 / Math.PI;
                            object.setPosition(position);                      
                        }
                    }
                },
                hasTarget: function () {
                    return targetPosition !== null;
                },
                atTarget: function () {
                    return atTarget;
                },
                getRotation: function () {
                    return rotation;
                },
                setTarget: function (target) {
                    if (!Sugar.isObject(target) && Sugar.isDefined(target.x) &&
                        Sugar.isDefined(target.y)) {
                            throw 'Invalid target supplied';
                    }
                    atTarget = false;
                    targetPosition = target;
                },
                setMoveSpeed: function (speed) {
                    if (!Sugar.isNumber(speed)) {
                        throw 'Invalid speed supplied';
                    }
                    moveSpeed = speed;
                },
                register: function () {
                    baseComponent.register('update');
                },
                unregister: function () {
                    baseComponent.unregister('update');
                }
            });

            return object;
        };
    }
);

glue.module.create(
    'glue/component/plugin/spineable', [
        'glue',
        'glue/basecomponent',
        'glue/math/rectangle',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/loader'
    ],
    function (Glue, BaseComponent, Rectangle, Vector, Dimension, Loader) {
        'use strict';
        // - cross instance private members -
        var Sugar = Glue.sugar;

        /**
         * Constructor
         * @name
         * @memberOf Spineable
         * @function
         * @param {Object} obj: the entity object
         * @param {Object} spineSettings: contains json and atlas
         */
        return function (object) {
            // - per instance private members -
            var baseComponent = BaseComponent('spineable', object),
                atlas = {},
                skeletons = {},
                skeletonJson = {},
                skeletonData = {},
                stateData = {},
                state = {},
                currentSkeleton = '',
                currentAnimationStr = '',
                time = new Date().getTime(),
                vertices = Array(8),
                settings,
                rectangle = Rectangle(0, 0, 0, 0),
                skeletonRectangles = {},
                cornerPoints = {},
                origins = {},
                // remembers the skeleton attached to the animation
                animations = {},
                /**
                 * Initalizes the animation
                 * @name initSpine
                 * @memberOf Spineable
                 * @function
                 */
                initSpine = function (spineSettings) {
                    var i = 0;
                    if (!Sugar.isDefined(spineSettings)) {
                        throw 'Specify settings object to Spine';
                    }
                    if (!Sugar.isDefined(spineSettings.animation)) {
                        throw 'Specify animation to Spine';
                    }
                    // convert to array of strings
                    if (typeof spineSettings.animation === 'string') {
                        spineSettings.animation = [spineSettings.animation];
                    }
                    for (i; i < spineSettings.animation.length; ++i) {
                        currentSkeleton = spineSettings.animation[i];
                        addAtlas(spineSettings.animation[i]);
                        addSkeletonData(spineSettings.animation[i]);
                    }
                    if (spineSettings.position && object) {
                        object.setPosition(spineSettings.position);
                    }
                    // set skeleton back to first specified
                },
                /**
                 * Loads the atlas data
                 * @name loadAtlas
                 * @memberOf Spineable
                 * @function
                 */
                addAtlas = function (assetName) {
                    var atlasText = Loader.getBinary(assetName),
                        p = {},
                        image = Loader.getImage(assetName);
                    atlas[currentSkeleton] = new spine.Atlas(atlasText, {
                        load: function (page, path) {
                            var texture = image;
                            page.image = texture;
                            page.width = texture.width;
                            page.height = texture.height;
                            p = page;
                        }
                    });
                    atlas[currentSkeleton].updateUVs(p);
                },
                /**
                 * Adds the skeleton data to arrays
                 * @name addSkeletonData
                 * @memberOf Spineable
                 * @function
                 */
                addSkeletonData = function (assetName) {
                    var i = 0,
                        name;
                    skeletonJson[currentSkeleton] = new spine.SkeletonJson(
                        new spine.AtlasAttachmentLoader(atlas[currentSkeleton])
                    );
                    if (settings.skeletonResolution) {
                        skeletonJson[currentSkeleton].scale = settings.skeletonResolution;
                    }

                    skeletonData[currentSkeleton] = skeletonJson[currentSkeleton].readSkeletonData(
                        Loader.getJSON(assetName)
                    );
                    skeletons[currentSkeleton] = new spine.Skeleton(skeletonData[currentSkeleton]);
                    spine.Bone.yDown = true;
                    if (object) {
                        skeletons[currentSkeleton].getRootBone().x = object.getPosition().x;
                        skeletons[currentSkeleton].getRootBone().y = object.getPosition().y;
                    }
                    skeletons[currentSkeleton].updateWorldTransform();

                    stateData[currentSkeleton] = new spine.AnimationStateData(skeletonData[currentSkeleton]);
                    state[currentSkeleton] = new spine.AnimationState(stateData[currentSkeleton]);

                    // remember which animations belong to which animation
                    for (i; i < skeletonData[currentSkeleton].animations.length; ++i) {
                        name = skeletonData[currentSkeleton].animations[i].name;
                        if (Sugar.has(animations, name)) {
                            throw ('Animation with name ' + name + ' already exists');
                        }
                        animations[name] = currentSkeleton;
                    }
                    calculateRectangle();
                },
                /**
                 * Calculate rectangle by setting up the skeleton once
                 * @name calculateRectangle
                 * @memberOf Spineable
                 * @function
                 */
                calculateRectangle = function () {
                    var skeleton = skeletons[currentSkeleton],
                        i = 0,
                        l = skeleton.slots.length,
                        slot = {},
                        attachment = {},
                        boneRectangle = Rectangle(0, 0, 0, 0),
                        rootBone = skeleton.getRootBone(),
                        skeletonRectangle = Rectangle(0, 0, 0, 0);
                    if (object) {
                        skeletonRectangle.x1 = object.getPosition().x;
                        skeletonRectangle.y1 = object.getPosition().y;
                    }
                    // set up the skeleton to get width/height of the sprite
                    for (i; i < l; ++i) {
                        slot = skeleton.slots[i];
                        attachment = slot.attachment;
                        if (!(attachment instanceof spine.RegionAttachment)) {
                            continue;
                        }
                        attachment.computeVertices(skeleton.x, skeleton.y, slot.bone, vertices);
                        boneRectangle.x1 = vertices[2];
                        boneRectangle.y1 = vertices[3];
                        boneRectangle.setWidth(attachment.width);
                        boneRectangle.setHeight(attachment.height);
                        skeletonRectangle.union(boneRectangle);
                    }
                    skeletonRectangles[currentSkeleton] = skeletonRectangle;
                    cornerPoints[currentSkeleton] = Vector(0, 0);
                    cornerPoints[currentSkeleton].x = skeletonRectangle.x1 - rootBone.x;
                    cornerPoints[currentSkeleton].y = skeletonRectangle.y1 - rootBone.y;
                    origins[currentSkeleton] = Vector(0, 0);
                    updateVisible();
                },
                /**
                 * Update visible component's dimension to correct skeleton
                 * @name updateBoundingbox
                 * @memberOf Spineable
                 * @function
                 */
                updateVisible = function () {
                    var skeletonRectangle = skeletonRectangles[currentSkeleton],
                        width = skeletonRectangle.getWidth(),
                        height = skeletonRectangle.getHeight();
                    if (object) {
                        // update visible dimension
                        object.setDimension(Dimension(width, height));
                    }
                };

            // - external interface -
            baseComponent.set({
                /**
                 * Draw the spine component
                 * @name draw
                 * @memberOf Spineable
                 * @function
                 */
                draw: function (gameData) {
                    var context = gameData.context,
                        slot = {},
                        attachment = {},
                        skeleton = skeletons[currentSkeleton],
                        i = 0,
                        l = skeleton.drawOrder.length,
                        x, y, w, h,
                        px, py,
                        scaleX, scaleY,
                        boneScaleX, boneScaleY,
                        angle,
                        corner = cornerPoints[currentSkeleton],
                        origin = origins[currentSkeleton],
                        position = Vector(0, 0),
                        offset;

                    if (object) {
                        position = object.getPosition();
                    }
                    offset = Vector((corner.x + origin.x), (corner.y + origin.y));
                    for (i; i < l; ++i) {
                        slot = skeleton.drawOrder[i];
                        attachment = slot.attachment;
                        if (!(attachment instanceof spine.RegionAttachment)) {
                            continue;
                        }
                        attachment.computeVertices(skeleton.x, skeleton.y, slot.bone, vertices);
                        x = (vertices[2] - offset.x);
                        y = (vertices[3] - offset.y);
                        w = attachment.rendererObject.width;
                        h = attachment.rendererObject.height;
                        px = attachment.rendererObject.x;
                        py = attachment.rendererObject.y;
                        scaleX = attachment.scaleX;
                        scaleY = attachment.scaleY;
                        boneScaleX = slot.bone.scaleX;
                        boneScaleY = slot.bone.scaleY;
                        angle = -(slot.bone.worldRotation + attachment.rotation) * Math.PI / 180;

                        context.save();
                        context.translate(Math.round(x), Math.round(y));
                        context.rotate(angle);
                        context.globalAlpha = slot.a;
                        context.scale(boneScaleX * scaleX, boneScaleY * scaleY);

                        context.drawImage(attachment.rendererObject.page.image, px, py, w, h, 0, 0, w, h);
                        context.restore();
                    }

                    // draw boundingbox
                    // var b = object.getBoundingBox();
                    // context.strokeRect(b.x1, b.y1, b.getWidth(), b.getHeight());
                },
                /**
                 * Update the animation
                 * @name update
                 * @memberOf Spineable
                 * @function
                 */
                update: function (gameData) {
                    var skeleton = skeletons[currentSkeleton];
                    state[currentSkeleton].update(gameData.deltaT);
                    state[currentSkeleton].apply(skeleton);
                    skeleton.updateWorldTransform();
                    return true;
                },
                /**
                 * Setup the spineable
                 * @name setup
                 * @memberOf Spineable
                 * @function
                 */
                setup: function (s) {
                    settings = s;
                    initSpine(settings);
                },
                /**
                 * Set a new animation if it's not playing yet, returns true if successful
                 * @name setAnimation
                 * @memberOf Spineable
                 * @function
                 * @param {String} animationName: Name of the animation
                 * @param {Boolean} loop: (Optional) Wether the animation should loop, default is true
                 * @param {Number} speed:(Optional)  Speed of the animation, default is 1.0
                 * @param {Function} onComplete: (Optional) Callback function when animation ends/loops
                 */
                setAnimation: function (animationName, loop, speed, onComplete) {
                    if (!Sugar.has(animations, animationName)) {
                        throw ('There is no skeleton which contains an animation called ' + animationName);
                    }
                    if (currentAnimationStr === animationName) {
                        return false;
                    }
                    // set to correct skeleton if needed
                    object.spineable.setSkeleton(animations[animationName]);
                    // set callback
                    if (Sugar.isDefined(onComplete)) {
                        state[currentSkeleton].onComplete = onComplete;
                    } else {
                        state[currentSkeleton].onComplete = null;
                    }
                    if (!Sugar.isDefined(loop)) {
                        loop = true;
                    }
                    if (!Sugar.isDefined(speed)) {
                        speed = 1.0;
                    }
                    // set animation
                    currentAnimationStr = animationName;
                    state[currentSkeleton].setAnimationByName(0, animationName, loop);
                    state[currentSkeleton].timeScale = speed;
                    skeletons[currentSkeleton].setSlotsToSetupPose();
                    return true;
                },
                /**
                 * Get current animation being played
                 * @name getAnimation
                 * @memberOf Spineable
                 * @function
                 */
                getAnimation: function () {
                    return currentAnimationStr;
                },
                /**
                 * Retrieves the root bone object of the current skeleton
                 * @name getRootBone
                 * @memberOf Spineable
                 * @function
                 */
                getRootBone: function () {
                    return skeletons[currentSkeleton].getRootBone();
                },
                /**
                 * Gets the current skeleton scale
                 * @name getResolution
                 * @memberOf Spineable
                 * @function
                 */
                getSkeletonResolution: function () {
                    return skeletonJson[currentSkeleton].scale;
                },
                /**
                 * Adds another skeleton json to the spineable
                 * @name addSkeleton
                 * @memberOf Spineable
                 * @function
                 * @param {Object} spineSettings: object with atlasImage, atlas, skeleton and optionally scale and resolution
                 */
                addSkeleton: function (spineSettings) {
                    initSpine(spineSettings);
                },
                /**
                 * Sets the current skeleton json
                 * @name setSkeleton
                 * @memberOf Spineable
                 * @function
                 * @param {String} strSkeleton: skeleton json name (as specified in resources)
                 */
                setSkeleton: function (strSkeleton) {
                    if (currentSkeleton === strSkeleton) {
                        return;
                    }
                    currentSkeleton = strSkeleton;
                    updateVisible();
                },
                /**
                 * Returns the name of the current skeleton json
                 * @name getSkeleton
                 * @memberOf Spineable
                 * @function
                 */
                getSkeleton: function () {
                    return currentSkeleton;
                },
                /**
                 * Sets the origin of the a skeleton (it's summed with visible's origin)
                 * @name setOrigin
                 * @memberOf Spineable
                 * @function
                 * @param {Object} pos: x and y position relative to the upper left corner point
                 */
                setOrigin: function (pos, skeletonName) {
                    if (Sugar.has(origins, skeletonName)) {
                        throw ("This skeleton doesn't exist: " + skeletonName);
                    }
                    origins[skeletonName] = pos;
                    if (currentSkeleton === skeletonName) {
                        updateVisible();
                    }
                },
                /**
                 * Gets the origin of the current skeleton
                 * @name getOrigin
                 * @memberOf Spineable
                 * @function
                 */
                getOrigin: function () {
                    return origins[currentSkeleton];
                },
                /**
                 * Resets the origin of the current skeleton to the root bone position
                 * @name resetOrigin
                 * @memberOf Spineable
                 * @function
                 */
                resetOrigin: function () {
                    origins[currentSkeleton] = {
                        x: -cornerPoints[currentSkeleton].x,
                        y: -cornerPoints[currentSkeleton].y
                    };
                    updateVisible();
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
/*
 *  @module Rotatable
 *  @namespace component
 *  @desc Represents a rotatable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/rotatable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math/vector'
    ],
    function (Glue, BaseComponent, Vector) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('rotatable', object),
                angle = 0,
                rotationSpeed = 100,
                targetAngle = 0,
                rotationDirection = 1,
                toDegree = 180 / Math.PI,
                atTarget = true,
                toRadian = Math.PI / 180;

            baseComponent.set({
                update: function (gameData) {
                    var deltaT = gameData.deltaT,
                        tarDeg,
                        curDeg,
                        finalSpeed,
                        distance,
                        self = object.rotatable;
                    
                    if (angle !== targetAngle) {
                        tarDeg = self.getTargetDegree(),
                        curDeg = self.getAngleDegree(),
                        finalSpeed = rotationSpeed * rotationDirection,
                        distance = (tarDeg > curDeg) ? (tarDeg - curDeg) : (curDeg - tarDeg);

                        if (Math.floor(Math.abs(distance)) < Math.abs(finalSpeed * deltaT)) {
                            angle = targetAngle;
                            atTarget = true;
                        } else {
                            curDeg += finalSpeed * deltaT;
                            self.setAngleDegree(curDeg);
                        }
                    }
                },
                draw: function (gameData) {
                    gameData.context.rotate(angle);
                },
                setAngleDegree: function (value) {
                    angle = Sugar.isNumber(value) ? value : angle;
                    angle *= toRadian;
                },
                setAngleRadian: function (value) {
                    angle = Sugar.isNumber(value) ? value : angle;
                },
                setTargetDegree: function (value, clockwise) {
                    targetAngle = Sugar.isNumber(value) ? value : targetAngle;
                    targetAngle *= toRadian;
                    if (Sugar.isDefined(clockwise)) {
                        if (clockwise) {
                            rotationDirection = 1;
                        } else {
                            rotationDirection = -1;
                        }
                    }
                    atTarget = false;
                },
                setTargetRadian: function (value, clockwise) {
                    targetAngle = Sugar.isNumber(value) ? value : targetAngle;
                    if (Sugar.isDefined(clockwise)) {
                        if (clockwise) {
                            rotationDirection = 1;
                        } else {
                            rotationDirection = -1;
                        }
                    }
                    atTarget = false;
                },
                setSpeed: function (value) {
                    rotationSpeed = Sugar.isNumber(value) ? value : rotationSpeed;
                    rotationSpeed = Math.floor(rotationSpeed);
                },
                getAngleDegree: function () {
                    return angle * toDegree;
                },
                getAngleRadian: function () {
                    return angle;
                },
                getTargetDegree: function () {
                    return targetAngle * toDegree;
                },
                getTargetRadian: function () {
                    return targetAngle;
                },
                atTarget: function () {
                    return atTarget;
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

/*
 *  @module Scalable
 *  @namespace component
 *  @desc Represents a scalable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/scalable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math/vector',
        'glue/math/dimension'
    ],
    function (Glue, BaseComponent, Vector, Dimension) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('scalable', object),
                currentScale = Vector(1, 1),
                targetScale = Vector(1, 1),
                scaleSpeed = 1,
                atTarget = true;

            baseComponent.set({
                update: function (gameData) {
                    if (!atTarget) {
                        var deltaT = gameData.deltaT,
                            radian,
                            deltaX,
                            deltaY,
                            self = this.scalable;

                        deltaX = targetScale.x - currentScale.x,
                        deltaY = targetScale.y - currentScale.y;

                        // Pythagorean theorem : c = √( a2 + b2 )
                        // We stop scaling if the remaining distance to the endpoint
                        // is smaller then the step iterator (scaleSpeed * deltaT).
                        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < scaleSpeed * deltaT) {
                            atTarget = true;
                            self.setScale(targetScale);
                        } else {
                            // Update the x and y scale, using cos for x and sin for y
                            // and get the right speed by multiplying by the speed and delta time.
                            radian = Math.atan2(deltaY, deltaX);
                            currentScale.x += Math.cos(radian) * scaleSpeed * deltaT;
                            currentScale.y += Math.sin(radian) * scaleSpeed * deltaT;
                        }
                    }
                },
                draw: function (gameData) {
                    gameData.context.scale(currentScale.x, currentScale.y);
                },
                setScale: function (vec) {
                    currentScale.x = Sugar.isNumber(vec.x) ? vec.x : currentScale.x;
                    currentScale.y = Sugar.isNumber(vec.y) ? vec.y : currentScale.y;
                    targetScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    targetScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                    object.updateBoundingBox();
                },
                setTarget: function (vec) {
                    targetScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    targetScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                    atTarget = false;
                },
                setSpeed: function (value) {
                    scaleSpeed = Sugar.isNumber(value) ? value : scaleSpeed;
                    scaleSpeed = scaleSpeed / 100;
                },
                getScale: function () {
                    return currentScale;
                },
                getTarget: function () {
                    return targetScale;
                },
                getSpeed: function () {
                    return scaleSpeed * 100;
                },
                atTarget: function () {
                    return atTarget;
                },
                getDimension: function () {
                    var dimension;
                    if (Sugar.isDefined(object.animatable)) {
                        dimension = object.animatable.getDimension();
                    } else if (Sugar.isDefined(object.spritable)) {
                        dimension = object.getDimension();
                    } else {
                        dimension = Dimension(1, 1);
                    }
                    return Dimension(
                            dimension.width * currentScale.x,
                            dimension.height * currentScale.y
                        ); 
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

/*
 *  @module Spritable
 *  @namespace component
 *  @desc Represents a spritable component consisting of a simple image
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/spritable',
    [
        'glue',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/basecomponent'
    ],
    function (Glue, Vector, Dimension, Rectangle, BaseComponent) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('spritable', object),
                image = null;

            baseComponent.set({
                setup: function (settings) {
                    var customPosition;
                    if (settings) {
                        if (settings.image) {
                            image = settings.image;
                        }
                        image = settings.image;
                        if (settings.position) {
                            customPosition = settings.position;
                            // using proper rounding:
                            // http://jsperf.com/math-round-vs-hack/66
                            object.setPosition(Vector(
                                Math.round(customPosition.x),
                                Math.round(customPosition.y)
                            ));
                        }
                        if (settings.dimension) {
                            object.setDimension(settings.dimension);
                        } else if (image) {
                            object.setDimension(Dimension(image.naturalWidth, image.naturalHeight));
                        }
                        if (settings.origin) {
                            object.setOrigin(settings.origin);
                        }
                    }
                },
                draw: function (gameData) {
                    if (!object.animatable) {
                        gameData.context.drawImage(
                            image,
                            0,
                            0
                        );
                    }
                },
                setImage: function (value) {
                    image = value;
                    object.setDimension(Dimension(image.naturalWidth, image.naturalHeight));
                },
                getImage: function () {
                    return image;
                },
                register: function () {
                    baseComponent.register('draw');
                },
                unregister: function () {
                    baseComponent.unregister('draw');
                }
            });

            return object;
        };
    }
);

/*
 *  @module Tweenable
 *  @namespace component
 *  @desc Represents a tweenable component
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @credits Robbert Penner's easing equations
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/tweenable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math'
    ],
    function (Glue, BaseComponent, Mathematics) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('tweenable', object),
                mathematics = Mathematics(),
                availableTweens = ['easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInCubic',
                    'easeOutCubic', 'easeInOutCubic', 'easeInQuart', 'easeOutQuart',
                    'easeInOutQuart', 'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
                    'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeInExpo', 'easeOutExpo',
                    'easeInOutExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeInElastic',
                    'easeOutElastic', 'easeInOutElastic', 'easeInBack', 'easeOutBack',
                    'easeInOutBack', 'easeInBounce', 'easeOutBounce', 'easeInOutBounce'];

            baseComponent.set({
                /*
                    t: current time
                    b: start value
                    c: change in value
                    d: total duration
                */
                getRandomTween: function () {
                    var tweenFunctionName = availableTweens[mathematics.random(0,
                        availableTweens.length)];

                    if (Sugar.isString(tweenFunctionName)) {
                        return tweenFunctionName;
                    } else {
                        return 'easeInQuad';
                    }
                },
                easeInQuad: function (t, b, c, d) {
                    return c*(t/=d)*t + b;
                },
                easeOutQuad: function (t, b, c, d) {
                    return -c *(t/=d)*(t-2) + b;
                },
                easeInOutQuad: function (t, b, c, d) {
                    if ((t/=d/2) < 1) return c/2*t*t + b;
                    return -c/2 * ((--t)*(t-2) - 1) + b;
                },
                easeInCubic: function (t, b, c, d) {
                    return c*(t/=d)*t*t + b;
                },
                easeOutCubic: function (t, b, c, d) {
                    return c*((t=t/d-1)*t*t + 1) + b;
                },
                easeInOutCubic: function (t, b, c, d) {
                    if ((t/=d/2) < 1) return c/2*t*t*t + b;
                    return c/2*((t-=2)*t*t + 2) + b;
                },
                easeInQuart: function (t, b, c, d) {
                    return c*(t/=d)*t*t*t + b;
                },
                easeOutQuart: function (t, b, c, d) {
                    return -c * ((t=t/d-1)*t*t*t - 1) + b;
                },
                easeInOutQuart: function (t, b, c, d) {
                    if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
                    return -c/2 * ((t-=2)*t*t*t - 2) + b;
                },
                easeInQuint: function (t, b, c, d) {
                    return c*(t/=d)*t*t*t*t + b;
                },
                easeOutQuint: function (t, b, c, d) {
                    return c*((t=t/d-1)*t*t*t*t + 1) + b;
                },
                easeInOutQuint: function (t, b, c, d) {
                    if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
                    return c/2*((t-=2)*t*t*t*t + 2) + b;
                },
                easeInSine: function (t, b, c, d) {
                    return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
                },
                easeOutSine: function (t, b, c, d) {
                    return c * Math.sin(t/d * (Math.PI/2)) + b;
                },
                easeInOutSine: function (t, b, c, d) {
                    return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
                },
                easeInExpo: function (t, b, c, d) {
                    return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
                },
                easeOutExpo: function (t, b, c, d) {
                    return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
                },
                easeInOutExpo: function (t, b, c, d) {
                    if (t==0) return b;
                    if (t==d) return b+c;
                    if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
                    return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
                },
                easeInCirc: function (t, b, c, d) {
                    return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
                },
                easeOutCirc: function (t, b, c, d) {
                    return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
                },
                easeInOutCirc: function (t, b, c, d) {
                    if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
                    return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
                },
                easeInElastic: function (t, b, c, d) {
                    var s=1.70158;var p=0;var a=c;
                    if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
                    if (a < Math.abs(c)) { a=c; var s=p/4; }
                    else var s = p/(2*Math.PI) * Math.asin (c/a);
                    return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                },
                easeOutElastic: function (t, b, c, d) {
                    var s=1.70158;var p=0;var a=c;
                    if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
                    if (a < Math.abs(c)) { a=c; var s=p/4; }
                    else var s = p/(2*Math.PI) * Math.asin (c/a);
                    return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
                },
                easeInOutElastic: function (t, b, c, d) {
                    var s=1.70158;var p=0;var a=c;
                    if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
                    if (a < Math.abs(c)) { a=c; var s=p/4; }
                    else var s = p/(2*Math.PI) * Math.asin (c/a);
                    if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                    return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
                },
                easeInBack: function (t, b, c, d, s) {
                    if (s == undefined) s = 1.70158;
                    return c*(t/=d)*t*((s+1)*t - s) + b;
                },
                easeOutBack: function (t, b, c, d, s) {
                    if (s == undefined) s = 1.70158;
                    return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
                },
                easeInOutBack: function (t, b, c, d, s) {
                    if (s == undefined) s = 1.70158; 
                    if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
                    return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
                },
                easeInBounce: function (t, b, c, d) {
                    return c - this.easeOutBounce (d-t, 0, c, d) + b;
                },
                easeOutBounce: function (t, b, c, d) {
                    if ((t/=d) < (1/2.75)) {
                        return c*(7.5625*t*t) + b;
                    } else if (t < (2/2.75)) {
                        return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
                    } else if (t < (2.5/2.75)) {
                        return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
                    } else {
                        return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
                    }
                },
                easeInOutBounce: function (t, b, c, d) {
                    if (t < d/2) return this.easeInBounce (t*2, 0, c, d) * .5 + b;
                    return this.easeOutBounce (t*2-d, 0, c, d) * .5 + c*.5 + b;
                }
            });

            return object;
        };
    }
);

/**
 *  @module Director
 *  @desc Directs a game
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/director',
    [
        'glue',
        'glue/game',
        'glue/screen'
    ],
    function (Glue, Game, Screen) {
        'use strict';
        var Sugar = Glue.sugar,
            screens = {},
            activeScreen = null,
            getScreen = function (name) {
                if (Sugar.isString(name)) {
                    if (Sugar.isObject(screens[name])) {
                        return screens[name]
                    }
                }
            },
            toggleScreen = function (name, action) {
                var screen,
                    objects,
                    i = 0,
                    l;

                if (Sugar.isString(name)) {
                    screen = getScreen(name);
                    if (action === 'show') {
                        Game.add(screen);
                        screen.setShown(true);
                    }
                    if (action === 'hide') {
                        Game.remove(screen);
                        screen.setShown(false);
                    }
                    objects = screen.getObjects();
                    l = objects.length;
                    for (i; i < l; ++i) {
                        if (action === 'show') {
                            Game.add(objects[i]);
                        } else if (action === 'hide') {
                            Game.remove(objects[i]);
                        }
                    }
                    if (action === 'show') {
                        activeScreen = screen;
                    }
                }
            },
            module = {
                /**
                 * Add a screen to the Director
                 * @name addScreen
                 * @memberOf Director
                 * @function
                 */
                addScreen: function (screen) {
                    if (Sugar.isFunction(screen.getName) && Sugar.isObject(screen)) {
                        screens[screen.getName()] = screen;
                    }                    
                },
                /**
                 * Remove a screen from the Director
                 * @name removeScreen
                 * @memberOf Director
                 * @function
                 */
                removeScreen: function (screen) {
                    var screenName;
                    if (Sugar.isFunction(screen.getName) && Sugar.isObject(screen)) {
                        screenName = screen.getName();
                        toggleScreen(screenName, 'hide');
                    }
                    if (Sugar.isObject(screens[screenName])) {
                        delete screens[screenName];
                    }
                },
                /**
                 * Get all screens that are added to the Director
                 * @name getScreens
                 * @memberOf Director
                 * @function
                 */
                getScreens: function () {
                    return screens;
                },
                /**
                 * Show a screen
                 * @name showScreen
                 * @memberOf Director
                 * @function
                 */
                showScreen: function (name) {
                    var activeScreenName;
                    if (Sugar.isString(name)) {
                        if (activeScreen !== null) {
                            activeScreenName = activeScreen.getName();
                            toggleScreen(activeScreenName, 'hide');    
                        }
                        toggleScreen(name, 'show');
                    }
                },
                /**
                 * Hide a screen
                 * @name hideScreen
                 * @memberOf Director
                 * @function
                 */
                hideScreen: function (name) {
                    if (Sugar.isString(name)) {
                        toggleScreen(name, 'hide');
                    }
                }
            };

        return module;
    }
);

/*
 *  @module System
 *  @namespace event
 *  @desc This module offers a very basic pub/sub system event system
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/event/system',
    function () {
        var listeners = [],
            x,
            emitEvent = function (emitter, name, data) {
                var x,
                    listener,
                    ln = listeners.length;

                if (ln > 0) {
                    for (x = 0; x < ln; ++x) {
                        listener = listeners[x];
                        if (listener && listener.name === name) {
                            listener.callback.apply({
                                name: name,
                                emitter: emitter
                            }, data);
                        }
                    }
                }
            };

        return {
            on: function (name, callback) {
                listeners.push({name: name, callback: callback});
                return [name, callback];
            },
            off: function (name, callback) {
                var x,
                    ln,
                    listener;

                for (x = 0, ln = listeners.length; x < ln; ++x) {
                    listener = listeners[x];
                    if (listener && listener.name === name &&
                            listener.callback === callback) {
                        listeners.splice(x, 1);
                    }
                }
            },
            fire: function (eventName) {
                emitEvent('system',
                    eventName,
                    Array.prototype.slice.call(
                        arguments,
                        1,
                        arguments.length
                    )
                );
            }
        };
    }
);

/*
 *  @module Game
 *  @desc Represents a Glue game
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/game',
    [
        'glue',
        'glue/domready',
        'glue/math/vector',
        'glue/event/system',
        'glue/loader'
    ],
    function (Glue, DomReady, Vector, Event, Loader) {
        'use strict';
        var Sugar = Glue.sugar,
            win = null,
            doc = null,
            gameInfo,
            fps = 60,
            objects = [],
            addedObjects = [],
            removedObjects = [],
            addCallbacks = [],
            removeCallbacks = [],
            lastFrameTime = new Date().getTime(),
            canvas = null,
            canvasId,
            context2D = null,
            backBuffer = null,
            backBufferContext2D = null,
            canvasSupported = false,
            canvasDimension = null,
            canvasScale = {},
            scroll = Vector(0, 0),
            isRunning = false,
            isPaused = false,
            debug = false,
            debugBar = null,
            fpsAccumulator = 0,
            fpsTicks = 0,
            fpsMaxAverage = 500000,
            useSort = true,
            sortType = 0,
            gameData = {},
            initCanvas = function () {
                canvas = document.querySelector('#' + canvasId);
                // create canvas if it doesn't exist
                if (canvas === null) {
                    canvas = document.createElement('canvas');
                    canvas.id = canvasId;
                    canvas.width = canvasDimension.width;
                    canvas.height = canvasDimension.height;
                    if (document.getElementById('wrapper') !== null) {
                        document.getElementById('wrapper').appendChild(canvas);    
                    } else {
                        document.body.appendChild(canvas);
                    }
                }
                resizeGame();
                if (canvas.getContext) {
                    canvasSupported = true;
                    context2D = canvas.getContext('2d');
                    backBuffer = document.createElement('canvas');
                    backBuffer.width = canvas.width;
                    backBuffer.height = canvas.height;
                    backBufferContext2D = backBuffer.getContext('2d');
                }
                gameData = {
                    canvas: canvas,
                    context: context2D,
                    backBufferCanvas: backBuffer,
                    backBufferContext2D: backBufferContext2D,
                    canvasScale: canvasScale,
                    canvasDimension: canvasDimension,
                    scroll: scroll
                };
            },
            resizeGame = function () {
                var canvasRatio = canvas.height / canvas.width,
                    windowRatio = window.innerHeight / window.innerWidth,
                    width,
                    height;

                if (windowRatio < canvasRatio) {
                    height = window.innerHeight;
                    width = height / canvasRatio;
                } else {
                    width = window.innerWidth;
                    height = width * canvasRatio;
                }

                canvasScale.x = width / canvasDimension.width;
                canvasScale.y = height / canvasDimension.height;

                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
            },
            sort = function () {
                if (sortType === game.SORT_TYPE_STABLE) {
                    Sugar.sort.stable.inplace(objects, function (a, b) {
                        return a.z - b.z;
                    });
                } else {
                    // default behavior
                    objects.sort(function (a, b) {
                        return a.z - b.z;
                    });
                }
            },
            addObjects = function () {
                var object,
                    callbackObject,
                    i,
                    j;

                if (addedObjects.length) {
                    for (i = 0; i < addedObjects.length; ++i) {
                        object = addedObjects[i];
                        objects.push(addedObjects[i]);
                        if (object.init) {
                            object.init();
                        }
                    };
                    addedObjects = [];
                    if (addCallbacks.length) {
                        for (j = 0; j < addCallbacks.length; ++j) {
                            callbackObject = addCallbacks[j];
                            if (callbackObject) {
                                callbackObject.callback(callbackObject.object);
                            }
                        };
                        addCallbacks = [];
                    }
                }
            },
            removeObjects = function () {
                var object,
                    callbackObject,
                    i,
                    j;

                if (removedObjects.length) {
                    for (i = 0; i < removedObjects.length; ++i) {
                        object = removedObjects[i];
                        if (object.destroy) {
                            object.destroy();
                        }
                        Sugar.removeObject(objects, object);
                    };
                    removedObjects = [];
                    if (removeCallbacks.length) {
                        for (j = 0; j < removeCallbacks.length; ++j) {
                            callbackObject = removeCallbacks[j];
                            if (callbackObject) {
                                callbackObject.callback(callbackObject.object);
                            }
                        };
                        removeCallbacks = [];
                    }
                }
            },
            redraw = function () {
                backBufferContext2D.clear(true);
                context2D.clear(true);
            },
            cycle = function (time) {
                var deltaT,
                    fps,
                    component,
                    avg;

                if (isRunning) {
                    requestAnimationFrame(cycle);
                }
                if (canvasSupported) {
                    if (useSort) {
                        sort();
                    }
                    redraw();
                    removeObjects();
                    addObjects();

                    deltaT = (time - lastFrameTime) / 1000;
                    if (debug) {
                        fps = Math.round(1000 / (time - lastFrameTime), 2);
                        fpsAccumulator += fps;
                        ++fpsTicks;
                        avg = Math.round(fpsAccumulator / fpsTicks);
                        if (fpsAccumulator > fpsMaxAverage) {
                            fpsAccumulator = fpsTicks = 0;
                        }
                        debugBar.innerHTML = '<strong>Glue debug bar</strong>';
                        debugBar.innerHTML += '<br />version: 0.9.7';
                        debugBar.innerHTML += '<br />frame rate: ' + fps + ' fps';
                        debugBar.innerHTML += '<br />average frame rate: ' + avg + 'fps';
                        debugBar.innerHTML += '<br />objects: ' + objects.length;
                        if (gameInfo && gameInfo.name) {
                            debugBar.innerHTML += '<br />game name: ' + gameInfo.name;    
                        }
                    }
                    if (deltaT < 1) {
                        gameData.deltaT = deltaT;
                        gameData.fps = fps;
                        gameData.avg = avg;
                        gameData.objectLength = objects.length;
                        for (var i = 0; i < objects.length; ++i) {
                            component = objects[i];
                            if ((isPaused && component.updateWhenPaused) || !isPaused) {
                                if (component.update) {
                                    component.update(gameData);
                                }
                                if (component.draw) {
                                    component.draw(gameData);
                                }
                            }
                        };
                    }
                    context2D.drawImage(backBuffer, 0, 0);
                    lastFrameTime = time;
                }
            },
            startup = function () {
                initCanvas();
                setupEventListeners();
                cycle(0);
            },
            pointerDown = function (e) {
                //console.log('Pointer down: ', e.position);
                var i,
                    l,
                    component;

                if (isRunning) {
                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        if (component.pointerDown && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                            component.pointerDown(e);
                        }
                    }
                }
            },
            pointerMove = function (e) {
                //console.log('Pointer move: ', e.position);
                var i,
                    l,
                    component;

                if (isRunning) {
                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        if (component.pointerMove && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                            component.pointerMove(e);
                        }
                    }
                }
            },
            pointerUp = function (e) {
                //console.log('Pointer up: ', e.position);
                var i,
                    l,
                    component;

                if (isRunning) {
                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        if (component.pointerUp && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                            component.pointerUp(e);
                        }
                    }
                }
            },
            addTouchPosition = function (e, isTouchEnd) {
                var touch = !isTouchEnd ? e.targetTouches[0] : e.changedTouches[0];
                e.preventDefault();
                e.position = Vector(
                    (touch.pageX - canvas.offsetLeft) / canvasScale.x,
                    (touch.pageY - canvas.offsetTop) / canvasScale.y
                );
            },
            addMousePosition = function (e) {
                e.position = Vector(
                    (e.clientX - canvas.offsetLeft) / canvasScale.x,
                    (e.clientY - canvas.offsetTop) / canvasScale.y
                );
            },
            touchStart = function (e) {
                e.preventDefault();
                addTouchPosition(e);
                pointerDown(e);
            },
            touchMove = function (e) {
                e.preventDefault();
                addTouchPosition(e);
                pointerMove(e);
            },
            touchEnd = function (e) {
                e.preventDefault();
                addTouchPosition(e, true);
                pointerUp(e);
            },
            mouseDown = function (e) {
                e.preventDefault();
                addMousePosition(e);
                pointerDown(e);
            },
            mouseMove = function (e) {
                e.preventDefault();
                addMousePosition(e);
                pointerMove(e);
            },
            mouseUp = function (e) {
                e.preventDefault();
                addMousePosition(e);
                pointerUp(e);
            },
            setupEventListeners = function () {
                // main input listeners
                if ('ontouchstart' in win) {
                    canvas.addEventListener('touchstart', touchStart);
                    canvas.addEventListener('touchmove', touchMove);
                    canvas.addEventListener('touchend', touchEnd);
                } else {
                    canvas.addEventListener('mousedown', mouseDown);
                    canvas.addEventListener('mousemove', mouseMove);
                    canvas.addEventListener('mouseup', mouseUp);
                }
                // automated test listeners
                Event.on('glue.pointer.down', pointerDown);
                Event.on('glue.pointer.move', pointerMove);
                Event.on('glue.pointer.up', pointerUp);

                // window resize listeners
                window.addEventListener('resize', resizeGame, false);
                window.addEventListener('orientationchange', resizeGame, false);

                // touch device listeners to stop default behaviour
                document.body.addEventListener('touchstart', function (e) {
                    if (e && e.preventDefault) {
                        e.preventDefault();
                    }
                    if (e && e.stopPropagation) {
                        e.stopPropagation();
                    }
                    return false;
                });
                document.body.addEventListener('touchmove', function (e) {
                    if (e && e.preventDefault) {
                        e.preventDefault();
                    }
                    if (e && e.stopPropagation) {
                        e.stopPropagation();
                    }
                    return false;
                });
            },
            shutdown = function () {
                canvas.removeEventListener('touchstart', touchStart);
                canvas.removeEventListener('touchmove', touchMove);
                canvas.removeEventListener('touchend', touchEnd);
                Event.off('glue.pointer.down', pointerDown);
                Event.off('glue.pointer.move', pointerMove);
                Event.off('glue.pointer.up', pointerUp);
                objects = [];
            },
            game = {
                SORT_TYPE_DEFAULT: 0,
                SORT_TYPE_STABLE: 1,
                setup: function (config, onReady) {
                    DomReady(function () {
                        if (isRunning) {
                            throw('Glue: The main game is already running');
                        }
                        isRunning = true;
                        win = window;
                        doc = win.document;
                        // config.canvas is mandatory
                        canvasId = config.canvas.id;
                        canvasDimension = config.canvas.dimension;
                        if (config.game) {
                            gameInfo = config.game;
                        }
                        if (config.develop && config.develop.debug) {
                            debug = true;
                            debugBar = document.createElement('div');
                            debugBar.id = 'debugBar';
                            document.body.appendChild(debugBar);
                        }
                        if (Sugar.isDefined(config.sort)) {
                            useSort = config.sort;
                        }
                        if (Sugar.isDefined(config.sortType)) {
                            sortType = config.sortType;
                        }
                        if (config.asset && config.asset.path) {
                            Loader.setAssetPath(config.asset.path);
                            if (config.asset.image) {
                                Loader.setAssets(Loader.ASSET_TYPE_IMAGE, config.asset.image);
                            }
                            if (config.asset.audio) {
                                if (config.asset.audio.sprite) {
                                    Loader.setAssets(Loader.ASSET_TYPE_AUDIOSPRITE, config.asset.audio.sprite);
                                }
                                Loader.setAssets(Loader.ASSET_TYPE_AUDIO, config.asset.audio);
                            }
                            if (config.asset.json) {
                                Loader.setAssets(Loader.ASSET_TYPE_JSON, config.asset.json);
                            }
                            if (config.asset.binary) {
                                Loader.setAssets(Loader.ASSET_TYPE_BINARY, config.asset.binary);
                            }
                            if (config.asset.spine) {
                                Loader.setAssets(Loader.ASSET_TYPE_SPINE, config.asset.spine);
                            }
                            Loader.load(function () {
                                startup();
                                if (onReady) {
                                    onReady();
                                }
                            });
                        } else {
                            startup();
                            if (onReady) {
                                onReady();
                            }
                        }
                    });
                },
                shutdown: function () {
                    shutdown();
                    isRunning = false;
                },
                add: function (object, callback) {
                    if (callback) {
                        addCallbacks.push({
                            object: object,
                            callback: callback
                        });
                    }
                    addedObjects.push(object);
                },
                remove: function (object, callback) {
                    if (callback) {
                        removeCallbacks.push({
                            object: object,
                            callback: callback
                        });
                    }
                    removedObjects.push(object);
                },
                get: function (componentName) {
                    var i,
                        l,
                        component,
                        name;

                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        name = component.getName();
                        if (!Sugar.isEmpty(name) && name === componentName) {
                            return component;
                        }
                    }
                },
                canvas: {
                    getDimension: function () {
                        return canvasDimension;
                    },
                    getScale: function () {
                        return canvasScale;
                    },
                    getContext: function () {
                        return backBufferContext2D;
                    }
                },
                getObjectCount: function () {
                    return objects.length;
                },
                getScroll: function () {
                    return scroll;
                },
                pause: function (force) {
                    isPaused = true;
                    isRunning = !force;
                },
                resume: function () {
                    isPaused = false;
                    if (!isRunning) {
                        isRunning = true;
                        startup();
                    }
                }
            };
        return game;
    }
);
/*
 *  @module Loader
 *  @desc Used to load assets in the beginning of the game, shows a progress bar
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/loader',
    [
        'glue'
    ],
    function (Glue) {
        var Audio = Glue.audio,
            Sugar = Glue.sugar,
            loaded = false,
            assetCount = 0,
            loadCount = 0,
            assetPath = null,
            assets = {},
            loadedAssets = {
                image: {},
                audio: {},
                json: {},
                binary: {}
            },
            completedHandler,
            loader = document.getElementById('loader'),
            loadBar = document.getElementById('loadbar'),
            percentageBar = document.getElementById('percentagebar'),
            percentageLoaded,
            assetLoadedHandler = function (e) {
                ++loadCount;
                //console.log('Loaded ' + loadCount + ' from ' + assetCount + ' assets');
                percentageLoaded = Math.floor((loadCount / assetCount) * 100);
                if (loadBar !== null) {
                    loadBar.style.width = percentageLoaded + '%';
                }
                if (percentageBar !== null) {
                    percentageBar.innerHTML = percentageLoaded + '%';
                }
                if (assetCount === loadCount) {
                    if (loader !== null) {
                        loader.style.display = 'none';
                    }
                    loaded = true;
                    completedHandler();
                }
            },
            assetErrorHandler = function (name) {
                throw 'An error occurred while trying to load asset ' + name;
            },
            loadImage = function (name, source, success, failure) {
                // TODO: Implement failure
                var asset = new Image();
                asset.src = source;
                asset.addEventListener('load', success, false);
                loadedAssets.image[name] = asset;
            },
            loadAudio = function (name, source, success, failure) {
                // TODO: Implement failure
                var asset = new Audio({
                    urls: [source],
                    onload: success
                });
                loadedAssets.audio[name] = asset;
            },            
            loadJSON = function (name, source, success, failure) {
                var xhr = new XMLHttpRequest();
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType('application/json');
                }
                xhr.open('GET', source, true);
                xhr.onerror = function () {
                    failure(name);
                };
                xhr.ontimeout = function () {
                    failure(name);
                };
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if ((xhr.status === 200) || ((xhr.status === 0) && xhr.responseText)) {
                            loadedAssets.json[name] = JSON.parse(xhr.responseText);
                            success();
                        } else {
                            failure(name);
                        }
                    }
                };
                xhr.send(null);
            },
            loadBinary = function (name, source, success, failure) {
                var xhr = new XMLHttpRequest(),
                    arrayBuffer,
                    byteArray,
                    buffer,
                    i = 0;

                xhr.open('GET', source, true);
                xhr.onerror = function () {
                    failure(name);
                };
                xhr.responseType = 'arraybuffer';
                xhr.onload = function (e) {
                    arrayBuffer = xhr.response;
                    if (arrayBuffer) {
                        byteArray = new Uint8Array(arrayBuffer);
                        buffer = [];
                        for (i; i < byteArray.byteLength; ++i) {
                            buffer[i] = String.fromCharCode(byteArray[i]);
                        }
                        loadedAssets.binary[name] = buffer.join('');
                        success();
                    }
                };
                xhr.send();
            },
            loadAudioSprite = function (name, source, success, failure) {
                var asset,
                    object,
                    onJSONLoaded = function () {
                        object = loadedAssets.json[name + '_json'];
                        object.onload = function () {
                            loadedAssets.audio[name] = asset;
                            success();
                        };
                        asset = new Audio(object);
                        success();
                    };

                loadJSON(name + '_json', assetPath + 'json/' + source, onJSONLoaded, failure);
            },
            loadSpine = function (name, source, success, failure) {
                var imageLoaded = false,
                    jsonLoaded = false,
                    atlasLoaded = false,
                    checkReady = function () {
                        if (imageLoaded && jsonLoaded && atlasLoaded)
                        success();
                    };
                loadImage(name, source + '.png', function () {
                    imageLoaded = true;
                    checkReady();
                }, failure);
                loadBinary(name, source + '.atlas', function () {
                    atlasLoaded = true;
                    checkReady();
                }, failure);
                loadJSON(name, source + '.json', function () {
                    jsonLoaded = true;
                    checkReady();
                }, failure);
            },
            loadAsset = function (name, type, source) {
                var asset;
                switch (type) {
                    case module.ASSET_TYPE_IMAGE:
                        loadImage(name, assetPath + 'image/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                    case module.ASSET_TYPE_AUDIO:
                        loadAudio(name, assetPath + 'audio/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                    case module.ASSET_TYPE_JSON:
                        loadJSON(name, assetPath + 'json/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                    case module.ASSET_TYPE_BINARY:
                        loadBinary(name, assetPath + 'binary/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                    case module.ASSET_TYPE_AUDIOSPRITE:
                        loadAudioSprite(name, source, assetLoadedHandler, assetErrorHandler);
                    break;
                    case module.ASSET_TYPE_SPINE:
                        loadSpine(name, assetPath + 'spine/' + source, assetLoadedHandler, assetErrorHandler);
                    break;
                }
            },
            module = {
                ASSET_TYPE_IMAGE: 'image',
                ASSET_TYPE_AUDIO: 'audio',
                ASSET_TYPE_JSON: 'json',
                ASSET_TYPE_BINARY: 'binary',
                ASSET_TYPE_AUDIOSPRITE: 'audiosprite',
                ASSET_TYPE_SPINE: 'spine',
                /**
                 * Sets the root folder for assets
                 * @name setAssetPath
                 * @memberOf loader
                 * @function
                 * @param {String} value: path to the root of the asset folder
                 */
                setAssetPath: function (value) {
                    assetPath = value;
                },
                /**
                 * Assign assets to load for the loader
                 * @name setAssets
                 * @memberOf loader
                 * @function
                 * @param {String} type: asset type name (enumerations available)
                 * @param {Object} value: object containing key/value pairs for assets (key: asset name, value: asset path)
                 */
                setAssets: function (type, value) {
                    assets[type] = value;
                    for (asset in value) {
                        if (value.hasOwnProperty(asset)) {
                            ++assetCount;
                        }
                    }
                },
                /**
                 * Load all the assets assigned by setAssets
                 * @name load
                 * @memberOf loader
                 * @function
                 * @param {Function} onReady: Callback function for completion
                 */
                load: function (onReady) {
                    var typeList;
                    if (percentageBar !== null) {
                        percentageBar.innerHTML = '0%';
                    }
                    completedHandler = onReady;
                    for (type in assets) {
                        if (assets.hasOwnProperty(type)) {
                            typeList = assets[type];
                            for (name in typeList) {
                                if (typeList.hasOwnProperty(name)) {
                                    loadAsset(name, type, typeList[name]);
                                }
                            }
                        }
                    }
                },
                /**
                 * Are the assets loaded
                 * @name isLoaded
                 * @memberOf loader
                 * @function
                 * @return Boolean whether asset loading is done or not 
                 */
                isLoaded: function () {
                    return loaded;
                },
                /**
                 * Gets all assets
                 * @name getAssets
                 * @memberOf loader
                 * @function
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return Object containing references to all assets 
                 */
                getAssets: function () {
                    if (!loaded) {
                        throw('Assets are not loaded yet');
                    }
                    return loadedAssets;
                },
                /**
                 * Gets the image asset
                 * @name getimage
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return Image object 
                 */
                getImage: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets.image[name];
                },
                /**
                 * Gets the audio asset
                 * @name getAudio
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return Audio object (depends on adapter set for audio) 
                 */
                getAudio: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets.audio[name];
                },
                /**
                 * Gets the json asset
                 * @name getJSON
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return JSON parsed object  
                 */
                getJSON: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets.json[name];
                },
                /**
                 * Gets the binary asset
                 * @name getBinary
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 * @return Binary object 
                 */
                getBinary: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets.binary[name];
                },
                /**
                 * Get the first asset with the provided name
                 * @name getAsset
                 * @memberOf loader
                 * @function
                 * @param {String} name: asset name
                 * @throws Throws an exception when assets haven't been loaded yet
                 */
                getAsset: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    if (Sugar.has(loadedAssets.image, name)) {
                        return loadedAssets.image[name];
                    } else if (Sugar.has(loadedAssets.audio, name)) {
                        return loadedAssets.audio[name];
                    } else if (Sugar.has(loadedAssets.json, name)) {
                        return loadedAssets.json[name];
                    } else if (Sugar.has(loadedAssets.binary, name)) {
                        return loadedAssets.binary[name];
                    }
                    throw('Asset ' + name + ' could not be found');
                }
            };

        return module;
    }
);

/**
 *  @module Math
 *  @desc The math module
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math',
    [
        'glue',
        'glue/math/rectangle',
        'glue/math/dimension',
        'glue/math/matrix',
        'glue/math/vector'
    ],
    function (Glue, Rectangle, Dimension, Matrix, Vector) {
        'use strict';
        return function () {
            var Sugar = Glue.sugar;
            return {
                Dimension: Dimension,
                Matrix: Matrix,
                Vector: Vector,
                random: function (min, max) {
                    return ~~(Math.random() * (max - min + 1)) + min;
                },
                square: function (x) {
                    return x * x;
                },
                sign: function (x) {
                    if (Sugar.isNumber(x)) {
                        if (x > 0) {
                            return 1;
                        } else if (x < 0) {
                            return -1;
                        } else if(x === 0) {
                            return 0;
                        }
                    }
                },
                getHalfRectangle: function (rectangle) {
                    var tempRect = Rectangle(
                            rectangle.x1 + (rectangle.x2 / 2),
                            rectangle.y1 + (rectangle.y2 / 2),
                            rectangle.x2 / 2,
                            rectangle.y2 / 2
                        );
                    return tempRect;
                }
            };
        };
    }
);

/*
 *  @module Circle
 *  @namespace math
 *  @desc Represents a Circle
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */

glue.module.create(
    'glue/math/circle',
    [
        'glue'
    ],
    function (Glue) {
        var Sugar = Glue.sugar,
            module = function (x, y, radius) {
            return {
                x: x || 0,
                y: y || 0,
                radius: radius || 0,
                addVector: function (vector) {
                    if (Sugar.isVector(vector)) {
                        this.x += vector.x;
                        this.y += vector.y;
                    } else {
                        throw 'The argument should be a Vector';
                    }
                },
                substractVector: function (vector) {
                    if (Sugar.isVector(vector)) {
                        this.x -= vector.x;
                        this.y -= vector.y;
                    } else {
                        throw 'The argument should be a Vector';
                    }
                },
                clone: function () {
                    return module(this.x, this.y, this.radius);
                }
            };
        };
        return module;
    }
);
/**
 *  @module Dimension
 *  @namespace math
 *  @desc Represents a dimension
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/dimension',
    function () {
        'use strict';
        return function (width, height, depth) {
            var dimension = {
                width: width,
                height: height,
                depth: depth || 0
            };
            return {
                width: dimension.width,
                height: dimension.height,
                depth: dimension.depth,
                get: function () {
                    return dimension;
                }
            };
        };
    }
);

/**
 *  @module Matrix
 *  @namespace math
 *  @desc Represents a matrix
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/matrix', [
        'glue'
    ],
    function (
        Glue
    ) {
        'use strict';
        var sugar = Glue.sugar;
        return function (x, y, initial) {
            var mat = [],
                a,
                col,
                row;

            for (col = 0; col < x; ++col) {
                a = [];
                for (row = 0; row < y; ++row) {
                    a[row] = initial || null;
                }
                mat[col] = a;
            }

            return {
                get: function () {
                    return mat;
                },
                getValue: function (col, row) {
                    if (mat[col] !== undefined && mat[col][row] !== undefined) {
                        return mat[col][row];
                    }
                },
                iterate: function (callback) {
                    for (col = 0; col < x; ++col) {
                        for (row = 0; row < y; ++row) {
                            if (!sugar.isFunction(callback)) {
                                throw('Please supply a callback function');
                            }
                            callback(col, row, mat[col][row]);
                        }
                    }
                },
                set: function (col, row, value) {
                    if (mat[col] !== undefined && mat[col][row] !== undefined) {
                        mat[col][row] = value;
                    }
                },
                unset: function (col, row) {
                    if (mat[col] !== undefined && mat[col][row] !== undefined) {
                        mat[col][row] = null;
                    }
                }
            };
        };
    }
);

/**
 *  @module Polygon
 *  @namespace math
 *  @desc Represents a polygon
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/polygon',
    function () {
        'use strict';
        return function (points) {
            return {
                get: function () {
                    return points;
                },
                hasPosition: function (p) {
                    var has = false,
                        minX = points[0].x, maxX = points[0].x,
                        minY = points[0].y, maxY = points[0].y,
                        n = 1,
                        q,
                        i = 0,
                        j = points.length - 1;

                    for (n = 1; n < points.length; ++n) {
                        q = points[n];
                        minX = Math.min(q.x, minX);
                        maxX = Math.max(q.x, maxX);
                        minY = Math.min(q.y, minY);
                        maxY = Math.max(q.y, maxY);
                    }
                    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
                        return false;
                    }
                    for (i, j; i < points.length; j = i++) {
                        if ((points[i].y > p.y) != (points[j].y > p.y) &&
                                p.x < (points[j].x - points[i].x) * (p.y - points[i].y) /
                                    (points[j].y - points[i].y) + points[i].x) {
                            has = !has;
                        }
                    }
                    return has;
                }
            };
        };
    }
);

/**
 *  @module Rectangle
 *  @namespace math
 *  @desc Represents a rectangle
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/rectangle',
    function () {
        'use strict';
        return function (x1, y1, x2, y2) {
            return {
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                get: function () {
                    return {
                        x1: this.x1,
                        y1: this.y1,
                        x2: this.x2,
                        y2: this.y2
                    };
                },
                hasPosition: function (position) {
                    if (position.x >= this.x1 && position.x <= this.x2 &&
                        position.y >= this.y1 && position.y <= this.y2) {
                        return true;
                    }
                },
                getWidth: function () {
                    return this.x2 - this.x1;
                },
                getHeight: function () {
                    return this.y2 - this.y1;
                },
                setWidth: function (width) {
                    this.x2 = this.x1 + width;
                },
                setHeight: function (height) {
                    this.y2 = this.y1 + height;
                },
                union: function (rectangle) {
                    this.x1 = Math.min(this.x1, rectangle.x1);
                    this.y1 = Math.min(this.y1, rectangle.y1);
                    this.x2 = Math.max(this.x2, rectangle.x2);
                    this.y2 = Math.max(this.y2, rectangle.y2);
                },
                intersect: function (rectangle) {
                    return this.x1 + this.x2 > rectangle.x1 &&
                           this.x1 < rectangle.x1 + rectangle.x2 &&
                           this.y1 + this.y2 > rectangle.y1 &&
                           this.y1 < rectangle.y1 + rectangle.y2;
                },
                intersection: function (rectangle) {
                    var inter = {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0
                    };
                    if (this.intersect(rectangle)) {
                        inter.x1 = Math.max(this.x1, rectangle.x1);
                        inter.y1 = Math.max(this.y1, rectangle.y1);
                        inter.x2 = Math.min(this.x1 + this.x2, rectangle.x1 + rectangle.x2) - inter.x1;
                        inter.y2 = Math.min(this.y1 + this.y2, rectangle.y1 + rectangle.y2) - inter.y1;
                    }
                    return inter;
                }
            };
        };
    }
);

/**
 *  @module Vector
 *  @namespace math
 *  @desc Represents a vector
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/vector',
    [
        'glue/math'
    ],
    function (Mathematics) {
    'use strict';
    var module =function (x, y, z) {
        var math = Mathematics();

        return {
            x: x,
            y: y,
            z: z || 0,
            get: function () {
                return {
                    x: this.x,
                    y: this.y,
                    z: this.z
                }
            },
            add: function (vector) {
                this.x += vector.x;
                this.y += vector.y;
                return this;
            },
            substract: function (vector) {
                this.x -= vector.x;
                this.y -= vector.y;
                return this;
            },
            angle: function (vector) {
                return Math.atan2(
                    (vector.y - this.y),
                    (vector.x - this.x)
                );
            },
            dotProduct: function (vector) {
                return this.x * vector.x + this.y * vector.y;
            },        
            distance : function (vector) {
                return Math.sqrt(
                    (this.x - vector.x) * (this.x - vector.x) +
                    (this.y - vector.y) * (this.y - vector.y)
                );
            },
            multiply: function (vector) {
                this.x *= vector.x;
                this.y *= vector.y;
                return this;
            },
            scale: function (value) {
                this.x *= value;
                this.y *= value;
                return this;
            },
            length: function () {
                return Math.sqrt(math.square(this.x) + math.square(this.y));
            },
            normalize: function (value) {
                this.x /= value > 0 ? value : 1;
                this.y /= value > 0 ? value : 1;
                return this;
            },
            copy: function (vector) {
                this.x = vector.x;
                this.y = vector.y;
                return this;
            },
            clone: function () {
                return module(this.x, this.y);
            },
            static: {
                add: function (vector1, vector2) {
                    var vector = vector1.clone();
                    vector.add(vector2);
                    return vector;
                },
                substract: function (vector1, vector2) {
                    var vector = vector1.clone();
                    vector.substract(vector2);
                    return vector;
                },
                angle: function (vector1, vector2) {
                    return vector1.angle(vector2);
                },
                dotProduct: function (vector1, vector2) {
                    return vector1.dotProduct(vector2);
                },
                distance: function (vector1, vector2) {
                    return vector1.distance(vector2);
                },
                multiply: function (vector1, vector2) {
                    var vector = vector1.clone();
                    vector.multiply(vector2);
                    return vector;
                },
                scale: function (vector1, value) {
                    var vector = vector1.clone();
                    vector.scale(value);
                    return vector;
                },
                length: function (vector1) {
                    var vector = vector1.clone();
                    return vector.length();
                },
                normalize: function (vector1, value) {
                    var vector = vector1.clone();
                    vector.normalize(value);
                    return vector;
                },
                copy: function (vector1, vector2) {
                    var vector = vector1.clone();
                    vector.copy(vector2);
                    return vector;
                },
                clone: function (vector1) {
                    return vector1.clone();
                }
            }
        };
    };
    return module;
});

/**
 *  @module SAT (Separating Axis Theorem)
 *  @desc Handles the collision between two rectangles.
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/sat',
    [
        'glue',
        'glue/math',
        'glue/math/vector',
        'glue/math/rectangle',
        'glue/math/dimension',
        'glue/game'
    ],
    function (Glue, Mathematics, Vector, Rectangle, Dimension, Game) {
        'use strict';
        var Sugar = Glue.sugar,
            math = Mathematics(),
            circleCollision = function (circle1, circle2, correction, unit) {
                var distance;
                correction.copy(circle1);
                correction.substract(circle2);
                distance = correction.length();
                if (distance > circle1.radius + circle2.radius) {
                    correction.x = correction.y = 0;
                    return false;
                }
                correction.normalize(distance);
                unit.copy(correction);
                correction.scale((circle1.radius + circle2.radius) - distance);
                return true;
            },
            rectCollision = function (rect1, rect2, correction, side, rect) {
                if (rect1.intersect(rect2)) {
                    var inter = rect1.intersection(rect2),
                        direction = Vector(0, 0);
                    if (inter.x2 > inter.y2) {
                        direction.y = math.sign(rect1.y1 - rect2.y1);
                        correction.y += inter.y2 * direction.y;
                        side.y = direction.y;
                    } else {
                        direction.x = math.sign(rect1.x1 - rect2.x1)
                        correction.x += inter.x2 * direction.x;
                        side.x = direction.x;
                    }
                    rect.x1 = inter.x1;
                    rect.y1 = inter.y1;
                    rect.x2 = inter.x2;
                    rect.y2 = inter.y2;
                    return true;
                }
                return false;
            },
            overlapRect = function (rect1, rect2) {
                return rect1.intersect(rect2);
            },
            overlapCircle = function (circle1, circle2) {
                var distance = Math.sqrt(math.square(circle1.x - circle2.x) + math.square(circle1.y - circle2.y));
                return distance < circle1.radius + circle2.radius;
            },
            reflectCircle = function (obj, unit) {
                var velocity = obj.kineticable.getVelocity(),
                    bounce = obj.kineticable.getBounce(),
                    unitScale = unit.scale(velocity.dotProduct(unit)),
                    dist = velocity.static.substract(velocity, unitScale),
                    after = dist.substract(unitScale),
                    reflection = after.substract(velocity).scale(bounce);
                 velocity.add(reflection);                           
                 obj.kineticable.setVelocity(velocity);
            },
            solveCircleToCircle = function (obj1, obj2) {
                var circle1 = obj1.kineticable.toCircle(),
                    circle2 = obj2.kineticable.toCircle(),
                    correction1 = Vector(0, 0),
                    correction2 = Vector(0, 0),
                    unit1 = Vector(0, 0),
                    unit2 = Vector(0, 0),
                    position1,
                    position2;
                if (circleCollision(circle1, circle2, correction2, unit2)) {
                    if (obj2.kineticable.isDynamic()) {
                        position2 = obj2.kineticable.getPosition();
                        position2.substract(correction2);
                        reflectCircle(obj2, unit2);
                    }
                    
                    if (obj1.kineticable.isDynamic()) {
                        circleCollision(circle2, circle1, correction1, unit1);
                        position1 = obj1.kineticable.getPosition();
                        position1.substract(correction1);
                        reflectCircle(obj1, unit1);
                    }
                    return true;
                }
                return false;
            },
            solveRectangeToRectangle = function (obj1, obj2) {
                var bound1 = obj1.kineticable.toRectangle(),
                    bound2 = obj2.kineticable.toRectangle(),
                    correction1 = Vector(0, 0),
                    correction2 = Vector(0, 0),
                    side1 = Vector(0, 0),
                    side2 = Vector(0, 0),
                    velocity1,
                    velocity2,
                    position1,
                    position2,
                    intersection = Rectangle(0, 0, 0, 0);
                if (rectCollision(bound1, bound2, correction2, side2, intersection)) {
                    if (obj2.kineticable.isDynamic()) {
                        velocity2 = obj2.kineticable.getVelocity();
                        position2 = obj2.kineticable.getPosition();
                        position2.substract(correction2);
                        side2.scale(-1);
                        obj2.kineticable.setPosition(position2);
                        obj2.kineticable.setSide(side2);
                        if (side2.y !== 0) {
                            if ((side2.y > 0 && velocity2.y < 0) || (side2.y < 0 && velocity2.y > 0 && intersection.y2 > 1)) {
                                velocity2.y *= -obj2.kineticable.getBounce();
                            }
                        } else if (side2.x !== 0) {
                            if ((side2.x > 0 && velocity2.x < 0) || (side2.x < 0 && velocity2.x > 0 && intersection.x2 > 1)) {
                                velocity2.x *= -obj2.kineticable.getBounce();
                            }
                        }
                    }

                    if (obj1.kineticable.isDynamic()) {
                        velocity1 = obj1.kineticable.getVelocity();
                        position1 = obj1.kineticable.getPosition();
                        rectCollision(bound2, bound1, correction1, side1, intersection);
                        position1.substract(correction1);
                        side1.scale(-1);
                        obj1.kineticable.setPosition(position1);
                        obj1.kineticable.setSide(side1);
                        if (side1.y !== 0) {
                            if ((side1.y > 0 && velocity1.y < 0) || (side1.y < 0 && velocity1.y > 0)) {
                                velocity1.y *= -obj1.kineticable.getBounce();
                            }
                        } else if (side1.x !== 0) {
                            if ((side1.x > 0 && velocity1.x < 0) || (side1.x < 0 && velocity1.x > 0)) {
                                velocity1.x *= -obj1.kineticable.getBounce();
                            }
                        }
                    }
                    return true;
                }
                return false;
            },
            module = {
                TOP: 0,
                BOTTOM: 1,
                LEFT: 2,
                RIGHT: 3,
                RECTANGLE_TO_RECTANGLE: 10,
                CIRCLE_TO_CIRCLE: 20,
                collideGroupVsGroup: function (group1, group2, type) {
                    var i,
                        len;
                    if (Sugar.isArray(group1) && Sugar.isArray(group2)) {
                        for (i = 0, len = group1.length; i < len; ++i) {
                            module.collideGroup(group1[i], group2, type);
                        }
                    } else {
                        throw 'The colliding groups must be Arrays.';
                    }
                },
                collideGroup: function (obj, group, type) {
                    var i,
                        len;
                    if (Sugar.isArray(group)) {
                        if (Sugar.isDefined(obj.kineticable)) {
                            for (i = 0, len = group.length; i < len; ++i) {
                                if (group.indexOf(obj) !== i) {
                                    module.collide(obj, group[i], type);
                                }
                            }
                        } else {
                            throw 'Collisions can only be tested between Kineticable.';
                        }
                    } else {
                        throw 'The colliding group must be an Array.';
                    }
                },
                collide: function (obj1, obj2, type) {
                    if (Sugar.isDefined(obj1.kineticable) && Sugar.isDefined(obj2.kineticable)) {
                        type = type || module.RECTANGLE_TO_RECTANGLE;
                        switch (type) {
                            case module.RECTANGLE_TO_RECTANGLE:
                                return solveRectangeToRectangle(obj1, obj2);
                                break;
                            case module.CIRCLE_TO_CIRCLE:
                                return solveCircleToCircle(obj1, obj2);
                                break;
                            default:
                                throw 'The type of collision is not valid.';
                                break;
                        }
                        return false;
                    } else {
                        throw 'Collisions can only be tested between Kineticable.';
                    }
                },
                overlap: function (obj1, obj2, type) {
                    if (Sugar.isDefined(obj1.kineticable) && Sugar.isDefined(obj2.kineticable)) {
                        type = type || module.RECTANGLE_TO_RECTANGLE;
                        switch (type) {
                            case module.RECTANGLE_TO_RECTANGLE:
                                return overlapRect(obj1, obj2);
                                break;
                            case module.CIRCLE_TO_CIRCLE:
                                return overlapCircle(obj1, obj2);
                                break;
                            default:
                                return overlapRect(obj1, obj2);
                                break;
                        }
                        return false;
                    } else {
                        throw 'Collisions can only be tested between Kineticable.';
                    }
                },
                overlapGroupVsGroup: function (group1, group2, type) {
                    var i,
                        len;
                    if (Sugar.isArray(group1) && Sugar.isArray(group2)) {
                        for (i = 0, len = group1.length; i < len; ++i) {
                            module.overlapGroup(group1[i], group2, type);
                        }
                    } else {
                        throw 'The colliding groups must be Arrays.';
                    }
                },
                overlapGroup: function (obj, group, type) {
                    var i,
                        len;
                    if (Sugar.isArray(group)) {
                        if (Sugar.isDefined(obj.kineticable)) {
                            for (i = 0, len = group.length; i < len; ++i) {
                                if (group.indexOf(obj) !== i) {
                                    module.overlap(obj, group[i], type);
                                }
                            }
                        } else {
                            throw 'Collisions can only be tested between Kineticable.';
                        }
                    } else {
                        throw 'The colliding group must be an Array.';
                    }
                },
                update: function (deltaT, scroll) {

                }
            };
        return module;
    }
);
/**
 *  @module Screen
 *  @desc Directs a game screen
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/screen',
    [
        'glue',
        'glue/game'
    ],
    function (Glue, Game) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (name) {
            var objects = [],
                isShown = false,
                module = {
                    /**
                     * Add object to screen
                     * @name addObject
                     * @memberOf screen
                     * @function
                     */
                    addObject: function (object, callback) {
                        if (Sugar.isObject(object)) {
                            objects.push(object);
                            if (isShown) {
                                Game.add(object, function () {
                                    if (Sugar.isFunction(callback)) {
                                        callback();
                                    }
                                });
                            }
                        }
                    },
                    /**
                     * Removes object from screen
                     * @name removeObject
                     * @memberOf screen
                     * @function
                     */
                    removeObject: function (object, callback) {
                        var index;
                        if (Sugar.isObject(object)) {
                            index = objects.indexOf(object);
                            if (index >= 0) {
                                objects.splice(index, 1);
                                if (isShown) {
                                    Game.remove(object, function () {
                                        if (Sugar.isFunction(callback)) {
                                            callback();
                                        }
                                    });
                                }
                            }
                        }
                    },
                    /**
                     * Gets the object array
                     * @name getObjects
                     * @memberOf screen
                     * @function
                     * @return Array of added objects
                     */
                    getObjects: function () {
                        return objects;
                    },
                    /**
                     * Get the name of the screen
                     * @name getName
                     * @memberOf screen
                     * @function
                     * @return Screen name as string
                     */
                    getName: function () {
                        return name;
                    },
                    /**
                     * Set a boolean that defines if the screen is shown
                     * @name setShown
                     * @memberOf screen
                     * @function
                     */
                    setShown: function (bool) {
                        if (!Sugar.isBoolean(bool)) {
                            throw 'Argument is not a boolean';
                        } else {
                            isShown = bool;
                        }
                    }
                };

            return module;
        };
    }
);

/**
 *  @module Spatial
 *  @desc Checks if collision is needed using a spatial matrix
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/spatial',
    [
        'glue',
        'glue/game',
        'glue/math',
        'glue/math/vector',
        'glue/math/dimension'
    ],
    function (
        Glue,
        Game,
        Mathematics,
        Vector,
        Dimension
    ) {
        'use strict';
        return function () {
            var Sugar = Glue.sugar,
                math = Mathematics(),
                debug = false,
                gridDimension,
                gridSize,
                spatialGrid,
                addCell = function (position, cells) {
                    var gridPosition = parseInt(
                           (Math.floor(position.x / gridSize)) +
                           (Math.floor(position.y / gridSize)) *
                           (gridDimension.width / gridSize) 
                        );

                    if (!Sugar.contains(cells, gridPosition)) {
                        cells.push(gridPosition);
                    }
                },
                getObjectCells = function (object) {
                    var cells = [],
                        position = object.spritable.getPosition(),
                        dimension = object.spritable.getDimension(),
                        min = Vector(
                            position.x,
                            position.y
                        ),
                        max = Vector(
                            position.x + dimension.width,
                            position.y + dimension.height
                        );

                    // top left
                    addCell(Vector(min.x, min.y), cells);
                    // top right
                    addCell(Vector(max.x, min.y), cells);
                    // bottom right
                    addCell(Vector(max.x, max.y), cells);
                    // bottom left
                    addCell(Vector(min.x, max.y), cells);

                    return cells;
                },
                resetGrid = function () {
                    var gridCount,
                        i = 0;

                    spatialGrid = {};
                    gridCount = 
                        (gridDimension.width / gridSize) * 
                        (gridDimension.height / gridSize);
                    for (i; i < gridCount; ++i) {
                        spatialGrid[i] = [];
                    }
                },
                module = {
                    setup: function (config) {
                        config = config || {};
                        if (Sugar.isDefined(config.gridDimension)) {
                            gridDimension = config.gridDimension;
                        } else {
                            gridDimension = Game.canvas.getDimension();
                        }
                        if (Sugar.isDefined(config.gridSize)) {
                            gridSize = config.gridSize;
                        } else {
                            gridSize = gridDimension.height / 3;
                        }
                        resetGrid();
                    },
                    setDebug: function (value) {
                        if (value === true) {
                            Game.add(module);
                        }
                        if (value === false) {
                            Game.remove(module);
                        }
                    },
                    clearObjects: function () {
                        resetGrid();
                    },
                    addObject: function (object) {
                        var inCells = getObjectCells(object),
                            i = 0,
                            l = inCells.length;
                        for (i; i < l; ++i) {
                            spatialGrid[inCells[i]].push(object);
                        }
                    },
                    addArray: function (array) {
                        var i,
                            len;
                        for (i = 0, len = array.length; i < len; ++i) {
                            module.addObject(array[i]);
                        }
                    },
                    getNearbyObjects: function (object) {
                        var nearby = [],
                            inCells = getObjectCells(object),
                            i = 0,
                            l = inCells.length;

                        for (i; i < l; ++i) {
                            nearby.push(spatialGrid[inCells[i]]);
                        }
                        return nearby;
                    },
                    handleNearbyObjects: function (obj, func) {
                        var list,
                            i,
                            len,
                            j,
                            jlen;
                        if (Sugar.isFunction(func)) {
                            list = module.getNearbyObjects(obj);
                            for (i = 0, len = list.length; i < len; ++i) {
                                if (list[i]) {
                                    for (j = 0, jlen = list[i].length; j < jlen; ++j) {
                                        if (list[i].indexOf(obj) !== j) {
                                            func(list[i][j]);
                                        }
                                    }
                                }
                            }
                        }
                    },
                    draw: function (deltaT, context) {
                        var x = 0,
                            y = 0;

                        context.save();
                        context.beginPath();
                        for (x; x <= gridDimension.width; x += gridSize) {
                            context.moveTo(x, 0);
                            context.lineTo(x, gridDimension.height);
                        }
                        for (y; y <= gridDimension.height; y += gridSize) {
                            context.moveTo(0, y);
                            context.lineTo(gridDimension.width, y);
                        }
                        context.strokeStyle = 'black';
                        context.stroke();
                        context.closePath();
                        context.restore();
                    }
                };

            return module;
        }
    }
);

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
                has(obj, 'getValue') && isFunction(obj.getValue) &&
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
        },
        stable = (function() {
            // https://github.com/Two-Screen/stable
            // A stable array sort, because `Array#sort()` is not guaranteed stable.
            // This is an implementation of merge sort, without recursion.
            var stable = function(arr, comp) {
                    return exec(arr.slice(), comp);
                },
                // Execute the sort using the input array and a second buffer as work space.
                // Returns one of those two, containing the final result.
                exec = function (arr, comp) {
                    if (typeof(comp) !== 'function') {
                        comp = function(a, b) {
                            return String(a).localeCompare(b);
                        };
                    }

                    // Short-circuit when there's nothing to sort.
                    var len = arr.length;
                    if (len <= 1) {
                        return arr;
                    }

                    // Rather than dividing input, simply iterate chunks of 1, 2, 4, 8, etc.
                    // Chunks are the size of the left or right hand in merge sort.
                    // Stop when the left-hand covers all of the array.
                    var buffer = new Array(len);
                    for (var chk = 1; chk < len; chk *= 2) {
                        pass(arr, comp, chk, buffer);

                        var tmp = arr;
                        arr = buffer;
                        buffer = tmp;
                    }
                    return arr;
                },
                // Run a single pass with the given chunk size.
                pass = function(arr, comp, chk, result) {
                    var len = arr.length;
                    var i = 0;
                    // Step size / double chunk size.
                    var dbl = chk * 2;
                    // Bounds of the left and right chunks.
                    var l, r, e;
                    // Iterators over the left and right chunk.
                    var li, ri;

                    // Iterate over pairs of chunks.
                    for (l = 0; l < len; l += dbl) {
                        r = l + chk;
                        e = r + chk;
                        if (r > len) r = len;
                        if (e > len) e = len;

                        // Iterate both chunks in parallel.
                        li = l;
                        ri = r;
                        while (true) {
                            // Compare the chunks.
                            if (li < r && ri < e) {
                                // This works for a regular `sort()` compatible comparator,
                                // but also for a simple comparator like: `a > b`
                                if (comp(arr[li], arr[ri]) <= 0) {
                                    result[i++] = arr[li++];
                                }
                                else {
                                    result[i++] = arr[ri++];
                                }
                            }
                            // Nothing to compare, just flush what's left.
                            else if (li < r) {
                                result[i++] = arr[li++];
                            }
                            else if (ri < e) {
                                result[i++] = arr[ri++];
                            }
                            // Both iterators are at the chunk ends.
                            else {
                                break;
                            }
                        }
                    }
                };
            stable.inplace = function(arr, comp) {
                var result = exec(arr, comp);

                // This simply copies back if the result isn't in the original array,
                // which happens on an odd number of passes.
                if (result !== arr) {
                    pass(result, null, arr.length, arr);
                }

                return arr;
            };
            // return it instead and keep the method local to this scope
            return stable;
        })();

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
        arrayMatch: arrayMatch,
        sort: {
            stable: stable
        }
    };
}(window, window.document));

/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


glue.module.create('glue/domready', function () {
    'use strict';

    var isTop, testDiv, scrollIntervalId,
        isBrowser = typeof window !== "undefined" && window.document,
        isPageLoaded = !isBrowser,
        doc = isBrowser ? document : null,
        readyCalls = [];

    function runCallbacks(callbacks) {
        var i;
        for (i = 0; i < callbacks.length; i += 1) {
            callbacks[i](doc);
        }
    }

    function callReady() {
        var callbacks = readyCalls;

        if (isPageLoaded) {
            //Call the DOM ready callbacks
            if (callbacks.length) {
                readyCalls = [];
                runCallbacks(callbacks);
            }
        }
    }

    /**
     * Sets the page as loaded.
     */
    function pageLoaded() {
        if (!isPageLoaded) {
            isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            callReady();
        }
    }

    if (isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", pageLoaded, false);
            window.addEventListener("load", pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", pageLoaded);

            testDiv = document.createElement('div');
            try {
                isTop = window.frameElement === null;
            } catch (e) {}

            //DOMContentLoaded approximation that uses a doScroll, as found by
            //Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
            //but modified by other contributors, including jdalton
            if (testDiv.doScroll && isTop && window.external) {
                scrollIntervalId = setInterval(function () {
                    try {
                        testDiv.doScroll();
                        pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. Latest webkit browsers also use "interactive", and
        //will fire the onDOMContentLoaded before "interactive" but not after
        //entering "interactive" or "complete". More details:
        //http://dev.w3.org/html5/spec/the-end.html#the-end
        //http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
        //Hmm, this is more complicated on further use, see "firing too early"
        //bug: https://github.com/requirejs/domReady/issues/1
        //so removing the || document.readyState === "interactive" test.
        //There is still a window.onload binding that should get fired if
        //DOMContentLoaded is missed.
        if (document.readyState === "complete") {
            pageLoaded();
        }
    }

    /** START OF PUBLIC API **/

    /**
     * Registers a callback for DOM ready. If DOM is already ready, the
     * callback is called immediately.
     * @param {Function} callback
     */
    function domReady(callback) {
        if (isPageLoaded) {
            callback(doc);
        } else {
            readyCalls.push(callback);
        }
        return domReady;
    }

    domReady.version = '2.0.1';

    /**
     * Loader Plugin API method
     */
    domReady.load = function (name, req, onLoad, config) {
        if (config.isBuild) {
            onLoad(null);
        } else {
            domReady(onLoad);
        }
    };

    /** END OF PUBLIC API **/

    return domReady;
});
