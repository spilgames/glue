glue.module.create('js/level/generator',
    [
        'glue/math',
        'js/level/chunks'
    ],
    function (
        Mathematics, 
        Chunks
    ) {
        var math = Mathematics(),
            module = {
                makeSequence: function (seed) {
                    var seedArray = seed.split(''),
                        newSeed = '',
                        index;
                    while (seedArray.length) {
                        index = Math.floor(math.random(0, seedArray.length));
                        newSeed += seedArray.splice(index, 1)
                    }
                    seed = newSeed;
                    return newSeed;
                },
                makeMap: function (seed) {
                    var map = [],
                        i,
                        len;
                    for (i = 0, len = seed.length; i < len; ++i) {
                        map[map.length] = Chunks[seed.charAt(i)];
                    }
                    return map;
                }
            };
        return module;
    }
);