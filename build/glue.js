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

/**
 *  @module Sugar
 *  @namespace modules.glue
 *  @desc Provides javascript sugar functions
 *  @author Jeroen Reurings
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
var modules = modules || {};
modules.glue = modules.glue || {};

modules.glue.sugar = (function (win, doc) {
    'use strict';
    var i,
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
         * object, the property will be overwritten, so property two is
         * leading
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
                    if (this.isObject(obj2[prop])) {
                        obj1[prop] = clone(obj2[prop]);
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

        /**
         * Can be used to mix modules, to combine abilities
         * @name mix
         * @memberOf Object.prototype
         * @function
         * @param {Object} mixin: the object you want to throw in the mix
         */
         // there ain't no problem we can't fix, cause we can do it in the mix
        if (!Object.prototype.mix) {
            Object.prototype.mix = function (mixin) {
                var i,
                    self = this;

                // iterate over the mixin properties
                for (i in mixin) {
                    // if the current property belongs to the mixin
                    if (mixin.hasOwnProperty(i)) {
                        // add the property to the mix
                        self[i] = mixin[i];
                    }
                }
                // return the mixed object
                return self;
            };
        };

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

    return {
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

/**
 *  @module Glue
 *  @namespace adapters
 *  @desc Provides adapters to interface with native Glue functionality
 *  @copyright (C) 2013 SpilGames
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
        component: function () {
            var self = this;
            return {
               create: function (mixins, callback) {
                    var i,
                        l,
                        mixinModules,
                        mixed = {};
                    
                    self.module.get(mixins, function () {
                        mixinModules = Array.prototype.slice.call(arguments);
                        for (i = 0, l = mixinModules.length; i < l; ++i) {
                            mixinModules[i](mixed)
                        }
                        callback.call(self, mixed);
                    });
                }
            };
        }
    };
}(window, modules.glue));
/**
 *  @module Glue main
 *  @desc Provides an abstraction layer
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
(function () {
    var glue = (function (adapters) {
            'use strict';
            return {
                module: adapters.glue.module,
                sugar: adapters.glue.sugar,
                component: adapters.glue.component,
                game: adapters.glue.game
            };
        }(adapters));

    window.glue = {
        module: glue.module
    };
    window.game = {};
    glue.module.create('glue', function () {
        return glue;
    });
}());

/*
 *  @module Component
 *  @desc Represents a component
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component',
    [
        'glue'
    ],
    function (Glue) {
        return function () {
            var name = 'undefined',
                obj = {
                    add: function (value) {
                        this.mix(value);
                        return this;
                    }
                },
                mixins = Array.prototype.slice.call(arguments),
                mixin = null,
                l = mixins.length,
                i = 0;

            for (i; i < l; ++i) {
                mixin = mixins[i];
                mixin(obj);
            }
            return obj.mix({
                setName: function (value) {
                    name = value;
                },
                getName: function (value) {
                    return name;
                }
            })
        };
    }
);

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
        'glue/component/visible'
    ],
    function (Visible) {
        return function (obj) {
            var animationSettings,
                animations = {},
                currentAnimation,
                currentFrame = 0,
                frameCount = 1,
                fps = 60,
                timeBetweenFrames = 1 / fps,
                timeSinceLastFrame = timeBetweenFrames,
                frameWidth,
                startFrame,
                endFrame,
                image,
                setAnimation = function () {
                    if (!image) {
                        obj.visible.setImage(currentAnimation.image);
                        image = obj.visible.getImage();
                    }
                    frameCount = currentAnimation.endFrame - currentAnimation.startFrame;
                    timeBetweenFrames = currentAnimation.fps ?
                        1 / currentAnimation.fps :
                        1 / animationSettings.fps;
                    timeSinceLastFrame = timeBetweenFrames;
                    frameWidth = currentAnimation.frameCount ?
                        image.width / currentAnimation.frameCount :
                        image.width / animationSettings.frameCount;
                    startFrame = currentAnimation.startFrame - 1;
                    endFrame = currentAnimation.endFrame;
                    currentFrame = startFrame;
                },
                successCallback,
                errorCallback;

            obj = obj || {};
            Visible(obj);
            obj.animatable = {
                setup: function (settings) {
                    var animation;
                    if (settings) {
                        if (settings.animation) {
                            animationSettings = settings.animation;
                            if (settings.animation.animations) {
                                animations = settings.animation.animations;
                            }
                        }
                    }
                    obj.visible.setup(settings);
                    if (settings.image) {
                        image = settings.image;
                    }
                },
                update: function (deltaT) {
                    timeSinceLastFrame -= deltaT;
                    if (timeSinceLastFrame <= 0) {
                        timeSinceLastFrame = timeBetweenFrames;
                        ++currentFrame;
                        if (currentFrame === endFrame) {
                            currentFrame = startFrame;
                        }
                    }
                },
                draw: function (deltaT, context) {
                    var position = obj.visible.getPosition(),
                        sourceX = frameWidth * currentFrame;

                    //console.log(frameWidth, currentFrame);

                    //  Save the current context so we can only make changes to one graphic
                    context.save();
                    //  First we translate to the current x and y, so we can scale the image relative to that
                    context.translate(position.x, position.y);
                    //  Now we scale the image according to the scale (set in update function)
                    //context.scale(scale, scale);
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
                    context.restore();
                },
                setAnimation: function(name) {
                    if (animations[name]) {
                        currentAnimation = animations[name];
                        setAnimation();
                    }
                },
                getDimension: function () {
                    var dimension = obj.visible.getDimension();
                    dimension.width = frameWidth;
                    return dimension;
                },
                getBoundingBox: function () {
                    var rectangle = obj.visible.getBoundingBox();
                    rectangle.y2 = rectangle.y1 + frameWidth;
                    return rectangle;
                },
                getFrameWidth: function () {
                    return frameWidth;
                }
            };
            return obj;
        };
    }
);

/*
 *  @module Clickable
 *  @namespace component
 *  @desc Used to make a game component perfom an action when she's clicked
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/clickable',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            var isClicked = function (e) {
                    return obj.visible.getBoundingBox().hasPosition(e.position);
                },
                pointerDownHandler = function (e) {
                    if (isClicked(e) && obj.onClick) {
                        obj.onClick(e);
                    }
                },
                pointerUpHandler = function (e) {
                    if (isClicked(e) && obj.onClick) {
                        obj.onClick(e);
                    }
                };

            obj = obj || {};
            obj.clickable = {
                setup: function (settings) {

                },
                destroy: function () {

                },
                update: function (deltaT) {

                },
                pointerDown: function (e) {
                    pointerDownHandler(e);
                },
                pointerUp: function (e) {
                    pointerUpHandler(e);
                }
            };
            return obj;
        };
    }
);

/*
 *  @module Draggable
 *  @namespace component
 *  @desc Used to make a game entity draggable
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/draggable',
    [
        'glue',
        'glue/math/vector',
        'glue/event/system'
    ],
    function (Glue, Vector, Event) {
        var draggables = [],
            dragStartTimeout = 30;

        return function (obj) {
            var dragging = false,
                dragId,
                grabOffset = Vector(0, 0),
                isHeighestDraggable = function (obj) {
                    var i = 0,
                        l = draggables.length,
                        draggable,
                        result = true;

                    for (i; i < l; ++i) {
                        draggable = draggables[i];
                        if (draggable !== obj && draggable.z > obj.z) {
                            result = false;
                            break;
                        }
                    }
                    return result;
                },
                checkOnMe = function (e) {
                    return obj.visible.getBoundingBox().hasPosition(e.position);
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
                        draggables.push(obj);
                        setTimeout(function () {
                            if (isHeighestDraggable(obj)) {
                                dragging = true;
                                dragId = e.pointerId;
                                grabOffset = e.position.substract(obj.visible.getPosition());
                                if (obj.dragStart) {
                                    obj.dragStart(e);
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
                            obj.visible.setPosition(e.position.substract(grabOffset));
                            if (obj.dragMove) {
                                obj.dragMove(e);
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
                        Event.fire('draggable.drop', obj, e);
                        draggables = [];
                        dragId = undefined;
                        dragging = false;
                        if (obj.dragEnd) {
                            obj.dragEnd(e, function () {});
                        }
                        return false;
                    }
                };

            obj = obj || {};
            obj.draggable = {
                setup: function (settings) {

                },
                update: function (deltaT) {

                },
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
                }
            };
            return obj;
        };
    }
);

/*
 *  @module Droptarget
 *  @namespace component
 *  @desc Used to make a game entity behave as a droptarget
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/droptarget',
    [
        'glue',
        'glue/event/system'
    ],
    function (Glue, Event) {
        return function (obj) {
            var droppedOnMe = function (draggable, e) {
                    // TODO: add more methods (constants) to check on me
                    return obj.visible.getBoundingBox().hasPosition(e.position);
                },
                draggableDropHandler = function (draggable, e) {
                    if (droppedOnMe(obj, e) && obj.onDrop) {
                        obj.onDrop(draggable, e);
                    }
                };

            obj = obj || {};
            obj.droptarget = {
                setup: function (settings) {
                    Event.on('draggable.drop', draggableDropHandler);
                },
                destroy: function () {
                    Event.off('draggable.drop', draggableDropHandler);
                },
                update: function (deltaT) {

                }
            };
            return obj;
        };
    }
);

/*
 *  @module Hoverable
 *  @namespace component
 *  @desc Used to make a game component perfom an action when she's hovered over
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/hoverable',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            // TODO: add state constants
            var state = 'not hovered',
                isHovered = function (e) {
                    return obj.visible.getBoundingBox().hasPosition(e.position);
                },
                pointerMoveHandler = function (e) {
                    if (isHovered(e)) {
                        if (state === 'not hovered') {
                            if (obj.hoverOver) {
                                obj.hoverOver(e);
                            }
                            state = 'hovered';
                        }
                    } else {
                        if (state === 'hovered') {
                            if (obj.hoverOut) {
                                obj.hoverOut(e);
                            }
                            state = 'not hovered';
                        }
                    }
                };

            obj = obj || {};
            obj.hoverable = {
                setup: function (settings) {

                },
                destroy: function () {

                },
                update: function (deltaT) {

                },
                pointerMove: function (e) {
                    pointerMoveHandler(e);
                }
            };
            return obj;
        };
    }
);

/*
 *  @module Movable
 *  @namespace component
 *  @desc Represents an movable component
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/movable',
    [
        'glue',
        'glue/math/vector'
    ],
    function (Glue, Vector) {
        var Sugar = Glue.sugar;
        return function (component) {
            var position,
                targetPosition = null,
                moveSpeed = 100,
                atTarget = true,
                rotation = 0;

            component = component || {};
            component.movable = {
                update: function (deltaT) {
                    if (targetPosition !== null) {
                        var radian,
                            deltaX,
                            deltaY;

                        position = component.visible.getPosition();
                        deltaX = targetPosition.x - position.x,
                        deltaY = targetPosition.y - position.y;

                        // Pythagorean theorem : c = √( a2 + b2 )
                        // We stop moving if the remaining distance to the endpoint
                        // is smaller then the step iterator (moveSpeed * deltaT).
                        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < moveSpeed * deltaT) {
                            atTarget = true;
                            position = targetPosition;
                            component.visible.setPosition(position);
                        } else {
                            // Update the x and y position, using cos for x and sin for y
                            // and get the right speed by multiplying by the speed and delta time.
                            radian = Math.atan2(deltaY, deltaX);
                            position.x += Math.cos(radian) * moveSpeed * deltaT;
                            position.y += Math.sin(radian) * moveSpeed * deltaT;
                            rotation = radian * 180 / Math.PI;
                            component.visible.setPosition(position);                      
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
                }
            };
            return component;
        };
    }
);

/*
 *  @module Visible
 *  @namespace component
 *  @desc Represents a visible component
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 *
 *  Only when performance issues: Remove the need for getters and setters in visible
 */
glue.module.create(
    'glue/component/visible',
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
                };

            obj = obj || {};
            obj.visible = {
                setup: function (settings) {
                    if (settings) {
                        if (settings.image) {
                            image = settings.image;
                        }
                        image = settings.image;
                        if (settings.position) {
                            customPosition = settings.position;
                            // using proper rounding:
                            // http://jsperf.com/math-round-vs-hack/66
                            position = Vector(
                                Math.round(customPosition.x),
                                Math.round(customPosition.y)
                            );
                        }
                        if (settings.dimension) {
                            dimension = settings.dimension;
                        } else if (image) {
                            dimension = {
                                width: image.naturalWidth,
                                height: image.naturalHeight
                            };
                            rectangle = Rectangle(
                                position.x,
                                position.y,
                                position.x + dimension.width,
                                position.y + dimension.height
                            );
                        }
                    }
                },
                draw: function (deltaT, context) {
                    context.drawImage(image, position.x, position.y)
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
                setImage: function (value) {
                    image = value;
                    dimension = {
                        width: image.naturalWidth,
                        height: image.naturalHeight
                    };
                    updateRectangle();
                },
                getImage: function () {
                    return image;
                }
            };
            return obj;
        };
    }
);

/*
 *  @module System
 *  @namespace event
 *  @desc This module offers a very basic pub/sub system event system
 *  @copyright (C) 2013 SpilGames
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
        'glue/math/vector',
        'glue/event/system',
        'glue/loader'
    ],
    function (Glue, Vector, Event, Loader) {
        var Sugar = Glue.sugar,
            gameInfo,
            fps = 60,
            components = [],
            addedComponents = [],
            removedComponents = [],
            lastFrameTime = new Date().getTime(),
            canvas = null,
            canvasId,
            context2D = null,
            backBuffer = null,
            backBufferContext2D = null,
            canvasSupported = false,
            canvasDimension = null,
            canvasScale = {},
            win = null,
            doc = null,
            isRunning = false,
            debug = false,
            debugBar = null,
            fpsAccumulator = 0,
            fpsTicks = 0,
            fpsMaxAverage = 500000,
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
                components.sort(function(a, b) {
                    return a.z - b.z;
                });
            },
            addComponents = function () {
                var component;
                if (addedComponents.length) {
                    for (var i = 0; i < addedComponents.length; ++i) {
                        component = addedComponents[i];
                        if (component.init) {
                            component.init();
                        }
                        components.push(addedComponents[i]);
                    };
                    addedComponents = [];
                    sort();
                }
            },
            removeComponents = function () {
                var component;
                if (removedComponents.length) {
                    for (var i = 0; i < removedComponents.length; ++i) {
                        component = removedComponents[i];
                        if (component.destroy) {
                            component.destroy();
                        }
                        Sugar.removeObject(components, component);
                    };
                    removedComponents = [];
                }
            },
            redraw = function () {
                backBufferContext2D.clearRect(0, 0, backBuffer.width, backBuffer.height);
                context2D.clearRect(0, 0, canvas.width, canvas.height);
            }
            cycle = function (time) {
                var deltaT,
                    fps,
                    component,
                    avg;

                if (isRunning) {
                    requestAnimationFrame(cycle);
                }
                sort();

                if (canvasSupported) {
                    redraw();
                    removeComponents();
                    addComponents();

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
                        debugBar.innerHTML += '<br />version: 0.0.1 alpha';
                        debugBar.innerHTML += '<br />frame rate: ' + fps + ' fps';
                        debugBar.innerHTML += '<br />average frame rate: ' + avg + 'fps';
                        debugBar.innerHTML += '<br />components: ' + components.length;
                        if (gameInfo && gameInfo.name) {
                            debugBar.innerHTML += '<br />game name: ' + gameInfo.name;    
                        }
                    }
                    if (deltaT < 1) {
                        for (var i = 0; i < components.length; ++i) {
                            component = components[i];
                            if (component.update) {
                                component.update(deltaT);
                            }
                            if (component.draw) {
                                component.draw(deltaT, backBufferContext2D);
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

                for (i = 0, l = components.length; i < l; ++i) {
                    component = components[i];
                    if (component.pointerDown) {
                        component.pointerDown(e);
                    }
                }
            },
            pointerMove = function (e) {
                //console.log('Pointer move: ', e.position);
                var i,
                    l,
                    component;

                for (i = 0, l = components.length; i < l; ++i) {
                    component = components[i];
                    if (component.pointerMove) {
                        component.pointerMove(e);
                    }
                }
            },
            pointerUp = function (e) {
                //console.log('Pointer up: ', e.position);
                var i,
                    l,
                    component;

                for (i = 0, l = components.length; i < l; ++i) {
                    component = components[i];
                    if (component.pointerUp) {
                        component.pointerUp(e);
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
            };

        return {
            setup: function (config, onReady) {
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
                if (config.asset && config.asset.image && config.asset.image.path &&
                    config.asset.image.source) {
                    Loader.setAssetPath(config.asset.image.path);
                    Loader.setAssets(config.asset.image.source);
                    Loader.load(function () {
                        startup();
                        /*
                        if (config.canvas.color) {
                            backBufferContext2D.fillStyle = config.canvas.color;
                            backBufferContext2D.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        */
                        if (onReady) {
                            onReady();
                        }
                    });
                }
            },
            shutdown: function () {
                shutdown();
                isRunning = false;
            },
            add: function (component) {
                addedComponents.push(component);
            },
            remove: function (component) {
                removedComponents.push(component);
            },
            get: function (componentName) {
                var i,
                    l,
                    component;

                for (i = 0, l = components.length; i < l; ++i) {
                    component = components[i];
                    if (component.name === componentName) {
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
            getComponentCount: function () {
                return components.length;
            }
        };
    }
);

/*
 *  @module Loader
 *  @desc Used to load assets in the beginning of the game, shows a progress bar
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/loader',
    [
        'glue'
    ],
    function (Glue) {
        var loaded = false,
            assetCount = 0,
            loadCount = 0,
            assetPath = null,
            assets = null,
            loadedAssets = {},
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
            loadAsset = function (source) {
                var asset = new Image();
                asset.src = assetPath + source;
                asset.addEventListener('load', assetLoadedHandler, false);
                return asset;
            },
            obj = {
                setAssetPath: function (value) {
                    assetPath = value;
                },
                setAssets: function (value) {
                    assets = value;
                    for (asset in assets) {
                        if (assets.hasOwnProperty(asset)) {
                            ++assetCount;
                        }
                    }
                },
                load: function (onReady) {
                    if (percentageBar !== null) {
                        percentageBar.innerHTML = '0%';
                    }
                    completedHandler = onReady;
                    for (asset in assets) {
                        if (assets.hasOwnProperty(asset)) {
                            loadedAssets[asset] = loadAsset(assets[asset]);
                        }
                    }
                },
                isLoaded: function () {
                    return loaded;
                },
                getAssets: function () {
                    if (!loaded) {
                        throw('Assets are not loaded yet');
                    }
                    return loadedAssets;
                },
                getAsset: function (name) {
                    if (!loaded) {
                        throw('Asset ' + name + ' is not loaded yet');
                    }
                    return loadedAssets[name];
                }
            };

        return obj;
    }
);

/*
var AssetManager = function()
{
    var _oInstance = null;

    return new function()
    {
        this.Instance = function()
        {
            if ( _oInstance == null )
            {
                _oInstance = new AssetManager();
                _oInstance.constructor = null;
            }
            return _oInstance;
        }
    };

    function AssetManager()
    {
        var sources = {
            player_stand_up: 'stand-up.gif',
            player_stand_right: 'stand-right.gif',
            player_stand_down: 'stand-down.gif',
            player_stand_left: 'stand-left.gif',
            player_stand_down_left: 'stand-down-left.gif',
            player_stand_down_right: 'stand-down-right.gif',
            player_walk_up: 'stand-up.gif',
            player_walk_right: 'walk-right.gif',
            player_walk_down: 'stand-down.gif',
            player_walk_left: 'walk-left.gif'
        }
        var _sBasePath = '../../example/';
        var _sImagePath = _sBasePath + 'image/player/';

        var images = [];

        function _loadImage(source) {
            var image = new Image();
            image.src = _sImagePath + source;
            return image;
        };

        this.loadImages = function (callback) {
            var loadedImages = 0;
            var numImages = 0;
            for (var src in sources) {
                ++numImages;
            }

            for(var src in sources) {
                images[src] = new Image();
                images[src].onload = function() {
                    if (++loadedImages >= numImages) {
                        callback(images);
                    }
                };
                if (src !== 'mix')
                images[src].src = _sImagePath + sources[src];
            }
        }

        this.get = function( sName )
        {
            var oAsset = images[sName];
            if ( oAsset != null && oAsset != '' )
            {
                return oAsset;
            }
            return false;
        };

    };

}();
*/
/**
 *  @module Math
 *  @desc The math module
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math',
    [
        'glue/math/dimension',
        'glue/math/matrix',
        'glue/math/vector'
    ],
    function (Dimension, Matrix, Vector) {
        'use strict';
        return function () {
            return {
                Dimension: Dimension,
                Matrix: Matrix,
                Vector: Vector
            };
        };
    }
);

/**
 *  @module Dimension
 *  @namespace math
 *  @desc Represents a dimension
 *  @copyright (C) 2013 SpilGames
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
 *  @copyright (C) 2013 SpilGames
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
 *  @module Rectangle
 *  @namespace math
 *  @desc Represents a rectangle
 *  @copyright (C) 2013 SpilGames
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
                }
            };
        };
    }
);

/**
 *  @module Vector
 *  @namespace math
 *  @desc Represents a vector
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/vector', function () {
    'use strict';
    return function (x, y, z) {
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
            }
        };
    };
});

/**
 *  @module Sugar
 *  @namespace modules.glue
 *  @desc Provides javascript sugar functions
 *  @author Jeroen Reurings
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
var modules = modules || {};
modules.glue = modules.glue || {};

modules.glue.sugar = (function (win, doc) {
    'use strict';
    var i,
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
         * object, the property will be overwritten, so property two is
         * leading
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
                    if (this.isObject(obj2[prop])) {
                        obj1[prop] = clone(obj2[prop]);
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

        /**
         * Can be used to mix modules, to combine abilities
         * @name mix
         * @memberOf Object.prototype
         * @function
         * @param {Object} mixin: the object you want to throw in the mix
         */
         // there ain't no problem we can't fix, cause we can do it in the mix
        if (!Object.prototype.mix) {
            Object.prototype.mix = function (mixin) {
                var i,
                    self = this;

                // iterate over the mixin properties
                for (i in mixin) {
                    // if the current property belongs to the mixin
                    if (mixin.hasOwnProperty(i)) {
                        // add the property to the mix
                        self[i] = mixin[i];
                    }
                }
                // return the mixed object
                return self;
            };
        };

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

    return {
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
