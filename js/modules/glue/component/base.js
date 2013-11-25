glue.module.create(
    'glue/component/base',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            obj = obj || {};
            obj.base = {
                update: function (deltaT) {
                    //console.log('update', deltaT);
                }
            };
            return obj;
        };
    }
);
