(function (plane) {
    "use strict";

    var _matrix = null;

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    Point.prototype = {
        sum: function (point) {
            return new Point(this.x + point.x, this.y + point.y);
        },
        subtract: function (point) {
            return new Point(this.x - point.x, this.y - point.y);
        },
        negate: function () {
            return new Point(-this.x, -this.y);
        },
        multiply: function (value) {
            return new Point(this.x * value, this.y * value);
        },
        distanceTo: function (point) {
            var dx = this.x - point.x;
            var dy = this.y - point.y;

            return Math.sqrt(dx * dx + dy * dy);
        },
        midTo: function (point) {
            return new Point(this.x + (point.x - this.x) / 2, this.y + (point.y - this.y) / 2);
        },
        angleTo: function (point) {
            return Math.atan2(point.y - this.y, point.x - this.x);
        },
        interpolationLinear: function (point, value) {
            return new Point(
                this.x + (point.x - this.x) * value,
                this.y + (point.y - this.y) * value
                );
        },
        minimum: function (point) {
            return new Point(Math.min(this.x, point.x), Math.min(this.y, point.y));
        },
        maximum: function (point) {
            return new Point(Math.max(this.x, point.x), Math.max(this.y, point.y));
        },
        // https://github.com/kangax/fabric.js/blob/master/src/point.class.js#L159
        equals: function (point) {
            return (this.x === point.x) && (this.y === point.y);
        },
        // https://github.com/kangax/fabric.js/blob/master/src/point.class.js#L177
        lessThan: function (point) {
            return (this.x <= point.x && this.y <= point.y);
        },
        // https://github.com/kangax/fabric.js/blob/master/src/point.class.js#L168
        less: function (point) {
            return (this.x < point.x && this.y < point.y);
        },
        // https://github.com/kangax/fabric.js/blob/master/src/point.class.js#L196
        greaterThan: function (point) {
            return (this.x >= point.x && this.y >= point.y);
        },
        // https://github.com/kangax/fabric.js/blob/master/src/point.class.js#L187
        greater: function (point) {
            return (this.x > point.x && this.y > point.y);
        },
        toJson: function () {
            return JSON.stringify(this);
            //            JSON.stringify(utility.string.format('[', []))
        },
        toObject: function () {
            return {
                x: plane.utility.math.parseFloat(this.x, 5),
                y: plane.utility.math.parseFloat(this.y, 5)
            };
        },
        toDocument: function () {

            var inDocument = new Point(this.x * _matrix.a + this.y * _matrix.b + _matrix.tx,
                this.x * _matrix.c + this.y * _matrix.d + _matrix.ty);

            // a inversão do eixo carteziano
            inDocument.y = (inDocument.y - plane.view.bounds.height) * -1;

            return  inDocument;

        }
    };

    plane.point = {
        _initialize: function (config) {

            _matrix = config.matrix;

            return true;
        },
        create: function () {

            if (arguments.length === 2 && (arguments[0] !== null && arguments[1] !== null)) {
                return new Point(arguments[0], arguments[1]);
            } else if (arguments.length === 1 && (plane.utility.conversion.toType(arguments[0]) === 'object') && (arguments[0].x !== null && arguments[0].y !== null)) {
                return new Point(arguments[0].x, arguments[0].y);
            } else if (arguments.length === 1 && (plane.utility.conversion.toType(arguments[0]) === 'array') && (arguments[0].length === 2)) {
                return new Point(arguments[0][0], arguments[0][1]);
            }

            throw new Error('point - create - attrs is not valid \n http://plane.c37.co/docs/errors.html#' + 'errorCode');

        }
    };

})(plane);