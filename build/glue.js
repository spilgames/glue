/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.1.9 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.1.9',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        ap = Array.prototype,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value !== 'string') {
                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    function defaultOnError(err) {
        throw err;
    }

    //Allow getting a global that expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite and existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                pkgs: {},
                shim: {},
                config: {}
            },
            registry = {},
            //registry of just enabled modules, to speed
            //cycle breaking code when lots of modules
            //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; ary[i]; i += 1) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                        //End of the line. Keep at least one non-dot
                        //path segment at the front so it can be mapped
                        //correctly to disk. Otherwise, there is likely
                        //no path mapping for a path starting with '..'.
                        //This can still fail, but catches the most reasonable
                        //uses of ..
                        break;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgName, pkgConfig, mapValue, nameParts, i, j, nameSegment,
                foundMap, foundI, foundStarMap, starI,
                baseParts = baseName && baseName.split('/'),
                normalizedBaseParts = baseParts,
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name && name.charAt(0) === '.') {
                //If have a base name, try to normalize against it,
                //otherwise, assume it is a top-level require that will
                //be relative to baseUrl in the end.
                if (baseName) {
                    if (getOwn(config.pkgs, baseName)) {
                        //If the baseName is a package name, then just treat it as one
                        //name to concat the name with.
                        normalizedBaseParts = baseParts = [baseName];
                    } else {
                        //Convert baseName to array, and lop off the last part,
                        //so that . matches that 'directory' and not name of the baseName's
                        //module. For instance, baseName of 'one/two/three', maps to
                        //'one/two/three.js', but we want the directory, 'one/two' for
                        //this normalization.
                        normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    }

                    name = normalizedBaseParts.concat(name.split('/'));
                    trimDots(name);

                    //Some use of packages may use a . path to reference the
                    //'main' module name, so normalize for that.
                    pkgConfig = getOwn(config.pkgs, (pkgName = name[0]));
                    name = name.join('/');
                    if (pkgConfig && name === pkgName + '/' + pkgConfig.main) {
                        name = pkgName;
                    }
                } else if (name.indexOf('./') === 0) {
                    // No baseName, so this is ID is resolved relative
                    // to baseUrl, pull off the leading dot.
                    name = name.substring(2);
                }
            }

            //Apply map config if available.
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');

                for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break;
                                }
                            }
                        }
                    }

                    if (foundMap) {
                        break;
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            return name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);
                context.require([id]);
                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        normalizedName = normalize(name, parentName, applyMap);
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                    fn(mod.error);
                } else {
                    mod.on(name, fn);
                }
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                //Array splice in the values since the context code has a
                //local var ref to defQueue, so cannot just reassign the one
                //on context.
                apsp.apply(defQueue,
                           [defQueue.length - 1, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return mod.exports;
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function () {
                            var c,
                                pkg = getOwn(config.pkgs, mod.map.id);
                            // For packages, only support config targeted
                            // at the main module.
                            c = pkg ? getOwn(config.config, mod.map.id + '/' + pkg.main) :
                                      getOwn(config.config, mod.map.id);
                            return  c || {};
                        },
                        exports: defined[mod.map.id]
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var map, modId, err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function (mod) {
                map = mod.map;
                modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check: function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    this.fetch();
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error. However,
                            //only do it for define()'d  modules. require
                            //errbacks should not be called for failures in
                            //their callbacks (#699). However if a global
                            //onError is set, use that.
                            if ((this.events.error && this.map.isDefine) ||
                                req.onError !== defaultOnError) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            if (this.map.isDefine) {
                                //If setting exports via 'module' is in play,
                                //favor that over return value and exports. After that,
                                //favor a non-undefined return value over exports use.
                                cjsModule = this.module;
                                if (cjsModule &&
                                        cjsModule.exports !== undefined &&
                                        //Make sure it is not already the exports value
                                        cjsModule.exports !== this.exports) {
                                    exports = cjsModule.exports;
                                } else if (exports === undefined && this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                err.requireType = this.map.isDefine ? 'define' : 'require';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                    //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                      this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                             'fromText eval for ' + id +
                                            ' failed: ' + e,
                                             e,
                                             [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', bind(this, this.errback));
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
        }

        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,
            onError: onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                //Save off the paths and packages since they require special processing,
                //they are additive.
                var pkgs = config.pkgs,
                    shim = config.shim,
                    objs = {
                        paths: true,
                        config: true,
                        map: true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (prop === 'map') {
                            if (!config.map) {
                                config.map = {};
                            }
                            mixin(config[prop], value, true, true);
                        } else {
                            mixin(config[prop], value, true);
                        }
                    } else {
                        config[prop] = value;
                    }
                });

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location;

                        pkgObj = typeof pkgObj === 'string' ? { name: pkgObj } : pkgObj;
                        location = pkgObj.location;

                        //Create a brand new object on pkgs, since currentPackages can
                        //be passed in again, and config.pkgs is the internal transformed
                        //state for all package configs.
                        pkgs[pkgObj.name] = {
                            name: pkgObj.name,
                            location: location || pkgObj.name,
                            //Remove leading dot in main, so main paths are normalized,
                            //and remove any trailing .js, since different package
                            //envs have different conventions: some use a module name,
                            //some use a file name.
                            main: (pkgObj.main || 'main')
                                  .replace(currDirRegExp, '')
                                  .replace(jsSuffixRegExp, '')
                        };
                    });

                    //Done with modifications, assing packages back to context config
                    config.pkgs = pkgs;
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            makeRequire: function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                        id +
                                        '" has not been loaded yet for context: ' +
                                        contextName +
                                        (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl: function (moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                                                relMap && relMap.id, true), ext,  true);
                    },

                    defined: function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overriden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext, skipExt) {
                var paths, pkgs, pkg, pkgPath, syms, i, parentModule, url,
                    parentPath;

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;
                    pkgs = config.pkgs;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');
                        pkg = getOwn(pkgs, parentModule);
                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        } else if (pkg) {
                            //If module name is just the package name, then looking
                            //for the main module.
                            if (moduleName === pkg.name) {
                                pkgPath = pkg.location + '/' + pkg.main;
                            } else {
                                pkgPath = pkg.location;
                            }
                            syms.splice(0, i, pkgPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/^data\:|\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                                        ((url.indexOf('?') === -1 ? '?' : '&') +
                                         config.urlArgs) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError('scripterror', 'Script error for: ' + data.id, evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = defaultOnError;

    /**
     * Creates the node for the load command. Only used in browser envs.
     */
    req.createNode = function (config, moduleName, url) {
        var node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
        node.type = config.scriptType || 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        return node;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = req.createNode(config, moduleName, url);

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/jrburke/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/jrburke/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation that a build has been done so that
                //only one script needs to be loaded anyway. This may need to be
                //reevaluated if other use cases become common.
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                context.onError(makeError('importscripts',
                                'importScripts failed for ' +
                                    moduleName + ' at ' + url,
                                e,
                                [moduleName]));
            }
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser && !cfg.skipDataMain) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Preserve dataMain in case it is a path (i.e. contains '?')
                mainScript = dataMain;

                //Set final baseUrl if there is not already an explicit one.
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = mainScript.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                }

                //Strip off any trailing .js since mainScript is now
                //like a module name.
                mainScript = mainScript.replace(jsSuffixRegExp, '');

                 //If mainScript is still a path, fall back to dataMain
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain;
                }

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = null;
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps && isFunction(callback)) {
            deps = [];
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, '')
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
    };

    define.amd = {
        jQuery: true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));

/******************************************************************************
 * Spine Runtime Software License - Version 1.1
 * 
 * Copyright (c) 2013, Esoteric Software
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms in whole or in part, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 * 
 * 1. A Spine Essential, Professional, Enterprise, or Education License must
 *    be purchased from Esoteric Software and the license must remain valid:
 *    http://esotericsoftware.com/
 * 2. Redistributions of source code must retain this license, which is the
 *    above copyright notice, this declaration of conditions and the following
 *    disclaimer.
 * 3. Redistributions in binary form must reproduce this license, which is the
 *    above copyright notice, this declaration of conditions and the following
 *    disclaimer, in the documentation and/or other materials provided with the
 *    distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

var spine = {};

spine.BoneData = function (name, parent) {
	this.name = name;
	this.parent = parent;
};
spine.BoneData.prototype = {
	length: 0,
	x: 0, y: 0,
	rotation: 0,
	scaleX: 1, scaleY: 1,
	inheritScale: true,
	inheritRotation: true
};

spine.SlotData = function (name, boneData) {
	this.name = name;
	this.boneData = boneData;
};
spine.SlotData.prototype = {
	r: 1, g: 1, b: 1, a: 1,
	attachmentName: null,
	additiveBlending: false
};

spine.Bone = function (boneData, parent) {
	this.data = boneData;
	this.parent = parent;
	this.setToSetupPose();
};
spine.Bone.yDown = false;
spine.Bone.prototype = {
	x: 0, y: 0,
	rotation: 0,
	scaleX: 1, scaleY: 1,
	m00: 0, m01: 0, worldX: 0, // a b x
	m10: 0, m11: 0, worldY: 0, // c d y
	worldRotation: 0,
	worldScaleX: 1, worldScaleY: 1,
	updateWorldTransform: function (flipX, flipY) {
		var parent = this.parent;
		if (parent != null) {
			this.worldX = this.x * parent.m00 + this.y * parent.m01 + parent.worldX;
			this.worldY = this.x * parent.m10 + this.y * parent.m11 + parent.worldY;
			if (this.data.inheritScale) {
				this.worldScaleX = parent.worldScaleX * this.scaleX;
				this.worldScaleY = parent.worldScaleY * this.scaleY;
			} else {
				this.worldScaleX = this.scaleX;
				this.worldScaleY = this.scaleY;
			}
			this.worldRotation = this.data.inheritRotation ? parent.worldRotation + this.rotation : this.rotation;
		} else {
			this.worldX = this.x;
			this.worldY = this.y;
			this.worldScaleX = this.scaleX;
			this.worldScaleY = this.scaleY;
			this.worldRotation = this.rotation;
		}
		var radians = this.worldRotation * Math.PI / 180;
		var cos = Math.cos(radians);
		var sin = Math.sin(radians);
		this.m00 = cos * this.worldScaleX;
		this.m10 = sin * this.worldScaleX;
		this.m01 = -sin * this.worldScaleY;
		this.m11 = cos * this.worldScaleY;
		if (flipX) {
			this.m00 = -this.m00;
			this.m01 = -this.m01;
		}
		if (flipY != spine.Bone.yDown) {
			this.m10 = -this.m10;
			this.m11 = -this.m11;
		}
	},
	setToSetupPose: function () {
		var data = this.data;
		this.x = data.x;
		this.y = data.y;
		this.rotation = data.rotation;
		this.scaleX = data.scaleX;
		this.scaleY = data.scaleY;
	}
};

spine.Slot = function (slotData, skeleton, bone) {
	this.data = slotData;
	this.skeleton = skeleton;
	this.bone = bone;
	this.setToSetupPose();
};
spine.Slot.prototype = {
	r: 1, g: 1, b: 1, a: 1,
	_attachmentTime: 0,
	attachment: null,
	setAttachment: function (attachment) {
		this.attachment = attachment;
		this._attachmentTime = this.skeleton.time;
	},
	setAttachmentTime: function (time) {
		this._attachmentTime = this.skeleton.time - time;
	},
	getAttachmentTime: function () {
		return this.skeleton.time - this._attachmentTime;
	},
	setToSetupPose: function () {
		var data = this.data;
		this.r = data.r;
		this.g = data.g;
		this.b = data.b;
		this.a = data.a;
		
		var slotDatas = this.skeleton.data.slots;
		for (var i = 0, n = slotDatas.length; i < n; i++) {
			if (slotDatas[i] == data) {
				this.setAttachment(!data.attachmentName ? null : this.skeleton.getAttachmentBySlotIndex(i, data.attachmentName));
				break;
			}
		}
	}
};

spine.Skin = function (name) {
	this.name = name;
	this.attachments = {};
};
spine.Skin.prototype = {
	addAttachment: function (slotIndex, name, attachment) {
		this.attachments[slotIndex + ":" + name] = attachment;
	},
	getAttachment: function (slotIndex, name) {
		return this.attachments[slotIndex + ":" + name];
	},
	_attachAll: function (skeleton, oldSkin) {
		for (var key in oldSkin.attachments) {
			var colon = key.indexOf(":");
			var slotIndex = parseInt(key.substring(0, colon));
			var name = key.substring(colon + 1);
			var slot = skeleton.slots[slotIndex];
			if (slot.attachment && slot.attachment.name == name) {
				var attachment = this.getAttachment(slotIndex, name);
				if (attachment) slot.setAttachment(attachment);
			}
		}
	}
};

spine.Animation = function (name, timelines, duration) {
	this.name = name;
	this.timelines = timelines;
	this.duration = duration;
};
spine.Animation.prototype = {
	apply: function (skeleton, lastTime, time, loop, events) {
		if (loop && this.duration != 0) {
			time %= this.duration;
			lastTime %= this.duration;
		}
		var timelines = this.timelines;
		for (var i = 0, n = timelines.length; i < n; i++)
			timelines[i].apply(skeleton, lastTime, time, events, 1);
	},
	mix: function (skeleton, lastTime, time, loop, events, alpha) {
		if (loop && this.duration != 0) {
			time %= this.duration;
			lastTime %= this.duration;
		}
		var timelines = this.timelines;
		for (var i = 0, n = timelines.length; i < n; i++)
			timelines[i].apply(skeleton, lastTime, time, events, alpha);
	}
};

spine.binarySearch = function (values, target, step) {
	var low = 0;
	var high = Math.floor(values.length / step) - 2;
	if (high == 0) return step;
	var current = high >>> 1;
	while (true) {
		if (values[(current + 1) * step] <= target)
			low = current + 1;
		else
			high = current;
		if (low == high) return (low + 1) * step;
		current = (low + high) >>> 1;
	}
};
spine.linearSearch = function (values, target, step) {
	for (var i = 0, last = values.length - step; i <= last; i += step)
		if (values[i] > target) return i;
	return -1;
};

spine.Curves = function (frameCount) {
	this.curves = []; // dfx, dfy, ddfx, ddfy, dddfx, dddfy, ...
	this.curves.length = (frameCount - 1) * 6;
};
spine.Curves.prototype = {
	setLinear: function (frameIndex) {
		this.curves[frameIndex * 6] = 0/*LINEAR*/;
	},
	setStepped: function (frameIndex) {
		this.curves[frameIndex * 6] = -1/*STEPPED*/;
	},
	/** Sets the control handle positions for an interpolation bezier curve used to transition from this keyframe to the next.
	 * cx1 and cx2 are from 0 to 1, representing the percent of time between the two keyframes. cy1 and cy2 are the percent of
	 * the difference between the keyframe's values. */
	setCurve: function (frameIndex, cx1, cy1, cx2, cy2) {
		var subdiv_step = 1 / 10/*BEZIER_SEGMENTS*/;
		var subdiv_step2 = subdiv_step * subdiv_step;
		var subdiv_step3 = subdiv_step2 * subdiv_step;
		var pre1 = 3 * subdiv_step;
		var pre2 = 3 * subdiv_step2;
		var pre4 = 6 * subdiv_step2;
		var pre5 = 6 * subdiv_step3;
		var tmp1x = -cx1 * 2 + cx2;
		var tmp1y = -cy1 * 2 + cy2;
		var tmp2x = (cx1 - cx2) * 3 + 1;
		var tmp2y = (cy1 - cy2) * 3 + 1;
		var i = frameIndex * 6;
		var curves = this.curves;
		curves[i] = cx1 * pre1 + tmp1x * pre2 + tmp2x * subdiv_step3;
		curves[i + 1] = cy1 * pre1 + tmp1y * pre2 + tmp2y * subdiv_step3;
		curves[i + 2] = tmp1x * pre4 + tmp2x * pre5;
		curves[i + 3] = tmp1y * pre4 + tmp2y * pre5;
		curves[i + 4] = tmp2x * pre5;
		curves[i + 5] = tmp2y * pre5;
	},
	getCurvePercent: function (frameIndex, percent) {
		percent = percent < 0 ? 0 : (percent > 1 ? 1 : percent);
		var curveIndex = frameIndex * 6;
		var curves = this.curves;
		var dfx = curves[curveIndex];
		if (!dfx/*LINEAR*/) return percent;
		if (dfx == -1/*STEPPED*/) return 0;
		var dfy = curves[curveIndex + 1];
		var ddfx = curves[curveIndex + 2];
		var ddfy = curves[curveIndex + 3];
		var dddfx = curves[curveIndex + 4];
		var dddfy = curves[curveIndex + 5];
		var x = dfx, y = dfy;
		var i = 10/*BEZIER_SEGMENTS*/ - 2;
		while (true) {
			if (x >= percent) {
				var lastX = x - dfx;
				var lastY = y - dfy;
				return lastY + (y - lastY) * (percent - lastX) / (x - lastX);
			}
			if (i == 0) break;
			i--;
			dfx += ddfx;
			dfy += ddfy;
			ddfx += dddfx;
			ddfy += dddfy;
			x += dfx;
			y += dfy;
		}
		return y + (1 - y) * (percent - x) / (1 - x); // Last point is 1,1.
	}
};

spine.RotateTimeline = function (frameCount) {
	this.curves = new spine.Curves(frameCount);
	this.frames = []; // time, angle, ...
	this.frames.length = frameCount * 2;
};
spine.RotateTimeline.prototype = {
	boneIndex: 0,
	getFrameCount: function () {
		return this.frames.length / 2;
	},
	setFrame: function (frameIndex, time, angle) {
		frameIndex *= 2;
		this.frames[frameIndex] = time;
		this.frames[frameIndex + 1] = angle;
	},
	apply: function (skeleton, lastTime, time, firedEvents, alpha) {
		var frames = this.frames;
		if (time < frames[0]) return; // Time is before first frame.

		var bone = skeleton.bones[this.boneIndex];

		if (time >= frames[frames.length - 2]) { // Time is after last frame.
			var amount = bone.data.rotation + frames[frames.length - 1] - bone.rotation;
			while (amount > 180)
				amount -= 360;
			while (amount < -180)
				amount += 360;
			bone.rotation += amount * alpha;
			return;
		}

		// Interpolate between the last frame and the current frame.
		var frameIndex = spine.binarySearch(frames, time, 2);
		var lastFrameValue = frames[frameIndex - 1];
		var frameTime = frames[frameIndex];
		var percent = 1 - (time - frameTime) / (frames[frameIndex - 2/*LAST_FRAME_TIME*/] - frameTime);
		percent = this.curves.getCurvePercent(frameIndex / 2 - 1, percent);

		var amount = frames[frameIndex + 1/*FRAME_VALUE*/] - lastFrameValue;
		while (amount > 180)
			amount -= 360;
		while (amount < -180)
			amount += 360;
		amount = bone.data.rotation + (lastFrameValue + amount * percent) - bone.rotation;
		while (amount > 180)
			amount -= 360;
		while (amount < -180)
			amount += 360;
		bone.rotation += amount * alpha;
	}
};

spine.TranslateTimeline = function (frameCount) {
	this.curves = new spine.Curves(frameCount);
	this.frames = []; // time, x, y, ...
	this.frames.length = frameCount * 3;
};
spine.TranslateTimeline.prototype = {
	boneIndex: 0,
	getFrameCount: function () {
		return this.frames.length / 3;
	},
	setFrame: function (frameIndex, time, x, y) {
		frameIndex *= 3;
		this.frames[frameIndex] = time;
		this.frames[frameIndex + 1] = x;
		this.frames[frameIndex + 2] = y;
	},
	apply: function (skeleton, lastTime, time, firedEvents, alpha) {
		var frames = this.frames;
		if (time < frames[0]) return; // Time is before first frame.

		var bone = skeleton.bones[this.boneIndex];

		if (time >= frames[frames.length - 3]) { // Time is after last frame.
			bone.x += (bone.data.x + frames[frames.length - 2] - bone.x) * alpha;
			bone.y += (bone.data.y + frames[frames.length - 1] - bone.y) * alpha;
			return;
		}

		// Interpolate between the last frame and the current frame.
		var frameIndex = spine.binarySearch(frames, time, 3);
		var lastFrameX = frames[frameIndex - 2];
		var lastFrameY = frames[frameIndex - 1];
		var frameTime = frames[frameIndex];
		var percent = 1 - (time - frameTime) / (frames[frameIndex + -3/*LAST_FRAME_TIME*/] - frameTime);
		percent = this.curves.getCurvePercent(frameIndex / 3 - 1, percent);

		bone.x += (bone.data.x + lastFrameX + (frames[frameIndex + 1/*FRAME_X*/] - lastFrameX) * percent - bone.x) * alpha;
		bone.y += (bone.data.y + lastFrameY + (frames[frameIndex + 2/*FRAME_Y*/] - lastFrameY) * percent - bone.y) * alpha;
	}
};

spine.ScaleTimeline = function (frameCount) {
	this.curves = new spine.Curves(frameCount);
	this.frames = []; // time, x, y, ...
	this.frames.length = frameCount * 3;
};
spine.ScaleTimeline.prototype = {
	boneIndex: 0,
	getFrameCount: function () {
		return this.frames.length / 3;
	},
	setFrame: function (frameIndex, time, x, y) {
		frameIndex *= 3;
		this.frames[frameIndex] = time;
		this.frames[frameIndex + 1] = x;
		this.frames[frameIndex + 2] = y;
	},
	apply: function (skeleton, lastTime, time, firedEvents, alpha) {
		var frames = this.frames;
		if (time < frames[0]) return; // Time is before first frame.

		var bone = skeleton.bones[this.boneIndex];

		if (time >= frames[frames.length - 3]) { // Time is after last frame.
			bone.scaleX += (bone.data.scaleX - 1 + frames[frames.length - 2] - bone.scaleX) * alpha;
			bone.scaleY += (bone.data.scaleY - 1 + frames[frames.length - 1] - bone.scaleY) * alpha;
			return;
		}

		// Interpolate between the last frame and the current frame.
		var frameIndex = spine.binarySearch(frames, time, 3);
		var lastFrameX = frames[frameIndex - 2];
		var lastFrameY = frames[frameIndex - 1];
		var frameTime = frames[frameIndex];
		var percent = 1 - (time - frameTime) / (frames[frameIndex + -3/*LAST_FRAME_TIME*/] - frameTime);
		percent = this.curves.getCurvePercent(frameIndex / 3 - 1, percent);

		bone.scaleX += (bone.data.scaleX - 1 + lastFrameX + (frames[frameIndex + 1/*FRAME_X*/] - lastFrameX) * percent - bone.scaleX) * alpha;
		bone.scaleY += (bone.data.scaleY - 1 + lastFrameY + (frames[frameIndex + 2/*FRAME_Y*/] - lastFrameY) * percent - bone.scaleY) * alpha;
	}
};

spine.ColorTimeline = function (frameCount) {
	this.curves = new spine.Curves(frameCount);
	this.frames = []; // time, r, g, b, a, ...
	this.frames.length = frameCount * 5;
};
spine.ColorTimeline.prototype = {
	slotIndex: 0,
	getFrameCount: function () {
		return this.frames.length / 5;
	},
	setFrame: function (frameIndex, time, r, g, b, a) {
		frameIndex *= 5;
		this.frames[frameIndex] = time;
		this.frames[frameIndex + 1] = r;
		this.frames[frameIndex + 2] = g;
		this.frames[frameIndex + 3] = b;
		this.frames[frameIndex + 4] = a;
	},
	apply: function (skeleton, lastTime, time, firedEvents, alpha) {
		var frames = this.frames;
		if (time < frames[0]) return; // Time is before first frame.

		var slot = skeleton.slots[this.slotIndex];

		if (time >= frames[frames.length - 5]) { // Time is after last frame.
			var i = frames.length - 1;
			slot.r = frames[i - 3];
			slot.g = frames[i - 2];
			slot.b = frames[i - 1];
			slot.a = frames[i];
			return;
		}

		// Interpolate between the last frame and the current frame.
		var frameIndex = spine.binarySearch(frames, time, 5);
		var lastFrameR = frames[frameIndex - 4];
		var lastFrameG = frames[frameIndex - 3];
		var lastFrameB = frames[frameIndex - 2];
		var lastFrameA = frames[frameIndex - 1];
		var frameTime = frames[frameIndex];
		var percent = 1 - (time - frameTime) / (frames[frameIndex - 5/*LAST_FRAME_TIME*/] - frameTime);
		percent = this.curves.getCurvePercent(frameIndex / 5 - 1, percent);

		var r = lastFrameR + (frames[frameIndex + 1/*FRAME_R*/] - lastFrameR) * percent;
		var g = lastFrameG + (frames[frameIndex + 2/*FRAME_G*/] - lastFrameG) * percent;
		var b = lastFrameB + (frames[frameIndex + 3/*FRAME_B*/] - lastFrameB) * percent;
		var a = lastFrameA + (frames[frameIndex + 4/*FRAME_A*/] - lastFrameA) * percent;
		if (alpha < 1) {
			slot.r += (r - slot.r) * alpha;
			slot.g += (g - slot.g) * alpha;
			slot.b += (b - slot.b) * alpha;
			slot.a += (a - slot.a) * alpha;
		} else {
			slot.r = r;
			slot.g = g;
			slot.b = b;
			slot.a = a;
		}
	}
};

spine.AttachmentTimeline = function (frameCount) {
	this.curves = new spine.Curves(frameCount);
	this.frames = []; // time, ...
	this.frames.length = frameCount;
	this.attachmentNames = [];
	this.attachmentNames.length = frameCount;
};
spine.AttachmentTimeline.prototype = {
	slotIndex: 0,
	getFrameCount: function () {
		return this.frames.length;
	},
	setFrame: function (frameIndex, time, attachmentName) {
		this.frames[frameIndex] = time;
		this.attachmentNames[frameIndex] = attachmentName;
	},
	apply: function (skeleton, lastTime, time, firedEvents, alpha) {
		var frames = this.frames;
		if (time < frames[0]) return; // Time is before first frame.

		var frameIndex;
		if (time >= frames[frames.length - 1]) // Time is after last frame.
			frameIndex = frames.length - 1;
		else
			frameIndex = spine.binarySearch(frames, time, 1) - 1;

		var attachmentName = this.attachmentNames[frameIndex];
		skeleton.slots[this.slotIndex].setAttachment(!attachmentName ? null : skeleton.getAttachmentBySlotIndex(this.slotIndex, attachmentName));
	}
};

spine.EventTimeline = function (frameCount) {
	this.frames = []; // time, ...
	this.frames.length = frameCount;
	this.events = [];
	this.events.length = frameCount;
};
spine.EventTimeline.prototype = {
	getFrameCount: function () {
		return this.frames.length;
	},
	setFrame: function (frameIndex, time, event) {
		this.frames[frameIndex] = time;
		this.events[frameIndex] = event;
	},
	apply: function (skeleton, lastTime, time, firedEvents, alpha) {
		if (!firedEvents) return;

		var frames = this.frames;
		var frameCount = frames.length;
		if (lastTime >= frames[frameCount - 1]) return; // Last time is after last frame.

		if (lastTime > time) { // Fire events after last time for looped animations.
			this.apply(skeleton, lastTime, Number.MAX_VALUE, firedEvents, alpha);
			lastTime = 0;
		}

		var frameIndex;
		if (lastTime <= frames[0] || frameCount == 1)
			frameIndex = 0;
		else {
			frameIndex = spine.binarySearch(frames, lastTime, 1);
			var frame = frames[frameIndex];
			while (frameIndex > 0) { // Fire multiple events with the same frame.
				if (frames[frameIndex - 1] != frame) break;
				frameIndex--;
			}
		}
		var events = this.events;
		for (; frameIndex < frameCount && time >= frames[frameIndex]; frameIndex++)
			firedEvents.push(events[frameIndex]);
	}
};

spine.DrawOrderTimeline = function (frameCount) {
	this.frames = []; // time, ...
	this.frames.length = frameCount;
	this.drawOrders = [];
	this.drawOrders.length = frameCount;
};
spine.DrawOrderTimeline.prototype = {
	getFrameCount: function () {
		return this.frames.length;
	},
	setFrame: function (frameIndex, time, drawOrder) {
		this.frames[frameIndex] = time;
		this.drawOrders[frameIndex] = drawOrder;
	},
	apply: function (skeleton, lastTime, time, firedEvents, alpha) {
		var frames = this.frames;
		if (time < frames[0]) return; // Time is before first frame.

		var frameIndex;
		if (time >= frames[frames.length - 1]) // Time is after last frame.
			frameIndex = frames.length - 1;
		else
			frameIndex = spine.binarySearch(frames, time, 1) - 1;

		var drawOrder = skeleton.drawOrder;
		var slots = skeleton.slots;
		var drawOrderToSetupIndex = this.drawOrders[frameIndex];
		if (!drawOrderToSetupIndex) {
			for (var i = 0, n = slots.length; i < n; i++)
				drawOrder[i] = slots[i];
		} else {
			for (var i = 0, n = drawOrderToSetupIndex.length; i < n; i++)
				drawOrder[i] = skeleton.slots[drawOrderToSetupIndex[i]];
		}

	}
};

spine.SkeletonData = function () {
	this.bones = [];
	this.slots = [];
	this.skins = [];
	this.events = [];
	this.animations = [];
};
spine.SkeletonData.prototype = {
	defaultSkin: null,
	/** @return May be null. */
	findBone: function (boneName) {
		var bones = this.bones;
		for (var i = 0, n = bones.length; i < n; i++)
			if (bones[i].name == boneName) return bones[i];
		return null;
	},
	/** @return -1 if the bone was not found. */
	findBoneIndex: function (boneName) {
		var bones = this.bones;
		for (var i = 0, n = bones.length; i < n; i++)
			if (bones[i].name == boneName) return i;
		return -1;
	},
	/** @return May be null. */
	findSlot: function (slotName) {
		var slots = this.slots;
		for (var i = 0, n = slots.length; i < n; i++) {
			if (slots[i].name == slotName) return slot[i];
		}
		return null;
	},
	/** @return -1 if the bone was not found. */
	findSlotIndex: function (slotName) {
		var slots = this.slots;
		for (var i = 0, n = slots.length; i < n; i++)
			if (slots[i].name == slotName) return i;
		return -1;
	},
	/** @return May be null. */
	findSkin: function (skinName) {
		var skins = this.skins;
		for (var i = 0, n = skins.length; i < n; i++)
			if (skins[i].name == skinName) return skins[i];
		return null;
	},
	/** @return May be null. */
	findEvent: function (eventName) {
		var events = this.events;
		for (var i = 0, n = events.length; i < n; i++)
			if (events[i].name == eventName) return events[i];
		return null;
	},
	/** @return May be null. */
	findAnimation: function (animationName) {
		var animations = this.animations;
		for (var i = 0, n = animations.length; i < n; i++)
			if (animations[i].name == animationName) return animations[i];
		return null;
	}
};

spine.Skeleton = function (skeletonData) {
	this.data = skeletonData;

	this.bones = [];
	for (var i = 0, n = skeletonData.bones.length; i < n; i++) {
		var boneData = skeletonData.bones[i];
		var parent = !boneData.parent ? null : this.bones[skeletonData.bones.indexOf(boneData.parent)];
		this.bones.push(new spine.Bone(boneData, parent));
	}

	this.slots = [];
	this.drawOrder = [];
	for (var i = 0, n = skeletonData.slots.length; i < n; i++) {
		var slotData = skeletonData.slots[i];
		var bone = this.bones[skeletonData.bones.indexOf(slotData.boneData)];
		var slot = new spine.Slot(slotData, this, bone);
		this.slots.push(slot);
		this.drawOrder.push(slot);
	}
};
spine.Skeleton.prototype = {
	x: 0, y: 0,
	skin: null,
	r: 1, g: 1, b: 1, a: 1,
	time: 0,
	flipX: false, flipY: false,
	/** Updates the world transform for each bone. */
	updateWorldTransform: function () {
		var flipX = this.flipX;
		var flipY = this.flipY;
		var bones = this.bones;
		for (var i = 0, n = bones.length; i < n; i++)
			bones[i].updateWorldTransform(flipX, flipY);
	},
	/** Sets the bones and slots to their setup pose values. */
	setToSetupPose: function () {
		this.setBonesToSetupPose();
		this.setSlotsToSetupPose();
	},
	setBonesToSetupPose: function () {
		var bones = this.bones;
		for (var i = 0, n = bones.length; i < n; i++)
			bones[i].setToSetupPose();
	},
	setSlotsToSetupPose: function () {
		var slots = this.slots;
		for (var i = 0, n = slots.length; i < n; i++)
			slots[i].setToSetupPose(i);
	},
	/** @return May return null. */
	getRootBone: function () {
		return this.bones.length == 0 ? null : this.bones[0];
	},
	/** @return May be null. */
	findBone: function (boneName) {
		var bones = this.bones;
		for (var i = 0, n = bones.length; i < n; i++)
			if (bones[i].data.name == boneName) return bones[i];
		return null;
	},
	/** @return -1 if the bone was not found. */
	findBoneIndex: function (boneName) {
		var bones = this.bones;
		for (var i = 0, n = bones.length; i < n; i++)
			if (bones[i].data.name == boneName) return i;
		return -1;
	},
	/** @return May be null. */
	findSlot: function (slotName) {
		var slots = this.slots;
		for (var i = 0, n = slots.length; i < n; i++)
			if (slots[i].data.name == slotName) return slots[i];
		return null;
	},
	/** @return -1 if the bone was not found. */
	findSlotIndex: function (slotName) {
		var slots = this.slots;
		for (var i = 0, n = slots.length; i < n; i++)
			if (slots[i].data.name == slotName) return i;
		return -1;
	},
	setSkinByName: function (skinName) {
		var skin = this.data.findSkin(skinName);
		if (!skin) throw "Skin not found: " + skinName;
		this.setSkin(skin);
	},
	/** Sets the skin used to look up attachments not found in the {@link SkeletonData#getDefaultSkin() default skin}. Attachments
	 * from the new skin are attached if the corresponding attachment from the old skin was attached.
	 * @param newSkin May be null. */
	setSkin: function (newSkin) {
		if (this.skin && newSkin) newSkin._attachAll(this, this.skin);
		this.skin = newSkin;
	},
	/** @return May be null. */
	getAttachmentBySlotName: function (slotName, attachmentName) {
		return this.getAttachmentBySlotIndex(this.data.findSlotIndex(slotName), attachmentName);
	},
	/** @return May be null. */
	getAttachmentBySlotIndex: function (slotIndex, attachmentName) {
		if (this.skin) {
			var attachment = this.skin.getAttachment(slotIndex, attachmentName);
			if (attachment) return attachment;
		}
		if (this.data.defaultSkin) return this.data.defaultSkin.getAttachment(slotIndex, attachmentName);
		return null;
	},
	/** @param attachmentName May be null. */
	setAttachment: function (slotName, attachmentName) {
		var slots = this.slots;
		for (var i = 0, n = slots.size; i < n; i++) {
			var slot = slots[i];
			if (slot.data.name == slotName) {
				var attachment = null;
				if (attachmentName) {
					attachment = this.getAttachment(i, attachmentName);
					if (!attachment) throw "Attachment not found: " + attachmentName + ", for slot: " + slotName;
				}
				slot.setAttachment(attachment);
				return;
			}
		}
		throw "Slot not found: " + slotName;
	},
	update: function (delta) {
		time += delta;
	}
};

spine.EventData = function (name) {
	this.name = name;
}
spine.EventData.prototype = {
	intValue: 0,
	floatValue: 0,
	stringValue: null
};

spine.Event = function (data) {
	this.data = data;
}
spine.Event.prototype = {
	intValue: 0,
	floatValue: 0,
	stringValue: null
};

spine.AttachmentType = {
	region: 0,
	boundingbox: 1
};

spine.RegionAttachment = function (name) {
	this.name = name;
	this.offset = [];
	this.offset.length = 8;
	this.uvs = [];
	this.uvs.length = 8;
};
spine.RegionAttachment.prototype = {
	type: spine.AttachmentType.region,
	x: 0, y: 0,
	rotation: 0,
	scaleX: 1, scaleY: 1,
	width: 0, height: 0,
	rendererObject: null,
	regionOffsetX: 0, regionOffsetY: 0,
	regionWidth: 0, regionHeight: 0,
	regionOriginalWidth: 0, regionOriginalHeight: 0,
	setUVs: function (u, v, u2, v2, rotate) {
		var uvs = this.uvs;
		if (rotate) {
			uvs[2/*X2*/] = u;
			uvs[3/*Y2*/] = v2;
			uvs[4/*X3*/] = u;
			uvs[5/*Y3*/] = v;
			uvs[6/*X4*/] = u2;
			uvs[7/*Y4*/] = v;
			uvs[0/*X1*/] = u2;
			uvs[1/*Y1*/] = v2;
		} else {
			uvs[0/*X1*/] = u;
			uvs[1/*Y1*/] = v2;
			uvs[2/*X2*/] = u;
			uvs[3/*Y2*/] = v;
			uvs[4/*X3*/] = u2;
			uvs[5/*Y3*/] = v;
			uvs[6/*X4*/] = u2;
			uvs[7/*Y4*/] = v2;
		}
	},
	updateOffset: function () {
		var regionScaleX = this.width / this.regionOriginalWidth * this.scaleX;
		var regionScaleY = this.height / this.regionOriginalHeight * this.scaleY;
		var localX = -this.width / 2 * this.scaleX + this.regionOffsetX * regionScaleX;
		var localY = -this.height / 2 * this.scaleY + this.regionOffsetY * regionScaleY;
		var localX2 = localX + this.regionWidth * regionScaleX;
		var localY2 = localY + this.regionHeight * regionScaleY;
		var radians = this.rotation * Math.PI / 180;
		var cos = Math.cos(radians);
		var sin = Math.sin(radians);
		var localXCos = localX * cos + this.x;
		var localXSin = localX * sin;
		var localYCos = localY * cos + this.y;
		var localYSin = localY * sin;
		var localX2Cos = localX2 * cos + this.x;
		var localX2Sin = localX2 * sin;
		var localY2Cos = localY2 * cos + this.y;
		var localY2Sin = localY2 * sin;
		var offset = this.offset;
		offset[0/*X1*/] = localXCos - localYSin;
		offset[1/*Y1*/] = localYCos + localXSin;
		offset[2/*X2*/] = localXCos - localY2Sin;
		offset[3/*Y2*/] = localY2Cos + localXSin;
		offset[4/*X3*/] = localX2Cos - localY2Sin;
		offset[5/*Y3*/] = localY2Cos + localX2Sin;
		offset[6/*X4*/] = localX2Cos - localYSin;
		offset[7/*Y4*/] = localYCos + localX2Sin;
	},
	computeVertices: function (x, y, bone, vertices) {
		x += bone.worldX;
		y += bone.worldY;
		var m00 = bone.m00;
		var m01 = bone.m01;
		var m10 = bone.m10;
		var m11 = bone.m11;
		var offset = this.offset;
		vertices[0/*X1*/] = offset[0/*X1*/] * m00 + offset[1/*Y1*/] * m01 + x;
		vertices[1/*Y1*/] = offset[0/*X1*/] * m10 + offset[1/*Y1*/] * m11 + y;
		vertices[2/*X2*/] = offset[2/*X2*/] * m00 + offset[3/*Y2*/] * m01 + x;
		vertices[3/*Y2*/] = offset[2/*X2*/] * m10 + offset[3/*Y2*/] * m11 + y;
		vertices[4/*X3*/] = offset[4/*X3*/] * m00 + offset[5/*X3*/] * m01 + x;
		vertices[5/*X3*/] = offset[4/*X3*/] * m10 + offset[5/*X3*/] * m11 + y;
		vertices[6/*X4*/] = offset[6/*X4*/] * m00 + offset[7/*Y4*/] * m01 + x;
		vertices[7/*Y4*/] = offset[6/*X4*/] * m10 + offset[7/*Y4*/] * m11 + y;
	}
};

spine.BoundingBoxAttachment = function (name) {
	this.name = name;
	this.vertices = [];
};
spine.BoundingBoxAttachment.prototype = {
	type: spine.AttachmentType.boundingBox,
	computeWorldVertices: function (x, y, bone, worldVertices) {
		x += bone.worldX;
		y += bone.worldY;
		var m00 = bone.m00;
		var m01 = bone.m01;
		var m10 = bone.m10;
		var m11 = bone.m11;
		var vertices = this.vertices;
		for (var i = 0, n = vertices.length; i < n; i += 2) {
			var px = vertices[i];
			var py = vertices[i + 1];
			worldVertices[i] = px * m00 + py * m01 + x;
			worldVertices[i + 1] = px * m10 + py * m11 + y;
		}
	}
};

spine.AnimationStateData = function (skeletonData) {
	this.skeletonData = skeletonData;
	this.animationToMixTime = {};
};
spine.AnimationStateData.prototype = {
	defaultMix: 0,
	setMixByName: function (fromName, toName, duration) {
		var from = this.skeletonData.findAnimation(fromName);
		if (!from) throw "Animation not found: " + fromName;
		var to = this.skeletonData.findAnimation(toName);
		if (!to) throw "Animation not found: " + toName;
		this.setMix(from, to, duration);
	},
	setMix: function (from, to, duration) {
		this.animationToMixTime[from.name + ":" + to.name] = duration;
	},
	getMix: function (from, to) {
		var time = this.animationToMixTime[from.name + ":" + to.name];
		return time ? time : this.defaultMix;
	}
};

spine.TrackEntry = function () {};
spine.TrackEntry.prototype = {
	next: null, previous: null,
	animation: null,
	loop: false,
	delay: 0, time: 0, lastTime: 0, endTime: 0,
	timeScale: 1,
	mixTime: 0, mixDuration: 0,
	onStart: null, onEnd: null, onComplete: null, onEvent: null
}

spine.AnimationState = function (stateData) {
	this.data = stateData;
	this.tracks = [];
	this.events = [];
};
spine.AnimationState.prototype = {
	onStart: null,
	onEnd: null,
	onComplete: null,
	onEvent: null,
	timeScale: 1,
	update: function (delta) {
		delta *= this.timeScale;
		for (var i = 0; i < this.tracks.length; i++) {
			var current = this.tracks[i];
			if (!current) continue;
			
			var trackDelta = delta * current.timeScale;
			var time = current.time + trackDelta;
			var endTime = current.endTime;
			
			current.time = time;
			if (current.previous) {
				current.previous.time += trackDelta;
				current.mixTime += trackDelta;
			}
			
			// Check if completed the animation or a loop iteration.
			if (current.loop ? (current.lastTime % endTime > time % endTime) : (current.lastTime < endTime && time >= endTime)) {
				var count = Math.floor(time / endTime);
				if (current.onComplete) current.onComplete(i, count);
				if (this.onComplete) this.onComplete(i, count);
			}
			
			var next = current.next;
			if (next) {
				if (time - trackDelta > next.delay) this.setCurrent(i, next);
			} else {
				// End non-looping animation when it reaches its end time and there is no next entry.
				if (!current.loop && current.lastTime >= current.endTime) this.clearTrack(i);
			}
		}
	},
	apply: function (skeleton) {
		for (var i = 0; i < this.tracks.length; i++) {
			var current = this.tracks[i];
			if (!current) continue;
			
			this.events.length = 0;
			
			var time = current.time;
			var loop = current.loop;
			if (!loop && time > current.endTime) time = current.endTime;
			
			var previous = current.previous;
			if (!previous)
				current.animation.apply(skeleton, current.lastTime, time, loop, this.events);
			else {
				var previousTime = previous.time;
				if (!previous.loop && previousTime > previous.endTime) previousTime = previous.endTime;
				previous.animation.apply(skeleton, previousTime, previousTime, previous.loop, null);
				
				var alpha = current.mixTime / current.mixDuration;
				if (alpha >= 1) {
					alpha = 1;
					current.previous = null;
				}
				current.animation.mix(skeleton, current.lastTime, time, loop, this.events, alpha);
			}
			
			for (var ii = 0, nn = this.events.length; ii < nn; ii++) {
				var event = this.events[ii];
				if (current.onEvent != null) current.onEvent(i, event);
				if (this.onEvent != null) this.onEvent(i, event);
			}
			
			current.lastTime = current.time;
		}
	},
	clearTracks: function () {	
		for (var i = 0, n = this.tracks.length; i < n; i++)
			this.clearTrack(i);
		this.tracks.length = 0; 
	},
	clearTrack: function (trackIndex) {
		if (trackIndex >= this.tracks.length) return;
		var current = this.tracks[trackIndex];
		if (!current) return;

		if (current.onEnd != null) current.onEnd(trackIndex);
		if (this.onEnd != null) this.onEnd(trackIndex);

		this.tracks[trackIndex] = null;
	},
	_expandToIndex: function (index) {
		if (index < this.tracks.length) return this.tracks[index];
		while (index >= this.tracks.length)
			this.tracks.push(null);
		return null;
	},
	setCurrent: function (index, entry) {
		var current = this._expandToIndex(index);
		if (current) {
			current.previous = null;
			
			if (current.onEnd != null) current.onEnd(index);
			if (this.onEnd != null) this.onEnd(index);
			
			entry.mixDuration = this.data.getMix(current.animation, entry.animation);
			if (entry.mixDuration > 0) {
				entry.mixTime = 0;
				entry.previous = current;
			}
		}
		
		this.tracks[index] = entry;
		
		if (entry.onStart != null) entry.onStart(index);
		if (this.onStart != null) this.onStart(index);
	},
	setAnimationByName: function (trackIndex, animationName, loop) {
		var animation = this.data.skeletonData.findAnimation(animationName);
		if (!animation) throw "Animation not found: " + animationName;
		return this.setAnimation(trackIndex, animation, loop);
	},
	/** Set the current animation. Any queued animations are cleared. */
	setAnimation: function (trackIndex, animation, loop) {
		var entry = new spine.TrackEntry();
		entry.animation = animation;
		entry.loop = loop;
		entry.endTime = animation.duration;
		this.setCurrent(trackIndex, entry);
		return entry;
	},
	addAnimationByName: function (trackIndex, animationName, loop, delay) {
		var animation = this.data.skeletonData.findAnimation(animationName);
		if (!animation) throw "Animation not found: " + animationName;
		return this.addAnimation(trackIndex, animation, loop, delay);
	},
	/** Adds an animation to be played delay seconds after the current or last queued animation.
	 * @param delay May be <= 0 to use duration of previous animation minus any mix duration plus the negative delay. */
	addAnimation: function (trackIndex, animation, loop, delay) {
		var entry = new spine.TrackEntry();
		entry.animation = animation;
		entry.loop = loop;
		entry.endTime = animation.duration;
		
		var last = this._expandToIndex(trackIndex);
		if (last) {
			while (last.next)
				last = last.next;
			last.next = entry;
		} else
			this.tracks[trackIndex] = entry;
		
		if (delay <= 0) {
			if (last)
				delay += last.endTime - this.data.getMix(last.animation, animation);
			else
				delay = 0;
		}
		entry.delay = delay;
		
		return entry;
	},	
	/** May be null. */
	getCurrent: function (trackIndex) {
		if (trackIndex >= this.tracks.length) return null;
		return this.tracks[trackIndex];
	}
};

spine.SkeletonJson = function (attachmentLoader) {
	this.attachmentLoader = attachmentLoader;
};
spine.SkeletonJson.prototype = {
	scale: 1,
	readSkeletonData: function (root) {
		var skeletonData = new spine.SkeletonData();

		// Bones.
		var bones = root["bones"];
		for (var i = 0, n = bones.length; i < n; i++) {
			var boneMap = bones[i];
			var parent = null;
			if (boneMap["parent"]) {
				parent = skeletonData.findBone(boneMap["parent"]);
				if (!parent) throw "Parent bone not found: " + boneMap["parent"];
			}
			var boneData = new spine.BoneData(boneMap["name"], parent);
			boneData.length = (boneMap["length"] || 0) * this.scale;
			boneData.x = (boneMap["x"] || 0) * this.scale;
			boneData.y = (boneMap["y"] || 0) * this.scale;
			boneData.rotation = (boneMap["rotation"] || 0);
			boneData.scaleX = boneMap["scaleX"] || 1;
			boneData.scaleY = boneMap["scaleY"] || 1;
			boneData.inheritScale = boneMap["inheritScale"] || true;
			boneData.inheritRotation = boneMap["inheritRotation"] || true;
			skeletonData.bones.push(boneData);
		}

		// Slots.
		var slots = root["slots"];
		for (var i = 0, n = slots.length; i < n; i++) {
			var slotMap = slots[i];
			var boneData = skeletonData.findBone(slotMap["bone"]);
			if (!boneData) throw "Slot bone not found: " + slotMap["bone"];
			var slotData = new spine.SlotData(slotMap["name"], boneData);

			var color = slotMap["color"];
			if (color) {
				slotData.r = spine.SkeletonJson.toColor(color, 0);
				slotData.g = spine.SkeletonJson.toColor(color, 1);
				slotData.b = spine.SkeletonJson.toColor(color, 2);
				slotData.a = spine.SkeletonJson.toColor(color, 3);
			}

			slotData.attachmentName = slotMap["attachment"];
			slotData.additiveBlending = slotMap["additive"];

			skeletonData.slots.push(slotData);
		}

		// Skins.
		var skins = root["skins"];
		for (var skinName in skins) {
			if (!skins.hasOwnProperty(skinName)) continue;
			var skinMap = skins[skinName];
			var skin = new spine.Skin(skinName);
			for (var slotName in skinMap) {
				if (!skinMap.hasOwnProperty(slotName)) continue;
				var slotIndex = skeletonData.findSlotIndex(slotName);
				var slotEntry = skinMap[slotName];
				for (var attachmentName in slotEntry) {
					if (!slotEntry.hasOwnProperty(attachmentName)) continue;
					var attachment = this.readAttachment(skin, attachmentName, slotEntry[attachmentName]);
					if (attachment != null) skin.addAttachment(slotIndex, attachmentName, attachment);
				}
			}
			skeletonData.skins.push(skin);
			if (skin.name == "default") skeletonData.defaultSkin = skin;
		}

		// Events.
		var events = root["events"];
		for (var eventName in events) {
			if (!events.hasOwnProperty(eventName)) continue;
			var eventMap = events[eventName];
			var eventData = new spine.EventData(eventName);
			eventData.intValue = eventMap["int"] || 0;
			eventData.floatValue = eventMap["float"] || 0;
			eventData.stringValue = eventMap["string"] || null;
			skeletonData.events.push(eventData);
		}

		// Animations.
		var animations = root["animations"];
		for (var animationName in animations) {
			if (!animations.hasOwnProperty(animationName)) continue;
			this.readAnimation(animationName, animations[animationName], skeletonData);
		}

		return skeletonData;
	},
	readAttachment: function (skin, name, map) {
		name = map["name"] || name;

		var type = spine.AttachmentType[map["type"] || "region"];
		var attachment = this.attachmentLoader.newAttachment(skin, type, name);

		if (type == spine.AttachmentType.region) {
			attachment.x = (map["x"] || 0) * this.scale;
			attachment.y = (map["y"] || 0) * this.scale;
			attachment.scaleX = map["scaleX"] || 1;
			attachment.scaleY = map["scaleY"] || 1;
			attachment.rotation = map["rotation"] || 0;
			attachment.width = (map["width"] || 32) * this.scale;
			attachment.height = (map["height"] || 32) * this.scale;
			attachment.updateOffset();
		} else if (type == spine.AttachmentType.boundingBox) {
			var vertices = map["vertices"];
			for (var i = 0, n = vertices.length; i < n; i++)
				attachment.vertices.push(vertices[i] * scale);
		}

		return attachment;
	},
	readAnimation: function (name, map, skeletonData) {
		var timelines = [];
		var duration = 0;

		var bones = map["bones"];
		for (var boneName in bones) {
			if (!bones.hasOwnProperty(boneName)) continue;
			var boneIndex = skeletonData.findBoneIndex(boneName);
			if (boneIndex == -1) throw "Bone not found: " + boneName;
			var boneMap = bones[boneName];

			for (var timelineName in boneMap) {
				if (!boneMap.hasOwnProperty(timelineName)) continue;
				var values = boneMap[timelineName];
				if (timelineName == "rotate") {
					var timeline = new spine.RotateTimeline(values.length);
					timeline.boneIndex = boneIndex;

					var frameIndex = 0;
					for (var i = 0, n = values.length; i < n; i++) {
						var valueMap = values[i];
						timeline.setFrame(frameIndex, valueMap["time"], valueMap["angle"]);
						spine.SkeletonJson.readCurve(timeline, frameIndex, valueMap);
						frameIndex++;
					}
					timelines.push(timeline);
					duration = Math.max(duration, timeline.frames[timeline.getFrameCount() * 2 - 2]);

				} else if (timelineName == "translate" || timelineName == "scale") {
					var timeline;
					var timelineScale = 1;
					if (timelineName == "scale")
						timeline = new spine.ScaleTimeline(values.length);
					else {
						timeline = new spine.TranslateTimeline(values.length);
						timelineScale = this.scale;
					}
					timeline.boneIndex = boneIndex;

					var frameIndex = 0;
					for (var i = 0, n = values.length; i < n; i++) {
						var valueMap = values[i];
						var x = (valueMap["x"] || 0) * timelineScale;
						var y = (valueMap["y"] || 0) * timelineScale;
						timeline.setFrame(frameIndex, valueMap["time"], x, y);
						spine.SkeletonJson.readCurve(timeline, frameIndex, valueMap);
						frameIndex++;
					}
					timelines.push(timeline);
					duration = Math.max(duration, timeline.frames[timeline.getFrameCount() * 3 - 3]);

				} else
					throw "Invalid timeline type for a bone: " + timelineName + " (" + boneName + ")";
			}
		}

		var slots = map["slots"];
		for (var slotName in slots) {
			if (!slots.hasOwnProperty(slotName)) continue;
			var slotMap = slots[slotName];
			var slotIndex = skeletonData.findSlotIndex(slotName);

			for (var timelineName in slotMap) {
				if (!slotMap.hasOwnProperty(timelineName)) continue;
				var values = slotMap[timelineName];
				if (timelineName == "color") {
					var timeline = new spine.ColorTimeline(values.length);
					timeline.slotIndex = slotIndex;

					var frameIndex = 0;
					for (var i = 0, n = values.length; i < n; i++) {
						var valueMap = values[i];
						var color = valueMap["color"];
						var r = spine.SkeletonJson.toColor(color, 0);
						var g = spine.SkeletonJson.toColor(color, 1);
						var b = spine.SkeletonJson.toColor(color, 2);
						var a = spine.SkeletonJson.toColor(color, 3);
						timeline.setFrame(frameIndex, valueMap["time"], r, g, b, a);
						spine.SkeletonJson.readCurve(timeline, frameIndex, valueMap);
						frameIndex++;
					}
					timelines.push(timeline);
					duration = Math.max(duration, timeline.frames[timeline.getFrameCount() * 5 - 5]);

				} else if (timelineName == "attachment") {
					var timeline = new spine.AttachmentTimeline(values.length);
					timeline.slotIndex = slotIndex;

					var frameIndex = 0;
					for (var i = 0, n = values.length; i < n; i++) {
						var valueMap = values[i];
						timeline.setFrame(frameIndex++, valueMap["time"], valueMap["name"]);
					}
					timelines.push(timeline);
					duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);

				} else
					throw "Invalid timeline type for a slot: " + timelineName + " (" + slotName + ")";
			}
		}

		var events = map["events"];
		if (events) {
			var timeline = new spine.EventTimeline(events.length);
			var frameIndex = 0;
			for (var i = 0, n = events.length; i < n; i++) {
				var eventMap = events[i];
				var eventData = skeletonData.findEvent(eventMap["name"]);
				if (!eventData) throw "Event not found: " + eventMap["name"];
				var event = new spine.Event(eventData);
				event.intValue = eventMap.hasOwnProperty("int") ? eventMap["int"] : eventData.intValue;
				event.floatValue = eventMap.hasOwnProperty("float") ? eventMap["float"] : eventData.floatValue;
				event.stringValue = eventMap.hasOwnProperty("string") ? eventMap["string"] : eventData.stringValue;
				timeline.setFrame(frameIndex++, eventMap["time"], event);
			}
			timelines.push(timeline);
			duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
		}

		var drawOrderValues = map["draworder"];
		if (drawOrderValues) {
			var timeline = new spine.DrawOrderTimeline(drawOrderValues.length);
			var slotCount = skeletonData.slots.length;
			var frameIndex = 0;
			for (var i = 0, n = drawOrderValues.length; i < n; i++) {
				var drawOrderMap = drawOrderValues[i];
				var drawOrder = null;
				if (drawOrderMap["offsets"]) {
					drawOrder = [];
					drawOrder.length = slotCount;
					for (var ii = slotCount - 1; ii >= 0; ii--)
						drawOrder[ii] = -1;
					var offsets = drawOrderMap["offsets"];
					var unchanged = [];
					unchanged.length = slotCount - offsets.length;
					var originalIndex = 0, unchangedIndex = 0;
					for (var ii = 0, nn = offsets.length; ii < nn; ii++) {
						var offsetMap = offsets[ii];
						var slotIndex = skeletonData.findSlotIndex(offsetMap["slot"]);
						if (slotIndex == -1) throw "Slot not found: " + offsetMap["slot"];
						// Collect unchanged items.
						while (originalIndex != slotIndex)
							unchanged[unchangedIndex++] = originalIndex++;
						// Set changed items.
						drawOrder[originalIndex + offsetMap["offset"]] = originalIndex++;
					}
					// Collect remaining unchanged items.
					while (originalIndex < slotCount)
						unchanged[unchangedIndex++] = originalIndex++;
					// Fill in unchanged items.
					for (var ii = slotCount - 1; ii >= 0; ii--)
						if (drawOrder[ii] == -1) drawOrder[ii] = unchanged[--unchangedIndex];
				}
				timeline.setFrame(frameIndex++, drawOrderMap["time"], drawOrder);
			}
			timelines.push(timeline);
			duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
		}

		skeletonData.animations.push(new spine.Animation(name, timelines, duration));
	}
};
spine.SkeletonJson.readCurve = function (timeline, frameIndex, valueMap) {
	var curve = valueMap["curve"];
	if (!curve) return;
	if (curve == "stepped")
		timeline.curves.setStepped(frameIndex);
	else if (curve instanceof Array)
		timeline.curves.setCurve(frameIndex, curve[0], curve[1], curve[2], curve[3]);
};
spine.SkeletonJson.toColor = function (hexString, colorIndex) {
	if (hexString.length != 8) throw "Color hexidecimal length must be 8, recieved: " + hexString;
	return parseInt(hexString.substring(colorIndex * 2, (colorIndex * 2) + 2), 16) / 255;
};

spine.Atlas = function (atlasText, textureLoader) {
	this.textureLoader = textureLoader;
	this.pages = [];
	this.regions = [];

	var reader = new spine.AtlasReader(atlasText);
	var tuple = [];
	tuple.length = 4;
	var page = null;
	while (true) {
		var line = reader.readLine();
		if (line == null) break;
		line = reader.trim(line);
		if (line.length == 0)
			page = null;
		else if (!page) {
			page = new spine.AtlasPage();
			page.name = line;

			page.format = spine.Atlas.Format[reader.readValue()];

			reader.readTuple(tuple);
			page.minFilter = spine.Atlas.TextureFilter[tuple[0]];
			page.magFilter = spine.Atlas.TextureFilter[tuple[1]];

			var direction = reader.readValue();
			page.uWrap = spine.Atlas.TextureWrap.clampToEdge;
			page.vWrap = spine.Atlas.TextureWrap.clampToEdge;
			if (direction == "x")
				page.uWrap = spine.Atlas.TextureWrap.repeat;
			else if (direction == "y")
				page.vWrap = spine.Atlas.TextureWrap.repeat;
			else if (direction == "xy")
				page.uWrap = page.vWrap = spine.Atlas.TextureWrap.repeat;

			textureLoader.load(page, line);

			this.pages.push(page);

		} else {
			var region = new spine.AtlasRegion();
			region.name = line;
			region.page = page;

			region.rotate = reader.readValue() == "true";

			reader.readTuple(tuple);
			var x = parseInt(tuple[0]);
			var y = parseInt(tuple[1]);

			reader.readTuple(tuple);
			var width = parseInt(tuple[0]);
			var height = parseInt(tuple[1]);

			region.u = x / page.width;
			region.v = y / page.height;
			if (region.rotate) {
				region.u2 = (x + height) / page.width;
				region.v2 = (y + width) / page.height;
			} else {
				region.u2 = (x + width) / page.width;
				region.v2 = (y + height) / page.height;
			}
			region.x = x;
			region.y = y;
			region.width = Math.abs(width);
			region.height = Math.abs(height);

			if (reader.readTuple(tuple) == 4) { // split is optional
				region.splits = [parseInt(tuple[0]), parseInt(tuple[1]), parseInt(tuple[2]), parseInt(tuple[3])];

				if (reader.readTuple(tuple) == 4) { // pad is optional, but only present with splits
					region.pads = [parseInt(tuple[0]), parseInt(tuple[1]), parseInt(tuple[2]), parseInt(tuple[3])];

					reader.readTuple(tuple);
				}
			}

			region.originalWidth = parseInt(tuple[0]);
			region.originalHeight = parseInt(tuple[1]);

			reader.readTuple(tuple);
			region.offsetX = parseInt(tuple[0]);
			region.offsetY = parseInt(tuple[1]);

			region.index = parseInt(reader.readValue());

			this.regions.push(region);
		}
	}
};
spine.Atlas.prototype = {
	findRegion: function (name) {
		var regions = this.regions;
		for (var i = 0, n = regions.length; i < n; i++)
			if (regions[i].name == name) return regions[i];
		return null;
	},
	dispose: function () {
		var pages = this.pages;
		for (var i = 0, n = pages.length; i < n; i++)
			this.textureLoader.unload(pages[i].rendererObject);
	},
	updateUVs: function (page) {
		var regions = this.regions;
		for (var i = 0, n = regions.length; i < n; i++) {
			var region = regions[i];
			if (region.page != page) continue;
			region.u = region.x / page.width;
			region.v = region.y / page.height;
			if (region.rotate) {
				region.u2 = (region.x + region.height) / page.width;
				region.v2 = (region.y + region.width) / page.height;
			} else {
				region.u2 = (region.x + region.width) / page.width;
				region.v2 = (region.y + region.height) / page.height;
			}
		}
	}
};

spine.Atlas.Format = {
	alpha: 0,
	intensity: 1,
	luminanceAlpha: 2,
	rgb565: 3,
	rgba4444: 4,
	rgb888: 5,
	rgba8888: 6
};

spine.Atlas.TextureFilter = {
	nearest: 0,
	linear: 1,
	mipMap: 2,
	mipMapNearestNearest: 3,
	mipMapLinearNearest: 4,
	mipMapNearestLinear: 5,
	mipMapLinearLinear: 6
};

spine.Atlas.TextureWrap = {
	mirroredRepeat: 0,
	clampToEdge: 1,
	repeat: 2
};

spine.AtlasPage = function () {};
spine.AtlasPage.prototype = {
	name: null,
	format: null,
	minFilter: null,
	magFilter: null,
	uWrap: null,
	vWrap: null,
	rendererObject: null,
	width: 0,
	height: 0
};

spine.AtlasRegion = function () {};
spine.AtlasRegion.prototype = {
	page: null,
	name: null,
	x: 0, y: 0,
	width: 0, height: 0,
	u: 0, v: 0, u2: 0, v2: 0,
	offsetX: 0, offsetY: 0,
	originalWidth: 0, originalHeight: 0,
	index: 0,
	rotate: false,
	splits: null,
	pads: null,
};

spine.AtlasReader = function (text) {
	this.lines = text.split(/\r\n|\r|\n/);
};
spine.AtlasReader.prototype = {
	index: 0,
	trim: function (value) {
		return value.replace(/^\s+|\s+$/g, "");
	},
	readLine: function () {
		if (this.index >= this.lines.length) return null;
		return this.lines[this.index++];
	},
	readValue: function () {
		var line = this.readLine();
		var colon = line.indexOf(":");
		if (colon == -1) throw "Invalid line: " + line;
		return this.trim(line.substring(colon + 1));
	},
	/** Returns the number of tuple values read (2 or 4). */
	readTuple: function (tuple) {
		var line = this.readLine();
		var colon = line.indexOf(":");
		if (colon == -1) throw "Invalid line: " + line;
		var i = 0, lastMatch= colon + 1;
		for (; i < 3; i++) {
			var comma = line.indexOf(",", lastMatch);
			if (comma == -1) {
				if (i == 0) throw "Invalid line: " + line;
				break;
			}
			tuple[i] = this.trim(line.substr(lastMatch, comma - lastMatch));
			lastMatch = comma + 1;
		}
		tuple[i] = this.trim(line.substring(lastMatch));
		return i + 1;
	}
};

spine.AtlasAttachmentLoader = function (atlas) {
	this.atlas = atlas;
};
spine.AtlasAttachmentLoader.prototype = {
	newAttachment: function (skin, type, name) {
		switch (type) {
		case spine.AttachmentType.boundingbox:
			return new spine.BoundingBoxAttachment(name);
		case spine.AttachmentType.region:
			var region = this.atlas.findRegion(name);
			if (!region) throw "Region not found in atlas: " + name + " (" + type + ")";
			var attachment = new spine.RegionAttachment(name);
			attachment.rendererObject = region;
			attachment.setUVs(region.u, region.v, region.u2, region.v2, region.rotate);
			attachment.regionOffsetX = region.offsetX;
			attachment.regionOffsetY = region.offsetY;
			attachment.regionWidth = region.width;
			attachment.regionHeight = region.height;
			attachment.regionOriginalWidth = region.originalWidth;
			attachment.regionOriginalHeight = region.originalHeight;
			return attachment;
		}
		throw "Unknown attachment type: " + type;
	}
};

spine.SkeletonBounds = function () {
	this.polygonPool = [];
	this.polygons = [];
	this.boundingBoxes = [];
};
spine.SkeletonBounds.prototype = {
	minX: 0, minY: 0, maxX: 0, maxY: 0,
	update: function (skeleton, updateAabb) {
		var slots = skeleton.slots;
		var slotCount = slots.length;
		var x = skeleton.x, y = skeleton.y;
		var boundingBoxes = this.boundingBoxes;
		var polygonPool = this.polygonPool;
		var polygons = this.polygons;
		
		boundingBoxes.length = 0;
		for (var i = 0, n = polygons.length; i < n; i++)
			polygonPool.push(polygons[i]);
		polygons.length = 0;

		for (var i = 0; i < slotCount; i++) {
			var slot = slots[i];
			var boundingBox = slot.attachment;
			if (boundingBox.type != spine.AttachmentType.boundingBox) continue;
			boundingBoxes.push(boundingBox);

			var poolCount = polygonPool.length;
			if (poolCount > 0) {
				polygon = polygonPool[poolCount - 1];
				polygonPool.splice(poolCount - 1, 1);
			} else
				polygon = [];
			polygons.push(polygon);

			polygon.length = boundingBox.vertices.length;
			boundingBox.computeWorldVertices(x, y, slot.bone, polygon);
		}

		if (updateAabb) this.aabbCompute();
	},
	aabbCompute: function () {
		var polygons = this.polygons;
		var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;
		for (var i = 0, n = polygons.length; i < n; i++) {
			var vertices = polygons[i];
			for (var ii = 0, nn = vertices.length; ii < nn; ii += 2) {
				var x = vertices[ii];
				var y = vertices[ii + 1];
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
		this.minX = minX;
		this.minY = minY;
		this.maxX = maxX;
		this.maxY = maxY;
	},
	/** Returns true if the axis aligned bounding box contains the point. */
	aabbContainsPoint: function (x, y) {
		return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
	},
	/** Returns true if the axis aligned bounding box intersects the line segment. */
	aabbIntersectsSegment: function (x1, y1, x2, y2) {
		var minX = this.minX, minY = this.minY, maxX = this.maxX, maxY = this.maxY;
		if ((x1 <= minX && x2 <= minX) || (y1 <= minY && y2 <= minY) || (x1 >= maxX && x2 >= maxX) || (y1 >= maxY && y2 >= maxY))
			return false;
		var m = (y2 - y1) / (x2 - x1);
		var y = m * (minX - x1) + y1;
		if (y > minY && y < maxY) return true;
		y = m * (maxX - x1) + y1;
		if (y > minY && y < maxY) return true;
		var x = (minY - y1) / m + x1;
		if (x > minX && x < maxX) return true;
		x = (maxY - y1) / m + x1;
		if (x > minX && x < maxX) return true;
		return false;
	},
	/** Returns true if the axis aligned bounding box intersects the axis aligned bounding box of the specified bounds. */
	aabbIntersectsSkeleton: function (bounds) {
		return this.minX < bounds.maxX && this.maxX > bounds.minX && this.minY < bounds.maxY && this.maxY > bounds.minY;
	},
	/** Returns the first bounding box attachment that contains the point, or null. When doing many checks, it is usually more
	 * efficient to only call this method if {@link #aabbContainsPoint(float, float)} returns true. */
	containsPoint: function (x, y) {
		var polygons = this.polygons;
		for (var i = 0, n = polygons.length; i < n; i++)
			if (this.polygonContainsPoint(polygons[i], x, y)) return this.boundingBoxes[i];
		return null;
	},
	/** Returns the first bounding box attachment that contains the line segment, or null. When doing many checks, it is usually
	 * more efficient to only call this method if {@link #aabbIntersectsSegment(float, float, float, float)} returns true. */
	intersectsSegment: function (x1, y1, x2, y2) {
		var polygons = this.polygons;
		for (var i = 0, n = polygons.length; i < n; i++)
			if (polygons[i].intersectsSegment(x1, y1, x2, y2)) return boundingBoxes[i];
		return null;
	},
	/** Returns true if the polygon contains the point. */
	polygonContainsPoint: function (polygon, x, y) {
		var nn = polygon.length;		
		var prevIndex = nn - 2;
		var inside = false;
		for (var ii = 0; ii < nn; ii += 2) {
			var vertexY = polygon[ii + 1];
			var prevY = polygon[prevIndex + 1];
			if ((vertexY < y && prevY >= y) || (prevY < y && vertexY >= y)) {
				var vertexX = polygon[ii];
				if (vertexX + (y - vertexY) / (prevY - vertexY) * (polygon[prevIndex] - vertexX) < x) inside = !inside;
			}
			prevIndex = ii;
		}
		return inside;
	},
	/** Returns true if the polygon contains the line segment. */
	intersectsSegment: function (polygon, x1, y1, x2, y2) {
		var nn = polygon.length;
		var width12 = x1 - x2, height12 = y1 - y2;
		var det1 = x1 * y2 - y1 * x2;
		var x3 = polygon[nn - 2], y3 = polygon[nn - 1];
		for (var ii = 0; ii < nn; ii += 2) {
			var x4 = polygon[ii], y4 = polygon[ii + 1];
			var det2 = x3 * y4 - y3 * x4;
			var width34 = x3 - x4, height34 = y3 - y4;
			var det3 = width12 * height34 - height12 * width34;
			var x = (det1 * width34 - width12 * det2) / det3;
			if (((x >= x3 && x <= x4) || (x >= x4 && x <= x3)) && ((x >= x1 && x <= x2) || (x >= x2 && x <= x1))) {
				var y = (det1 * height34 - height12 * det2) / det3;
				if (((y >= y3 && y <= y4) || (y >= y4 && y <= y3)) && ((y >= y1 && y <= y2) || (y >= y2 && y <= y1))) return true;
			}
			x3 = x4;
			y3 = y4;
		}
		return false;
	},
	getPolygon: function (attachment) {
		var index = this.boundingBoxes.indexOf(attachment);
		return index == -1 ? null : this.polygons[index];
	},
	getWidth: function () {
		return this.maxX - this.minX;
	},
	getHeight: function () {
		return this.maxY - this.minY;
	}
};

/*!
 *  howler.js v1.1.16
 *  howlerjs.com
 *
 *  (c) 2013-2014, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

(function() {
  // setup
  var cache = {};

  // setup the audio context
  var ctx = null,
    usingWebAudio = true,
    noAudio = false;
  if (typeof AudioContext !== 'undefined') {
    ctx = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
    ctx = new webkitAudioContext();
  } else if (typeof Audio !== 'undefined') {
    usingWebAudio = false;
    try {
      new Audio();
    } catch(e) {
      noAudio = true;
    }
  } else {
    usingWebAudio = false;
    noAudio = true;
  }

  // create a master gain node
  if (usingWebAudio) {
    var masterGain = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }

  // create global controller
  var HowlerGlobal = function() {
    this._volume = 1;
    this._muted = false;
    this.usingWebAudio = usingWebAudio;
    this._howls = [];
  };
  HowlerGlobal.prototype = {
    /**
     * Get/set the global volume for all sounds.
     * @param  {Float} vol Volume from 0.0 to 1.0.
     * @return {Howler/Float}     Returns self or current volume.
     */
    volume: function(vol) {
      var self = this;

      // make sure volume is a number
      vol = parseFloat(vol);

      if (vol >= 0 && vol <= 1) {
        self._volume = vol;

        if (usingWebAudio) {
          masterGain.gain.value = vol;
        }

        // loop through cache and change volume of all nodes that are using HTML5 Audio
        for (var key in self._howls) {
          if (self._howls.hasOwnProperty(key) && self._howls[key]._webAudio === false) {
            // loop through the audio nodes
            for (var i=0; i<self._howls[key]._audioNode.length; i++) {
              self._howls[key]._audioNode[i].volume = self._howls[key]._volume * self._volume;
            }
          }
        }

        return self;
      }

      // return the current global volume
      return (usingWebAudio) ? masterGain.gain.value : self._volume;
    },

    /**
     * Mute all sounds.
     * @return {Howler}
     */
    mute: function() {
      this._setMuted(true);

      return this;
    },

    /**
     * Unmute all sounds.
     * @return {Howler}
     */
    unmute: function() {
      this._setMuted(false);

      return this;
    },

    /**
     * Handle muting and unmuting globally.
     * @param  {Boolean} muted Is muted or not.
     */
    _setMuted: function(muted) {
      var self = this;

      self._muted = muted;

      if (usingWebAudio) {
        masterGain.gain.value = muted ? 0 : self._volume;
      }

      for (var key in self._howls) {
        if (self._howls.hasOwnProperty(key) && self._howls[key]._webAudio === false) {
          // loop through the audio nodes
          for (var i=0; i<self._howls[key]._audioNode.length; i++) {
            self._howls[key]._audioNode[i].muted = muted;
          }
        }
      }
    }
  };

  // allow access to the global audio controls
  var Howler = new HowlerGlobal();

  // check for browser codec support
  var audioTest = null;
  if (!noAudio) {
    audioTest = new Audio();
    var codecs = {
      mp3: !!audioTest.canPlayType('audio/mpeg;').replace(/^no$/, ''),
      opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
      ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
      wav: !!audioTest.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
      m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
      weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')
    };
  }

  // setup the audio object
  var Howl = function(o) {
    var self = this;

    // setup the defaults
    self._autoplay = o.autoplay || false;
    self._buffer = o.buffer || false;
    self._duration = o.duration || 0;
    self._format = o.format || null;
    self._loop = o.loop || false;
    self._loaded = false;
    self._sprite = o.sprite || {};
    self._src = o.src || '';
    self._pos3d = o.pos3d || [0, 0, -0.5];
    self._volume = o.volume !== undefined ? o.volume : 1;
    self._urls = o.urls || [];
    self._rate = o.rate || 1;

    // setup event functions
    self._onload = [o.onload || function() {}];
    self._onloaderror = [o.onloaderror || function() {}];
    self._onend = [o.onend || function() {}];
    self._onpause = [o.onpause || function() {}];
    self._onplay = [o.onplay || function() {}];

    self._onendTimer = [];

    // Web Audio or HTML5 Audio?
    self._webAudio = usingWebAudio && !self._buffer;

    // check if we need to fall back to HTML5 Audio
    self._audioNode = [];
    if (self._webAudio) {
      self._setupAudioNode();
    }

    // add this to an array of Howl's to allow global control
    Howler._howls.push(self);

    // load the track
    self.load();
  };

  // setup all of the methods
  Howl.prototype = {
    /**
     * Load an audio file.
     * @return {Howl}
     */
    load: function() {
      var self = this,
        url = null;

      // if no audio is available, quit immediately
      if (noAudio) {
        self.on('loaderror');
        return;
      }

      // loop through source URLs and pick the first one that is compatible
      for (var i=0; i<self._urls.length; i++) {        
        var ext, urlItem;

        if (self._format) {
          // use specified audio format if available
          ext = self._format;
        } else {
          // figure out the filetype (whether an extension or base64 data)
          urlItem = self._urls[i].toLowerCase().split('?')[0];
          ext = urlItem.match(/.+\.([^?]+)(\?|$)/);
          ext = (ext && ext.length >= 2) ? ext : urlItem.match(/data\:audio\/([^?]+);/);

          if (ext) {
            ext = ext[1];
          } else {
            self.on('loaderror');
            return;
          }
        }

        if (codecs[ext]) {
          url = self._urls[i];
          break;
        }
      }

      if (!url) {
        self.on('loaderror');
        return;
      }

      self._src = url;

      if (self._webAudio) {
        loadBuffer(self, url);
      } else {
        var newNode = new Audio();
        self._audioNode.push(newNode);

        // setup the new audio node
        newNode.src = url;
        newNode._pos = 0;
        newNode.preload = 'auto';
        newNode.volume = (Howler._muted) ? 0 : self._volume * Howler.volume();
       
        // add this sound to the cache
        cache[url] = self;

        // setup the event listener to start playing the sound
        // as soon as it has buffered enough
        var listener = function() {
          self._duration = newNode.duration;

          // setup a sprite if none is defined
          if (Object.getOwnPropertyNames(self._sprite).length === 0) {
            self._sprite = {_default: [0, self._duration * 1000]};
          }

          if (!self._loaded) {
            self._loaded = true;
            self.on('load');
          }

          if (self._autoplay) {
            self.play();
          }

          // clear the event listener
          newNode.removeEventListener('canplaythrough', listener, false);
        };
        newNode.addEventListener('canplaythrough', listener, false);
        newNode.load();
      }

      return self;
    },

    /**
     * Get/set the URLs to be pulled from to play in this source.
     * @param  {Array} urls  Arry of URLs to load from
     * @return {Howl}        Returns self or the current URLs
     */
    urls: function(urls) {
      var self = this;

      if (urls) {
        self.stop();
        self._urls = (typeof urls === 'string') ? [urls] : urls;
        self._loaded = false;
        self.load();

        return self;
      } else {
        return self._urls;
      }
    },

    /**
     * Play a sound from the current time (0 by default).
     * @param  {String}   sprite   (optional) Plays from the specified position in the sound sprite definition.
     * @param  {Function} callback (optional) Returns the unique playback id for this sound instance.
     * @return {Howl}
     */
    play: function(sprite, callback) {
      var self = this;

      // if no sprite was passed but a callback was, update the variables
      if (typeof sprite === 'function') {
        callback = sprite;
      }

      // use the default sprite if none is passed
      if (!sprite || typeof sprite === 'function') {
        sprite = '_default';
      }

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('load', function() {
          self.play(sprite, callback);
        });

        return self;
      }

      // if the sprite doesn't exist, play nothing
      if (!self._sprite[sprite]) {
        if (typeof callback === 'function') callback();
        return self;
      }

      // get the node to playback
      self._inactiveNode(function(node) {
        // persist the sprite being played
        node._sprite = sprite;

        // determine where to start playing from
        var pos = (node._pos > 0) ? node._pos : self._sprite[sprite][0] / 1000,
          duration = self._sprite[sprite][1] / 1000 - node._pos;

        // determine if this sound should be looped
        var loop = !!(self._loop || self._sprite[sprite][2]);

        // set timer to fire the 'onend' event
        var soundId = (typeof callback === 'string') ? callback : Math.round(Date.now() * Math.random()) + '',
          timerId;
        (function() {
          var data = {
            id: soundId,
            sprite: sprite,
            loop: loop
          };
          timerId = setTimeout(function() {
            // if looping, restart the track
            if (!self._webAudio && loop) {
              self.stop(data.id, data.timer).play(sprite, data.id);
            }

            // set web audio node to paused at end
            if (self._webAudio && !loop) {
              self._nodeById(data.id).paused = true;
              self._nodeById(data.id)._pos = 0;
            }

            // end the track if it is HTML audio and a sprite
            if (!self._webAudio && !loop) {
              self.stop(data.id, data.timer);
            }

            // fire ended event
            self.on('end', soundId);
          }, duration * 1000);

          // store the reference to the timer
          self._onendTimer.push(timerId);

          // remember which timer to cancel
          data.timer = self._onendTimer[self._onendTimer.length - 1];
        })();

        if (self._webAudio) {
          var loopStart = self._sprite[sprite][0] / 1000,
            loopEnd = self._sprite[sprite][1] / 1000;

          // set the play id to this node and load into context
          node.id = soundId;
          node.paused = false;
          refreshBuffer(self, [loop, loopStart, loopEnd], soundId);
          self._playStart = ctx.currentTime;
          node.gain.value = self._volume;

          if (typeof node.bufferSource.start === 'undefined') {
            node.bufferSource.noteGrainOn(0, pos, duration);
          } else {
            node.bufferSource.start(0, pos, duration);
          }
        } else {
          if (node.readyState === 4) {
            node.id = soundId;
            node.currentTime = pos;
            node.muted = Howler._muted;
            node.volume = self._volume * Howler.volume();
            setTimeout(function() { node.play(); }, 0);
          } else {
            self._clearEndTimer(timerId);

            (function(){
              var sound = self,
                playSprite = sprite,
                fn = callback,
                newNode = node;
              var listener = function() {
                sound.play(playSprite, fn);

                // clear the event listener
                newNode.removeEventListener('canplaythrough', listener, false);
              };
              newNode.addEventListener('canplaythrough', listener, false);
            })();

            return self;
          }
        }

        // fire the play event and send the soundId back in the callback
        self.on('play');
        if (typeof callback === 'function') callback(soundId);

        return self;
      });

      return self;
    },

    /**
     * Pause playback and save the current position.
     * @param {String} id (optional) The play instance ID.
     * @param {String} timerId (optional) Clear the correct timeout ID.
     * @return {Howl}
     */
    pause: function(id, timerId) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.pause(id);
        });

        return self;
      }

      // clear 'onend' timer
      self._clearEndTimer(timerId || 0);

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        activeNode._pos = self.pos(null, id);

        if (self._webAudio) {
          // make sure the sound has been created
          if (!activeNode.bufferSource) {
            return self;
          }

          activeNode.paused = true;
          if (typeof activeNode.bufferSource.stop === 'undefined') {
            activeNode.bufferSource.noteOff(0);
          } else {
            activeNode.bufferSource.stop(0);
          }
        } else {
          activeNode.pause();
        }
      }

      self.on('pause');

      return self;
    },

    /**
     * Stop playback and reset to start.
     * @param  {String} id  (optional) The play instance ID.
     * @param  {String} timerId  (optional) Clear the correct timeout ID.
     * @return {Howl}
     */
    stop: function(id, timerId) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.stop(id);
        });

        return self;
      }

      // clear 'onend' timer
      self._clearEndTimer(timerId || 0);

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        activeNode._pos = 0;

        if (self._webAudio) {
          // make sure the sound has been created
          if (!activeNode.bufferSource) {
            return self;
          }

          activeNode.paused = true;

          if (typeof activeNode.bufferSource.stop === 'undefined') {
            activeNode.bufferSource.noteOff(0);
          } else {
            activeNode.bufferSource.stop(0);
          }
        } else {
          activeNode.pause();
          activeNode.currentTime = 0;
        }
      }

      return self;
    },

    /**
     * Mute this sound.
     * @param  {String} id (optional) The play instance ID.
     * @return {Howl}
     */
    mute: function(id) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.mute(id);
        });

        return self;
      }

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        if (self._webAudio) {
          activeNode.gain.value = 0;
        } else {
          activeNode.volume = 0;
        }
      }

      return self;
    },

    /**
     * Unmute this sound.
     * @param  {String} id (optional) The play instance ID.
     * @return {Howl}
     */
    unmute: function(id) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.unmute(id);
        });

        return self;
      }

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        if (self._webAudio) {
          activeNode.gain.value = self._volume;
        } else {
          activeNode.volume = self._volume;
        }
      }

      return self;
    },

    /**
     * Get/set volume of this sound.
     * @param  {Float}  vol Volume from 0.0 to 1.0.
     * @param  {String} id  (optional) The play instance ID.
     * @return {Howl/Float}     Returns self or current volume.
     */
    volume: function(vol, id) {
      var self = this;

      // make sure volume is a number
      vol = parseFloat(vol);

      if (vol >= 0 && vol <= 1) {
        self._volume = vol;

        // if the sound hasn't been loaded, add it to the event queue
        if (!self._loaded) {
          self.on('play', function() {
            self.volume(vol, id);
          });

          return self;
        }

        var activeNode = (id) ? self._nodeById(id) : self._activeNode();
        if (activeNode) {
          if (self._webAudio) {
            activeNode.gain.value = vol;
          } else {
            activeNode.volume = vol * Howler.volume();
          }
        }

        return self;
      } else {
        return self._volume;
      }
    },

    /**
     * Get/set whether to loop the sound.
     * @param  {Boolean} loop To loop or not to loop, that is the question.
     * @return {Howl/Boolean}      Returns self or current looping value.
     */
    loop: function(loop) {
      var self = this;

      if (typeof loop === 'boolean') {
        self._loop = loop;

        return self;
      } else {
        return self._loop;
      }
    },

    /**
     * Get/set sound sprite definition.
     * @param  {Object} sprite Example: {spriteName: [offset, duration, loop]}
     *                @param {Integer} offset   Where to begin playback in milliseconds
     *                @param {Integer} duration How long to play in milliseconds
     *                @param {Boolean} loop     (optional) Set true to loop this sprite
     * @return {Howl}        Returns current sprite sheet or self.
     */
    sprite: function(sprite) {
      var self = this;

      if (typeof sprite === 'object') {
        self._sprite = sprite;

        return self;
      } else {
        return self._sprite;
      }
    },

    /**
     * Get/set the position of playback.
     * @param  {Float}  pos The position to move current playback to.
     * @param  {String} id  (optional) The play instance ID.
     * @return {Howl/Float}      Returns self or current playback position.
     */
    pos: function(pos, id) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('load', function() {
          self.pos(pos);
        });

        return typeof pos === 'number' ? self : self._pos || 0;
      }

      // make sure we are dealing with a number for pos
      pos = parseFloat(pos);

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        if (self._webAudio) {
          if (pos >= 0) {
            self.pause(id);
            activeNode._pos = pos;
            self.play(activeNode._sprite, id);

            return self;
          } else {
            return activeNode._pos + (ctx.currentTime - self._playStart);
          }
        } else {
          if (pos >= 0) {
            activeNode.currentTime = pos;

            return self;
          } else {
            return activeNode.currentTime;
          }
        }
      } else if (pos >= 0) {
        return self;
      } else {
        // find the first inactive node to return the pos for
        for (var i=0; i<self._audioNode.length; i++) {
          if (self._audioNode[i].paused && self._audioNode[i].readyState === 4) {
            return (self._webAudio) ? self._audioNode[i]._pos : self._audioNode[i].currentTime;
          }
        }
      }
    },

    /**
     * Get/set the 3D position of the audio source.
     * The most common usage is to set the 'x' position
     * to affect the left/right ear panning. Setting any value higher than
     * 1.0 will begin to decrease the volume of the sound as it moves further away.
     * NOTE: This only works with Web Audio API, HTML5 Audio playback
     * will not be affected.
     * @param  {Float}  x  The x-position of the playback from -1000.0 to 1000.0
     * @param  {Float}  y  The y-position of the playback from -1000.0 to 1000.0
     * @param  {Float}  z  The z-position of the playback from -1000.0 to 1000.0
     * @param  {String} id (optional) The play instance ID.
     * @return {Howl/Array}   Returns self or the current 3D position: [x, y, z]
     */
    pos3d: function(x, y, z, id) {
      var self = this;

      // set a default for the optional 'y' & 'z'
      y = (typeof y === 'undefined' || !y) ? 0 : y;
      z = (typeof z === 'undefined' || !z) ? -0.5 : z;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.pos3d(x, y, z, id);
        });

        return self;
      }

      if (x >= 0 || x < 0) {
        if (self._webAudio) {
          var activeNode = (id) ? self._nodeById(id) : self._activeNode();
          if (activeNode) {
            self._pos3d = [x, y, z];
            activeNode.panner.setPosition(x, y, z);
          }
        }
      } else {
        return self._pos3d;
      }

      return self;
    },

    /**
     * Fade a currently playing sound between two volumes.
     * @param  {Number}   from     The volume to fade from (0.0 to 1.0).
     * @param  {Number}   to       The volume to fade to (0.0 to 1.0).
     * @param  {Number}   len      Time in milliseconds to fade.
     * @param  {Function} callback (optional) Fired when the fade is complete.
     * @param  {String}   id       (optional) The play instance ID.
     * @return {Howl}
     */
    fade: function(from, to, len, callback, id) {
      var self = this,
        diff = Math.abs(from - to),
        dir = from > to ? 'down' : 'up',
        steps = diff / 0.01,
        stepTime = len / steps;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('load', function() {
          self.fade(from, to, len, callback, id);
        });

        return self;
      }

      // set the volume to the start position
      self.volume(from, id);

      for (var i=1; i<=steps; i++) {
        (function() {
          var change = self._volume + (dir === 'up' ? 0.01 : -0.01) * i,
            vol = Math.round(1000 * change) / 1000,
            toVol = to;

          setTimeout(function() {
            self.volume(vol, id);

            if (vol === toVol) {
              if (callback) callback();
            }
          }, stepTime * i);
        })();
      }
    },

    /**
     * [DEPRECATED] Fade in the current sound.
     * @param  {Float}    to      Volume to fade to (0.0 to 1.0).
     * @param  {Number}   len     Time in milliseconds to fade.
     * @param  {Function} callback
     * @return {Howl}
     */
    fadeIn: function(to, len, callback) {
      return this.volume(0).play().fade(0, to, len, callback);
    },

    /**
     * [DEPRECATED] Fade out the current sound and pause when finished.
     * @param  {Float}    to       Volume to fade to (0.0 to 1.0).
     * @param  {Number}   len      Time in milliseconds to fade.
     * @param  {Function} callback
     * @param  {String}   id       (optional) The play instance ID.
     * @return {Howl}
     */
    fadeOut: function(to, len, callback, id) {
      var self = this;

      return self.fade(self._volume, to, len, function() {
        if (callback) callback();
        self.pause(id);

        // fire ended event
        self.on('end');
      }, id);
    },

    /**
     * Get an audio node by ID.
     * @return {Howl} Audio node.
     */
    _nodeById: function(id) {
      var self = this,
        node = self._audioNode[0];

      // find the node with this ID
      for (var i=0; i<self._audioNode.length; i++) {
        if (self._audioNode[i].id === id) {
          node = self._audioNode[i];
          break;
        }
      }

      return node;
    },

    /**
     * Get the first active audio node.
     * @return {Howl} Audio node.
     */
    _activeNode: function() {
      var self = this,
        node = null;

      // find the first playing node
      for (var i=0; i<self._audioNode.length; i++) {
        if (!self._audioNode[i].paused) {
          node = self._audioNode[i];
          break;
        }
      }

      // remove excess inactive nodes
      self._drainPool();

      return node;
    },

    /**
     * Get the first inactive audio node.
     * If there is none, create a new one and add it to the pool.
     * @param  {Function} callback Function to call when the audio node is ready.
     */
    _inactiveNode: function(callback) {
      var self = this,
        node = null;

      // find first inactive node to recycle
      for (var i=0; i<self._audioNode.length; i++) {
        if (self._audioNode[i].paused && self._audioNode[i].readyState === 4) {
          callback(self._audioNode[i]);
          node = true;
          break;
        }
      }

      // remove excess inactive nodes
      self._drainPool();

      if (node) {
        return;
      }

      // create new node if there are no inactives
      var newNode;
      if (self._webAudio) {
        newNode = self._setupAudioNode();
        callback(newNode);
      } else {
        self.load();
        newNode = self._audioNode[self._audioNode.length - 1];
        newNode.addEventListener('loadedmetadata', function() {
          callback(newNode);
        });
      }
    },

    /**
     * If there are more than 5 inactive audio nodes in the pool, clear out the rest.
     */
    _drainPool: function() {
      var self = this,
        inactive = 0,
        i;

      // count the number of inactive nodes
      for (i=0; i<self._audioNode.length; i++) {
        if (self._audioNode[i].paused) {
          inactive++;
        }
      }

      // remove excess inactive nodes
      for (i=self._audioNode.length-1; i>=0; i--) {
        if (inactive <= 5) {
          break;
        }

        if (self._audioNode[i].paused) {
          // disconnect the audio source if using Web Audio
          if (self._webAudio) {
            self._audioNode[i].disconnect(0);
          }

          inactive--;
          self._audioNode.splice(i, 1);
        }
      }
    },

    /**
     * Clear 'onend' timeout before it ends.
     * @param  {Number} timerId The ID of the sound to be cancelled.
     */
    _clearEndTimer: function(timerId) {
      var self = this,
        timer = self._onendTimer.indexOf(timerId);

      // make sure the timer gets cleared
      timer = timer >= 0 ? timer : 0;

      if (self._onendTimer[timer]) {
        clearTimeout(self._onendTimer[timer]);
        self._onendTimer.splice(timer, 1);
      }
    },

    /**
     * Setup the gain node and panner for a Web Audio instance.
     * @return {Object} The new audio node.
     */
    _setupAudioNode: function() {
      var self = this,
        node = self._audioNode,
        index = self._audioNode.length;

      // create gain node
      node[index] = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
      node[index].gain.value = self._volume;
      node[index].paused = true;
      node[index]._pos = 0;
      node[index].readyState = 4;
      node[index].connect(masterGain);

      // create the panner
      node[index].panner = ctx.createPanner();
      node[index].panner.setPosition(self._pos3d[0], self._pos3d[1], self._pos3d[2]);
      node[index].panner.connect(node[index]);

      return node[index];
    },

    /**
     * Call/set custom events.
     * @param  {String}   event Event type.
     * @param  {Function} fn    Function to call.
     * @return {Howl}
     */
    on: function(event, fn) {
      var self = this,
        events = self['_on' + event];

      if (typeof fn === "function") {
        events.push(fn);
      } else {
        for (var i=0; i<events.length; i++) {
          if (fn) {
            events[i].call(self, fn);
          } else {
            events[i].call(self);
          }
        }
      }

      return self;
    },

    /**
     * Remove a custom event.
     * @param  {String}   event Event type.
     * @param  {Function} fn    Listener to remove.
     * @return {Howl}
     */
    off: function(event, fn) {
      var self = this,
        events = self['_on' + event],
        fnString = fn.toString();

      // loop through functions in the event for comparison
      for (var i=0; i<events.length; i++) {
        if (fnString === events[i].toString()) {
          events.splice(i, 1);
          break;
        }
      }

      return self;
    },

    /**
     * Unload and destroy the current Howl object.
     * This will immediately stop all play instances attached to this sound.
     */
    unload: function() {
      var self = this;

      // stop playing any active nodes
      var nodes = self._audioNode;
      for (var i=0; i<self._audioNode.length; i++) {
        // stop the sound if it is currently playing
        if (!nodes[i].paused) {
          self.stop(nodes[i].id);
        }

        if (!self._webAudio) {
           // remove the source if using HTML5 Audio
          nodes[i].src = '';
        } else {
          // disconnect the output from the master gain
          nodes[i].disconnect(0);
        }
      }

      // remove the reference in the global Howler object
      var index = Howler._howls.indexOf(self);
      if (index !== null && index >= 0) {
        Howler._howls.splice(index, 1);
      }

      // delete this sound from the cache
      delete cache[self._src];
      self = null;
    }

  };

  // only define these functions when using WebAudio
  if (usingWebAudio) {

    /**
     * Buffer a sound from URL (or from cache) and decode to audio source (Web Audio API).
     * @param  {Object} obj The Howl object for the sound to load.
     * @param  {String} url The path to the sound file.
     */
    var loadBuffer = function(obj, url) {
      // check if the buffer has already been cached
      if (url in cache) {
        // set the duration from the cache
        obj._duration = cache[url].duration;

        // load the sound into this object
        loadSound(obj);
      } else {
        // load the buffer from the URL
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          // decode the buffer into an audio source
          ctx.decodeAudioData(
            xhr.response,
            function(buffer) {
              if (buffer) {
                cache[url] = buffer;
                loadSound(obj, buffer);
              }
            },
            function(err) {
              obj.on('loaderror');
            }
          );
        };
        xhr.onerror = function() {
          // if there is an error, switch the sound to HTML Audio
          if (obj._webAudio) {
            obj._buffer = true;
            obj._webAudio = false;
            obj._audioNode = [];
            delete obj._gainNode;
            obj.load();
          }
        };
        try {
          xhr.send();
        } catch (e) {
          xhr.onerror();
        }
      }
    };

    /**
     * Finishes loading the Web Audio API sound and fires the loaded event
     * @param  {Object}  obj    The Howl object for the sound to load.
     * @param  {Objecct} buffer The decoded buffer sound source.
     */
    var loadSound = function(obj, buffer) {
      // set the duration
      obj._duration = (buffer) ? buffer.duration : obj._duration;

      // setup a sprite if none is defined
      if (Object.getOwnPropertyNames(obj._sprite).length === 0) {
        obj._sprite = {_default: [0, obj._duration * 1000]};
      }

      // fire the loaded event
      if (!obj._loaded) {
        obj._loaded = true;
        obj.on('load');
      }

      if (obj._autoplay) {
        obj.play();
      }
    };

    /**
     * Load the sound back into the buffer source.
     * @param  {Object} obj   The sound to load.
     * @param  {Array}  loop  Loop boolean, pos, and duration.
     * @param  {String} id    (optional) The play instance ID.
     */
    var refreshBuffer = function(obj, loop, id) {
      // determine which node to connect to
      var node = obj._nodeById(id);

      // setup the buffer source for playback
      node.bufferSource = ctx.createBufferSource();
      node.bufferSource.buffer = cache[obj._src];
      node.bufferSource.connect(node.panner);
      node.bufferSource.loop = loop[0];
      if (loop[0]) {
        node.bufferSource.loopStart = loop[1];
        node.bufferSource.loopEnd = loop[1] + loop[2];
      }
      node.bufferSource.playbackRate.value = obj._rate;
    };

  }

  /**
   * Add support for AMD (Asynchronous Module Definition) libraries such as require.js.
   */
  if (typeof define === 'function' && define.amd) {
    define('howler', function() {
      return {
        Howler: Howler,
        Howl: Howl
      };
    });
  }
  
  // define globally in case AMD is not available or available but not used
  window.Howler = Howler;
  window.Howl = Howl;
  
})();
/**
 *  @module Sugar
 *  @namespace modules.glue
 *  @desc Provides javascript sugar functions
 *  @copyright (C) SpilGames
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
                has(obj, 'set') && isFunction(obj.set) &&
                has(obj, 'transpose') && isFunction(obj.transpose) &&
                has(obj, 'add') && isFunction(obj.add) &&
                has(obj, 'multiply') && isFunction(obj.multiply)) {
                    return true;
            }
        },
        /**
         * Is a given value an array2d?
         * @param {Object}
         * @return {Boolean}
         */
        isArray2D = function (obj) {
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
        isArray2D: isArray2D,
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
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/baseobject',
    [
        'glue',
        'glue/math/vector',
        'glue/math/rectangle',
        'glue/math/dimension',
        'glue/math/matrix'
    ],
    function (Glue, Vector, Rectangle, Dimension, Matrix) {
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
                transformEvent = function (evt) {
                    // consideration: it might be too expensive to clone the event object
                    var e = Sugar.clone(evt),
                        positionVector = e.position.toMatrix(),
                        translateMatrix = Matrix(3, 3),
                        scaleMatrix = Matrix(3, 3),
                        rotateMatrix = Matrix(3, 3),
                        sin,
                        cos;
                    
                    /** 
                    * reverse transformation
                    */
                    // construct a translation matrix and apply to position vector
                    translateMatrix.set(2, 0, -position.x);
                    translateMatrix.set(2, 1, -position.y);
                    positionVector.multiply(translateMatrix);
                    // only scale/rotatable if there is a component
                    for (type in registrants.draw) {
                        if (type === 'rotatable') {
                            // construct a rotation matrix and apply to position vector
                            sin = Math.sin(-module.rotatable.getAngleRadian());
                            cos = Math.cos(-module.rotatable.getAngleRadian());
                            rotateMatrix.set(0, 0, cos);
                            rotateMatrix.set(1, 0, -sin);
                            rotateMatrix.set(0, 1, sin);
                            rotateMatrix.set(1, 1, cos);
                            positionVector.multiply(rotateMatrix);
                        }
                        if (type === 'scalable') {
                            // construct a scaling matrix and apply to position vector
                            scaleMatrix.set(0, 0, 1 / module.scalable.getScale().x);
                            scaleMatrix.set(1, 1, 1 / module.scalable.getScale().y);
                            positionVector.multiply(scaleMatrix);
                        }
                    }

                    e.position.x = positionVector.get(0, 0); 
                    e.position.y = positionVector.get(0, 1);

                    // pass parent
                    e.parent = evt;
                    return e;  
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

                        // translate back from origin before drawing children
                        context.translate(origin.x, origin.y);
                        // draw children
                        for (i = 0, l = children.length; i < l; ++i) {
                            children[i].draw(gameData);                            
                        }
                        
                        context.restore();
                    },
                    pointerDown: function (e) {
                        var i,
                            l = children.length,
                            childEvent,
                            pos;

                        callRegistrants('pointerDown', e);

                        if (l) {
                            childEvent = transformEvent(e);
                            // pass through children
                            for (i = 0; i < l; ++i) {
                                children[i].pointerDown(childEvent);
                            }
                        }
                    },
                    pointerMove: function (e) {
                        var i,
                            l = children.length,
                            childEvent,
                            pos;

                        callRegistrants('pointerMove', e);

                        if (l) {
                            childEvent = transformEvent(e);
                            // pass through children
                            for (i = 0; i < l; ++i) {
                                children[i].pointerMove(childEvent);
                            }
                        }
                    },
                    pointerUp: function (e) {
                        var i,
                            l = children.length,
                            childEvent,
                            pos;

                        callRegistrants('pointerUp', e);

                        if (l) {
                            childEvent = transformEvent(e);
                            // pass through children
                            for (i = 0; i < l; ++i) {
                                children[i].pointerUp(childEvent);
                            }
                        }
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
                    getParent: function () {
                        return parent;
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

/*
 *  @module Spineable
 *  @namespace component/plugin
 *  @desc Represents a spineable component (2d skeleton animations)
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
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
                toRadian = Math.PI / 180,
                moveToTarget = false;

            baseComponent.set({
                update: function (gameData) {
                    var deltaT = gameData.deltaT,
                        tarDeg,
                        curDeg,
                        finalSpeed,
                        distance,
                        self = object.rotatable;
                    
                    if (moveToTarget && angle !== targetAngle) {
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
                    moveToTarget = true;
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
                    moveToTarget = true;
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
                        return screens[name];
                    }
                }
            },
            toggleScreen = function (name, action, callback) {
                var screen,
                    objects,
                    i = 0,
                    l,
                    objectsHandled = 0,
                    objectHandled = function () {
                        objectsHandled++;
                        if (objectsHandled >= screen.getObjects().length + 1) {
                            if (action === 'show' && Sugar.isFunction(screen.onShow)) {
                                screen.onShow();
                            } else if (action === 'hide' && Sugar.isFunction(screen.onHide)) {
                                screen.onHide();
                            }
                            if (Sugar.isFunction(callback)) {
                                callback();
                            }
                        }
                    };

                if (Sugar.isString(name)) {
                    screen = getScreen(name);
                    if (action === 'show') {
                        Game.add(screen, objectHandled);
                        screen.setShown(true);
                    }
                    if (action === 'hide') {
                        Game.remove(screen, objectHandled);
                        screen.setShown(false);
                    }
                    objects = screen.getObjects();
                    l = objects.length;
                    for (i; i < l; ++i) {
                        if (action === 'show') {
                            Game.add(objects[i], objectHandled);
                        } else if (action === 'hide') {
                            Game.remove(objects[i], objectHandled);
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
                removeScreen: function (screen, callback) {
                    var screenName;
                    if (Sugar.isFunction(screen.getName) && Sugar.isObject(screen)) {
                        screenName = screen.getName();
                        toggleScreen(screenName, 'hide', callback);
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
                showScreen: function (name, callback) {
                    var activeScreenName;
                    if (Sugar.isString(name)) {
                        if (activeScreen !== null) {
                            activeScreenName = activeScreen.getName();
                            toggleScreen(activeScreenName, 'hide');    
                        }
                        toggleScreen(name, 'show', callback);
                    }
                },
                /**
                 * Hide a screen
                 * @name hideScreen
                 * @memberOf Director
                 * @function
                 */
                hideScreen: function (name, callback) {
                    if (Sugar.isString(name)) {
                        toggleScreen(name, 'hide', callback);
                    }
                },
                /*
                 * Get the active screen
                 * @name getActiveScreen
                 * @memberOf Director
                 * @function
                 */
                getActiveScreen: function () {
                    return activeScreen;
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
                }
                gameData = {
                    canvas: canvas,
                    context: context2D,
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
                            if (component.update && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                                component.update(gameData);
                            }
                            if (component.draw) {
                                component.draw(gameData);
                            }
                        };
                    }
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
                            if (config.asset.remoteImage) {
                                Loader.setAssets(Loader.ASSET_TYPE_IMAGE_REMOTE, config.asset.remoteImage);
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
                        return context2D;
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
                    case module.ASSET_TYPE_IMAGE_REMOTE:
                        loadImage(name, source, assetLoadedHandler, assetErrorHandler);
                    break;
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
                ASSET_TYPE_IMAGE_REMOTE: 'remoteimage',
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

/**
 *  @module Array2D
 *  @namespace math
 *  @desc Represents a 2D array
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/array2d', [
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

/*
 *  @module Circle
 *  @namespace math
 *  @desc Represents a Circle
 *  @copyright (C) SpilGames
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
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/matrix', [
        'glue'
    ],
    function (Glue) {
        'use strict';
        var Sugar = Glue.sugar,
            module = function (width, height) {
                var mat = [],
                    n = Sugar.isDefined(width) ? width : 0,
                    m = Sugar.isDefined(height) ? height : 0,
                    i,
                    j,
                    set = function (x, y, value) {
                        mat[y * n + x] = value;
                    },
                    get = function (x, y) {
                        return mat[y * n + x];
                    };

                // initialize as identity matrix
                for (j = 0; j < m; ++j) {
                    for (i = 0; i < n; ++i) {
                        if (i === j) {
                            set(i, j, 1);
                        } else {
                            set(i, j, 0);
                        }
                    }
                }

                return {
                    /**
                     * Returns a string representation of the matrix (useful for debugging purposes)
                     */
                    stringify: function () {
                        var str = '',
                            row = '';
                        for (j = 0; j < m; ++j) {
                            for (i = 0; i < n; ++i) {
                                row += get(i, j) + '\t';
                            }
                            str += row + '\n';
                            row = '';
                        }
                        return str;
                    },
                    /**
                     * Get the value inside matrix
                     * @param {Number} x - x index
                     * @param {Number} y - y index
                     */
                    get: function (x, y) {
                        return get(x, y);
                    },
                    /**
                     * Set the value inside matrix
                     * @param {Number} x - x index
                     * @param {Number} y - y index
                     * @param {Number} value - new value
                     */
                    set: function (x, y, value) {
                        set(x, y, value);
                    },
                    /**
                     * Set the values inside matrix using an array
                     * If the matrix is 2x2 in size, then supplying an array with
                     * values [1, 2, 3, 4] will result in a matrix
                     * [1 2]
                     * [3 4]
                     * If the array has more elements than the matrix, the 
                     * rest of the array is ignored.
                     * @param {Array} array - array with Numbers
                     */
                    setValues: function (array) {
                        var l = Math.min(mat.length, array.length);
                        for (i = 0; i < l; ++i) {
                            mat[i] = array[i];
                        }
                        return this;
                    },
                    /**
                     * Get the matrix width
                     */
                    getWidth: function () {
                        return n;
                    },
                    /**
                     * Get the matrix height
                     */
                    getHeight: function () {
                        return m;
                    },
                    /**
                     * Iterate through matrix
                     */
                    iterate: function (callback) {
                        for (j = 0; j < m; ++j) {
                            for (i = 0; i < n; ++i) {
                                if (!Sugar.isFunction(callback)) {
                                    throw ('Please supply a callback function');
                                }
                                callback(i, j, get(i, j));
                            }
                        }
                    },
                    /**
                     * Transposes the current matrix
                     */
                    transpose: function () {
                        var newMat = [];
                        // reverse loop so m becomes n
                        for (i = 0; i < n; ++i) {
                            for (j = 0; j < m; ++j) {
                                newMat[i * m + j] = get(i, j);
                            }
                        }
                        // set new matrix
                        mat = newMat;
                        // swap width and height
                        m = [n, n = m][0];
                        return this;
                    },
                    /**
                     * Addition of another matrix
                     * @param {Matrix} matrix - matrix to add
                     */
                    add: function (matrix) {
                        if (m != matrix.getHeight() || n != matrix.getWidth()) {
                            throw 'Matrix sizes incorrect';
                        }
                        for (j = 0; j < m; ++j) {
                            for (i = 0; i < n; ++i) {
                                set(i, j, get(i, j) + matrix.get(i, j));
                            }
                        }
                        return this;
                    },
                    /**
                     * Multiply with another matrix
                     * If a new matrix C is the result of A * B = C
                     * then B is the current matrix and becomes C, A is the input matrix
                     * @param {Matrix} matrix - input matrix to multiply with
                     */
                    multiply: function (matrix) {
                        var newMat = [],
                            newWidth = n, // B.n
                            oldHeight = m, // B.m
                            newHeight = matrix.getHeight(), // A.m
                            oldWidth = matrix.getWidth(), // A.n
                            newValue = 0,
                            k;
                        if (oldHeight != oldWidth) {
                            throw 'Matrix sizes incorrect';
                        }

                        for (j = 0; j < newHeight; ++j) {
                            for (i = 0; i < newWidth; ++i) {
                                newValue = 0;
                                // loop through matrices
                                for (k = 0; k < oldWidth; ++k) {
                                    newValue += matrix.get(k, j) * get(i , k);
                                }
                                newMat[j * newWidth + i] = newValue;
                            }
                        }
                        // set to new matrix
                        mat = newMat;
                        // update matrix size
                        n = newWidth;
                        m = newHeight;
                        return this;
                    },
                    /**
                     * Returns a clone of the current matrix
                     */
                    clone: function () {
                        var newMatrix = module(n, m);
                        newMatrix.setValues(mat);
                        return newMatrix;
                    },
                    static: {
                        add: function (matrix1, matrix2) {
                            var matrix = matrix1.clone();
                            matrix.add(matrix2);
                            return matrix;
                        },
                        /**
                         * Multiply with 2 matrices
                         * Returns matric C if the multiplication is A * B = C
                         * @param {Matrix} matrix1 - matrix A
                         * @param {Matrix} matrix2 - matrix B
                         */
                        multiply: function (matrix1, matrix2) {
                            var matrix = matrix2.clone();
                            matrix.multiply(matrix1);
                            return matrix;
                        }
                    }
                };
            };
        return module;
    }
);
/**
 *  @module Polygon
 *  @namespace math
 *  @desc Represents a polygon
 *  @copyright (C) SpilGames
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
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/vector', [
        'glue/math'
    ],
    function (Mathematics) {
        'use strict';
        var module = function (x, y) {
            var math = Mathematics();

            return {
                x: x,
                y: y,
                get: function () {
                    return {
                        x: this.x,
                        y: this.y
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
                        (vector.y - this.y), (vector.x - this.x)
                    );
                },
                dotProduct: function (vector) {
                    return this.x * vector.x + this.y * vector.y;
                },
                distance: function (vector) {
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
                toMatrix: function () {
                        var matrix = math.Matrix(1, 3);
                        matrix.set(0, 0, this.x);
                        matrix.set(0, 1, this.y);
                        matrix.set(0, 2, 1);
                        return matrix;
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
    }
);
/**
 *  @module SAT (Separating Axis Theorem)
 *  @desc Handles the collision between two rectangles.
 *  @copyright (C) SpilGames
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
                     * Mixin object with new functionality
                     * @name add
                     * @memberOf screen
                     * @function
                     */
                    add: function (object) {
                        return Sugar.combine(this, object);
                    },
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
 *  @copyright (C) SpilGames
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
                has(obj, 'set') && isFunction(obj.set) &&
                has(obj, 'transpose') && isFunction(obj.transpose) &&
                has(obj, 'add') && isFunction(obj.add) &&
                has(obj, 'multiply') && isFunction(obj.multiply)) {
                    return true;
            }
        },
        /**
         * Is a given value an array2d?
         * @param {Object}
         * @return {Boolean}
         */
        isArray2D = function (obj) {
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
        isArray2D: isArray2D,
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
