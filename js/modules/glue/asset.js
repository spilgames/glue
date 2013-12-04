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
            image.src = _sImagePath + source
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
