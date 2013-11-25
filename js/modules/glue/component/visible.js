glue.module.create(
    'glue/component/visible',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            obj = obj || {};
            obj.visible = {
                getName: function () {
                    return name;
                },
                update: function (deltaT) {

                },
                draw: function (deltaT, context) {

                }
            };
            return obj;
        };
    }
);
