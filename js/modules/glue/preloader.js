/*
 *  @module Preloader
 *  @desc Shows the glue progress bar
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/preloader', [
    'glue'
], function (Glue) {
    var Sugar = Glue.sugar,
        loader = document.getElementById('loader'),
        loadBar = document.getElementById('loadbar'),
        percentageBar = document.getElementById('percentagebar'),
        loadHandler = function (percentageLoaded) {
            if (loadBar !== null) {
                loadBar.style.width = percentageLoaded + '%';
            }
            if (percentageBar !== null) {
                percentageBar.innerHTML = percentageLoaded + '%';
            }
        },
        module = {
            onReady: function () {
                if (loader !== null) {
                    loader.style.display = 'none';
                }
            },
            onAssetLoad: function (percentage) {
                loadHandler(percentage);
            }
        };
    // init percent bar
    if (percentageBar !== null) {
        percentageBar.innerHTML = '0%';
    }

    return module;
});