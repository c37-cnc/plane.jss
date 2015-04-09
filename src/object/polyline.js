(function (plane) {
    "use strict";

    var Polyline = plane.utility.object.inherits(function Polyline(attrs) {
        /**
         * A Universally unique identifier for
         * a single instance of Object
         *
         * @property uuid
         * @type String
         * @default 'uuid'
         */
        this.uuid = null;
        this.type = null;
        this.name = null;

        this._segments = [];
        this.status = null;
        this.style = null;

        this.points = null;

        this._initialize(attrs);

    }, plane.math.shape);

    Polyline.prototype._calculeSegments = function () {

        this._segments = this.points;

        return true;
    };

    Polyline.prototype.fromSnap = function (point, distance) {


    };

    Polyline.prototype.toObject = function () {
        return {
            uuid: this.uuid,
            type: this.type,
            points: this.points.map(function (point) {
                return point.toObject();
            })
        };
    };


    plane.object.polyline = {
        create: function (attrs) {
            // 0 - verificação da chamada
            if (typeof attrs === 'function') {
                throw new Error('polyline - create - attrs is not valid \n http://plane.c37.co/docs/errors.html#' + 'errorCode');
            }

            // 1 - verificações de quais atributos são usados


            // 2 - validações dos atributos deste tipo


            // 3 - conversões dos atributos
            attrs.points = attrs.points.map(function (point) {
                return plane.point.create(point);
            });

            // 4 - caso update de um shape não merge em segments
            delete attrs['segments'];

            // 5 - criando um novo shape do tipo arco
            return new Polyline(attrs);
        }
    };

})(plane);