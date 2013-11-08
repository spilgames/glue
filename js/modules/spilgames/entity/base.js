glue.module.create(
    'modules/spilgames/entity/base',
    [
        'glue'
    ],
    function (Glue) {
        return function (x, y, settings) {
            return {
                inject: function (extention) {
                    // get the base entity and extend it with a custom extention
                    var obj = Glue.entity.base().extend(extention);
                    // construct a new base entity instance
                    obj = new obj(x, y, settings);
                    // return the mixed object
                    return obj;
                }
            };
        };
    }
);
