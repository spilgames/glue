glue.module.create(
    'js/objects/tilemap',
    [
        'glue/math/vector',
        'glue/game',
        'js/objects/tile'
    ],
    function (
        Vector,
        Game,
        Tile
    ) {
        return function (array, x, y, maxWidth) {
            var list = [],
                deadZone = Game.canvas.getDimension(),
                object = {
                    x: x || 0,
                    y: y || 0,
                    count: 0,
                    draw: function (deltaT, context, scrolling) {
                        var i,
                            len,
                            tile;
                        this.count = 0;
                        for (i = 0, len = list.length; i < len; ++i) {
                            tile = list[i];
                            if (tile.position.x + tile.bounds.width > scrolling.x &&
                                tile.position.x < scrolling.x + deadZone.width &&
                                tile.position.y + tile.bounds.height > scrolling.y &&
                                tile.position.y < scrolling.y + deadZone.height) {
                                tile.draw(deltaT, context);
                                this.count++;
                            }
                        }
                    },
                    getList: function () {
                        return list;
                    }
                },
                ix,
                iy,
                lenx,
                leny,
                tile,
                pos,
                size,
                j,
                lenj,
                off = Vector(0, 0),
                accumy = 0,
                accumx = 0,
                maxRealWidth,
                count = 0;
            for (j = 0, lenj = array.length; j < lenj; ++j) {
                for (iy = 0, leny = array[j].length; iy < leny; ++iy) {
                    for (ix = 0, lenx = array[j][iy].length; ix < lenx; ++ix) {
                        if (array[j][iy][ix] > 0 ||
                            ((accumy == 0 && iy == 0) || 
                            (accumx == 0 && off.x == 0) || 
                            (count >= maxWidth - 1 && ix == lenx - 1) || 
                            (off.y / maxWidth >= array.length * (maxWidth + 1) && iy == leny - 1))) {
              
                            tile = Tile(x, y);
                            tile.init();
                            size = tile.kineticable.getDimension();
                            pos = tile.kineticable.getPosition();
                            pos.x += off.x + (size.width * ix);
                            pos.y += off.y + (size.height * iy);
                            list[list.length] = tile;
                        }
                        accumx++;
                    }
                    accumx = 0;
                }
                off.x += size.width * array[0][0].length;
                count++;
                if (!maxRealWidth) {
                    maxRealWidth = maxWidth * array[0][0].length * size.width;
                }
                if (off.x >= maxRealWidth) {
                    count = 0;
                    off.x = 0;
                    off.y += size.height * array[0].length;
                    accumy++;
                    accumx = 0;
                }
            }


            
            return object;
        };
    }
);