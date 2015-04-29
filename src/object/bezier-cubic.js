(function (plane) {
    "use strict";

    var BezierCubic = plane.utility.object.inherits(function BezierCubic(attrs) {

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

        this.segments = [];
        this.bounds = null;

        this.status = null;
        this.style = null;

        this.points = attrs.points;

        this._initialize(attrs);

    }, plane.math.shape);

    BezierCubic.prototype._calculeSegments = function () {
        // https://github.com/MartinDoms/Splines/blob/master/cubicBezier.js

        var lineSegments = 50;

        var dot = function (v1, v2) {
            var sum = 0;
            for (var i = 0; i < v1.length; i++) {
                sum += v1[i] * v2[i];
            }
            return sum;
        };

        var cubicBezier = function (points, t) {
            var p0 = points[0];
            var p1 = points[1];
            var p2 = points[2];
            var p3 = points[3];
            var t3 = t * t * t;
            var t2 = t * t;

            var dx = dot([p0.x, p1.x, p2.x, p3.x], [(1 - t) * (1 - t) * (1 - t), 3 * (1 - t) * (1 - t) * t, 3 * (1 - t) * t2, t3]);
            var dy = dot([p0.y, p1.y, p2.y, p3.y], [(1 - t) * (1 - t) * (1 - t), 3 * (1 - t) * (1 - t) * t, 3 * (1 - t) * t2, t3]);

            return {
                x: dx,
                y: dy
            };
        };

        for (var j = 0; j < lineSegments + 1; j++) {
            this.segments.push(cubicBezier(this.points, j / lineSegments));
        }

        return true;

    };

    BezierCubic.prototype.fromSnap = function (point, distance) {

        for (var i = 0; i < this.points.length; i++) {
            if (point.distanceTo(this.points[i]) <= distance) {
                return {
                    status: true,
                    point: this.points[i]
                };
            }
        }

        return {
            status: false,
            point: null
        };

    };

    BezierCubic.prototype.toObject = function () {
        return {
            uuid: this.uuid,
            type: this.type,
            points: this.points.map(function (point) {
                return point.toObject();
            })
        };
    };


    plane.object['bezier-cubic'] = {
        create: function (attrs) {
            // 0 - verificação da chamada
            if (typeof attrs === 'function') {
                throw new Error('bezier cubic - create - attrs is not valid \n http://plane.c37.co/docs/errors.html#' + 'errorCode');
            }

            // 1 - verificações de quais atributos são usados


            // 2 - validações dos atributos deste tipo


            // 3 - conversões dos atributos
            attrs.points[0] = plane.point.create(attrs.points[0]);
            attrs.points[1] = plane.point.create(attrs.points[1]);
            attrs.points[2] = plane.point.create(attrs.points[2]);
            attrs.points[3] = plane.point.create(attrs.points[3]);

            // 4 - caso update de um shape não merge em segments
            delete attrs['segments'];
            
            // 5 - criando um novo shape do tipo arco
            return new BezierCubic(attrs);
        }
    };

})(c37.library.plane);