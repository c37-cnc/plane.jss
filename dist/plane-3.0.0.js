/*!
 * C37 in 26-06-2014 at 14:42:22 
 *
 * plane version: 3.0.0
 * licensed by Creative Commons Attribution-ShareAlike 3.0
 *
 * Copyright - C37 http://c37.co - 2014
 */

(function (window) {
"use strict";
var define, require;

(function () { //http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
    var registry = {},
        seen = {};

    define = function (name, deps, callback) {
        registry[name] = {
            deps: deps,
            callback: callback
        };
    };

    require = function (name) {
        if (seen[name]) {
            return seen[name];
        }
        seen[name] = {};

        var mod = registry[name];
        if (!mod) {
            throw new Error("Module '" + name + "' not found.");
        }

        var deps = mod.deps,
            callback = mod.callback,
            reified = [],
            exports;

        for (var i = 0, l = deps.length; i < l; i++) {
            if (deps[i] === 'require') {
                reified.push(require);
            } else if (deps[i] === 'exports') {
                reified.push(exports = {});
            } else {
                reified.push(require(deps[i]));
            }
        }

        var value = callback.apply(this, reified);
        return seen[name] = exports || value;
    };
})();
define("geometric/bézier", ['require', 'exports'], function (require, exports) {


});
define("geometric/group", ['require', 'exports'], function (require, exports) {




});
define("geometric/intersection", ['require', 'exports'], function (require, exports) {

    var Polynomial = require('geometric/polynomial').Polynomial,
        Point = require('geometric/point');


    function Bezout(e1, e2) {
        var AB = e1[0] * e2[1] - e2[0] * e1[1];
        var AC = e1[0] * e2[2] - e2[0] * e1[2];
        var AD = e1[0] * e2[3] - e2[0] * e1[3];
        var AE = e1[0] * e2[4] - e2[0] * e1[4];
        var AF = e1[0] * e2[5] - e2[0] * e1[5];
        var BC = e1[1] * e2[2] - e2[1] * e1[2];
        var BE = e1[1] * e2[4] - e2[1] * e1[4];
        var BF = e1[1] * e2[5] - e2[1] * e1[5];
        var CD = e1[2] * e2[3] - e2[2] * e1[3];
        var DE = e1[3] * e2[4] - e2[3] * e1[4];
        var DF = e1[3] * e2[5] - e2[3] * e1[5];
        var BFpDE = BF + DE;
        var BEmCD = BE - CD;

        return new Polynomial(
            AB * BC - AC * AC,
            AB * BEmCD + AD * BC - 2 * AC * AE,
            AB * BFpDE + AD * BEmCD - AE * AE - 2 * AC * AF,
            AB * DF + AD * BFpDE - 2 * AE * AF,
            AD * DF - AF * AF
        );
    };


    function CircleLine(c, r, a1, a2) {
        var result,
            a = (a2.X - a1.X) * (a2.X - a1.X) + (a2.Y - a1.Y) * (a2.Y - a1.Y),
            b = 2 * ((a2.X - a1.X) * (a1.X - c.X) + (a2.Y - a1.Y) * (a1.Y - c.Y)),
            cc = c.X * c.X + c.Y * c.Y + a1.X * a1.X + a1.Y * a1.Y - 2 * (c.X * a1.X + c.Y * a1.Y) - r * r,
            deter = b * b - 4 * a * cc;

        if (deter < 0) {
            result = false;
        } else if (deter == 0) {
            result = false;
        } else {
            var e = Math.sqrt(deter),
                u1 = (-b + e) / (2 * a),
                u2 = (-b - e) / (2 * a);

            if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
                if ((u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1)) {
                    result = false;
                } else {
                    result = false;
                }
            } else {
                result = true;
            }
        }
        return result;
    };

    function CircleRectangle(c, r, p, h, w) {

        var rightBottom = Point.Create(p.X + w, p.Y),
            rightTop = Point.Create(p.X + w, p.Y + h),
            leftTop = Point.Create(p.X, p.Y + h),
            leftBottom = Point.Create(p.X, p.Y);

        var inter1 = CircleLine(c, r, rightBottom, rightTop);
        var inter2 = CircleLine(c, r, rightTop, leftTop);
        var inter3 = CircleLine(c, r, leftTop, leftBottom);
        var inter4 = CircleLine(c, r, leftBottom, rightBottom);

        return inter1 || inter2 || inter3 || inter4;
    };

    function CircleCircle(c1, r1, c2, r2) {
        var result;

        // Determine minimum and maximum radii where circles can intersect
        var r_max = r1 + r2;
        var r_min = Math.abs(r1 - r2);

        // Determine actual distance between circle circles
        var c_dist = c1.DistanceTo(c2);

        if (c_dist > r_max) {
            result = false;
        } else if (c_dist < r_min) {
            result = false;
        } else {
            result = {
                points: []
            };

            var a = (r1 * r1 - r2 * r2 + c_dist * c_dist) / (2 * c_dist);
            var h = Math.sqrt(r1 * r1 - a * a);
            var p = c1.InterpolationLinear(c2, a / c_dist);
            var b = h / c_dist;

            result.points.push(Point.Create(p.X - b * (c2.Y - c1.Y), p.Y + b * (c2.X - c1.X)));
            result.points.push(Point.Create(p.X + b * (c2.Y - c1.Y), p.Y - b * (c2.X - c1.X)));

        }

        return result;
    };

    function CircleArc(c, r1, ca, r2, as, ae, ck) {

        var intersection = CircleCircle(c, r1, ca, r2);

        if (intersection.points) {

            var radianStart = as / 360 * 2 * Math.PI,
                radianEnd = ae / 360 * 2 * Math.PI,
                radianMid = radianStart > radianEnd ? (radianStart - radianEnd) / 2 : (radianEnd - radianStart) / 2;

            var pointStart = Point.Create(ca.X + Math.cos(radianStart) * r2, ca.Y + Math.sin(radianStart) * r2),
                pointEnd = Point.Create(ca.X + Math.cos(radianEnd) * r2, ca.Y + Math.sin(radianEnd) * r2),
                pointMid = Point.Create(ca.X + Math.cos(radianMid) * r2, ck ? ca.Y - Math.sin(radianMid) * r2 : ca.Y + Math.sin(radianMid) * r2);

            var twoPi = (Math.PI + Math.PI);

            for (var i = 0; i <= intersection.points.length - 1; i++) {

                var pointDistance = intersection.points[i].DistanceTo(ca),
                    radius = r2;

                if (radius - 4 <= pointDistance && pointDistance <= radius + 4) {

                    var pointStartAngle = ca.AngleTo(pointStart),
                        pointMidAngle = ca.AngleTo(pointMid),
                        pointEndAngle = ca.AngleTo(pointEnd),
                        pointMouseAngle = ca.AngleTo(intersection.points[i]);

                    if (pointStartAngle <= pointMidAngle && pointMidAngle <= pointEndAngle) {
                        // 2014.06.24 - 14:33 - lilo - em observação
                        //                        if (ck) {
                        //                            return (pointStartAngle <= pointMouseAngle && pointMouseAngle <= pointEndAngle) ? true : false;
                        //                        } else {
                        //                            return (pointStartAngle <= pointMouseAngle && pointMouseAngle <= pointEndAngle) ? false : true;
                        //                        }
                        return (pointStartAngle <= pointMouseAngle && pointMouseAngle <= pointEndAngle) ? true : false;

                    } else if (pointEndAngle <= pointMidAngle && pointMidAngle <= pointStartAngle) {
                        if (ck) {
                            return (pointEndAngle <= pointMouseAngle && pointMouseAngle <= pointStartAngle) ? true : false;
                        } else {
                            return (pointEndAngle <= pointMouseAngle && pointMouseAngle <= pointStartAngle) ? false : true;
                        }
                    } else if (pointStartAngle <= pointMidAngle && pointEndAngle <= pointMidAngle) {
                        if (pointStartAngle < pointEndAngle) {
                            if (ck) {
                                return (pointStartAngle < pointMouseAngle && pointMouseAngle < pointEndAngle) ? false : true;
                            } else {
                                return (pointStartAngle < pointMouseAngle && pointMouseAngle < pointEndAngle) ? true : false;
                            }
                        } else if (pointEndAngle < pointStartAngle) {
                            return (pointEndAngle < pointMouseAngle && pointMouseAngle < pointStartAngle) ? false : true;
                        }
                    } else if (pointMidAngle <= pointStartAngle && pointMidAngle <= pointEndAngle) {
                        if (pointStartAngle < pointEndAngle) {
                            if (ck) {
                                return (pointStartAngle < pointMouseAngle && pointMouseAngle < pointEndAngle) ? false : true;
                            } else {
                                return (pointStartAngle < pointMouseAngle && pointMouseAngle < pointEndAngle) ? true : false;
                            }
                        } else if (pointEndAngle < pointStartAngle) {
                            return (pointEndAngle < pointMouseAngle && pointMouseAngle < pointStartAngle) ? false : true;
                        }
                    }

                }
                return false;
            };
        }
        return false;
    };


    function CircleEllipse(c1, ry1, rx1, c2, ry2, rx2) {

        var a = [ry1 * ry1, 0, rx1 * rx1, -2 * ry1 * ry1 * c1.X, -2 * rx1 * rx1 * c1.Y, ry1 * ry1 * c1.X * c1.X + rx1 * rx1 * c1.Y * c1.Y - rx1 * rx1 * ry1 * ry1];
        var b = [ry2 * ry2, 0, rx2 * rx2, -2 * ry2 * ry2 * c2.X, -2 * rx2 * rx2 * c2.Y, ry2 * ry2 * c2.X * c2.X + rx2 * rx2 * c2.Y * c2.Y - rx2 * rx2 * ry2 * ry2];

        var yPoly = Bezout(a, b);
        var yRoots = yPoly.getRoots();
        var epsilon = 1e-3;
        var norm0 = (a[0] * a[0] + 2 * a[1] * a[1] + a[2] * a[2]) * epsilon;
        var norm1 = (b[0] * b[0] + 2 * b[1] * b[1] + b[2] * b[2]) * epsilon;

        for (var Y = 0; Y < yRoots.length; Y++) {
            var xPoly = new Polynomial(
                a[0],
                a[3] + yRoots[Y] * a[1],
                a[5] + yRoots[Y] * (a[4] + yRoots[Y] * a[2])
            );
            var xRoots = xPoly.getRoots();

            for (var X = 0; X < xRoots.length; X++) {
                var test =
                    (a[0] * xRoots[X] + a[1] * yRoots[Y] + a[3]) * xRoots[X] +
                    (a[2] * yRoots[Y] + a[4]) * yRoots[Y] + a[5];
                if (Math.abs(test) < norm0) {
                    test =
                        (b[0] * xRoots[X] + b[1] * yRoots[Y] + b[3]) * xRoots[X] +
                        (b[2] * yRoots[Y] + b[4]) * yRoots[Y] + b[5];
                    if (Math.abs(test) < norm1) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    exports.CircleLine = CircleLine;
    exports.CircleRectangle = CircleRectangle;
    exports.CircleCircle = CircleCircle;
    exports.CircleArc = CircleArc;
    exports.CircleEllipse = CircleEllipse;
});
define("geometric/point", ['require', 'exports'], function (require, exports) {

    function Point(X, Y) {
        this.X = X;
        this.Y = Y;
    };

    Point.prototYpe = {
        Sum: function (point) {
            return new Point(this.X + point.X, this.Y + point.Y);
        },
        Subtract: function (point) {
            return new Point(this.X - point.X, this.Y - point.Y);
        },
        MultiplY: function (value) {
            return new Point(this.X * value, this.Y * value);
        },
        DistanceTo: function (point) {
            var dx = this.X - point.X;
            var dY = this.Y - point.Y;

            return Math.sqrt(dx * dx + dY * dY);
        },
        MidTo: function (point) {
            return new Point(this.X + (point.X - this.X) / 2, this.Y + (point.Y - this.Y) / 2);
        },
        AngleTo: function (point) {
            return Math.atan2(point.Y - this.Y, point.X - this.X);
        },
        InterpolationLinear: function (point, value) {
            return new Point(
                this.X + (point.X - this.X) * value,
                this.Y + (point.Y - this.Y) * value
            );
        }
    };

    function Create(X, Y) {
        return new Point(X, Y);
    };

    exports.Create = Create;

});
define("geometric/polynomial", ['require', 'exports'], function (require, exports) {

    function Polynomial() {
        this.init(arguments);
    }

    Polynomial.prototype.init = function (coefs) {
        this.coefs = new Array();

        for (var i = coefs.length - 1; i >= 0; i--)
            this.coefs.push(coefs[i]);

        this._variable = "t";
        this._s = 0;
    };

    Polynomial.prototype.simplify = function () {
        for (var i = this.getDegree(); i >= 0; i--) {
            if (Math.abs(this.coefs[i]) <= Polynomial.TOLERANCE)
                this.coefs.pop();
            else
                break;
        }
    };

    Polynomial.prototype.getDegree = function () {
        return this.coefs.length - 1;
    };

    Polynomial.prototype.getLinearRoot = function () {
        var result = new Array();
        var a = this.coefs[1];

        if (a != 0)
            result.push(-this.coefs[0] / a);

        return result;
    };

    Polynomial.prototype.getQuadraticRoots = function () {
        var results = new Array();

        if (this.getDegree() == 2) {
            var a = this.coefs[2];
            var b = this.coefs[1] / a;
            var c = this.coefs[0] / a;
            var d = b * b - 4 * c;

            if (d > 0) {
                var e = Math.sqrt(d);

                results.push(0.5 * (-b + e));
                results.push(0.5 * (-b - e));
            } else if (d == 0) {
                // really two roots with same value, but we only return one
                results.push(0.5 * -b);
            }
        }

        return results;
    };

    Polynomial.prototype.getCubicRoots = function () {
        var results = new Array();

        if (this.getDegree() == 3) {
            var c3 = this.coefs[3];
            var c2 = this.coefs[2] / c3;
            var c1 = this.coefs[1] / c3;
            var c0 = this.coefs[0] / c3;

            var a = (3 * c1 - c2 * c2) / 3;
            var b = (2 * c2 * c2 * c2 - 9 * c1 * c2 + 27 * c0) / 27;
            var offset = c2 / 3;
            var discrim = b * b / 4 + a * a * a / 27;
            var halfB = b / 2;

            if (Math.abs(discrim) <= Polynomial.TOLERANCE) discrim = 0;

            if (discrim > 0) {
                var e = Math.sqrt(discrim);
                var tmp;
                var root;

                tmp = -halfB + e;
                if (tmp >= 0)
                    root = Math.pow(tmp, 1 / 3);
                else
                    root = -Math.pow(-tmp, 1 / 3);

                tmp = -halfB - e;
                if (tmp >= 0)
                    root += Math.pow(tmp, 1 / 3);
                else
                    root -= Math.pow(-tmp, 1 / 3);

                results.push(root - offset);
            } else if (discrim < 0) {
                var distance = Math.sqrt(-a / 3);
                var angle = Math.atan2(Math.sqrt(-discrim), -halfB) / 3;
                var cos = Math.cos(angle);
                var sin = Math.sin(angle);
                var sqrt3 = Math.sqrt(3);

                results.push(2 * distance * cos - offset);
                results.push(-distance * (cos + sqrt3 * sin) - offset);
                results.push(-distance * (cos - sqrt3 * sin) - offset);
            } else {
                var tmp;

                if (halfB >= 0)
                    tmp = -Math.pow(halfB, 1 / 3);
                else
                    tmp = Math.pow(-halfB, 1 / 3);

                results.push(2 * tmp - offset);
                // really should return next root twice, but we return only one
                results.push(-tmp - offset);
            }
        }

        return results;
    };

    Polynomial.prototype.getQuarticRoots = function () {
        var results = new Array();

        if (this.getDegree() == 4) {
            var c4 = this.coefs[4];
            var c3 = this.coefs[3] / c4;
            var c2 = this.coefs[2] / c4;
            var c1 = this.coefs[1] / c4;
            var c0 = this.coefs[0] / c4;

            var resolveRoots = new Polynomial(
                1, -c2, c3 * c1 - 4 * c0, -c3 * c3 * c0 + 4 * c2 * c0 - c1 * c1
            ).getCubicRoots();
            var y = resolveRoots[0];
            var discrim = c3 * c3 / 4 - c2 + y;

            if (Math.abs(discrim) <= Polynomial.TOLERANCE) discrim = 0;

            if (discrim > 0) {
                var e = Math.sqrt(discrim);
                var t1 = 3 * c3 * c3 / 4 - e * e - 2 * c2;
                var t2 = (4 * c3 * c2 - 8 * c1 - c3 * c3 * c3) / (4 * e);
                var plus = t1 + t2;
                var minus = t1 - t2;

                if (Math.abs(plus) <= Polynomial.TOLERANCE) plus = 0;
                if (Math.abs(minus) <= Polynomial.TOLERANCE) minus = 0;

                if (plus >= 0) {
                    var f = Math.sqrt(plus);

                    results.push(-c3 / 4 + (e + f) / 2);
                    results.push(-c3 / 4 + (e - f) / 2);
                }
                if (minus >= 0) {
                    var f = Math.sqrt(minus);

                    results.push(-c3 / 4 + (f - e) / 2);
                    results.push(-c3 / 4 - (f + e) / 2);
                }
            } else if (discrim < 0) {
                // no roots
            } else {
                var t2 = y * y - 4 * c0;

                if (t2 >= -Polynomial.TOLERANCE) {
                    if (t2 < 0) t2 = 0;

                    t2 = 2 * Math.sqrt(t2);
                    t1 = 3 * c3 * c3 / 4 - 2 * c2;
                    if (t1 + t2 >= Polynomial.TOLERANCE) {
                        var d = Math.sqrt(t1 + t2);

                        results.push(-c3 / 4 + d / 2);
                        results.push(-c3 / 4 - d / 2);
                    }
                    if (t1 - t2 >= Polynomial.TOLERANCE) {
                        var d = Math.sqrt(t1 - t2);

                        results.push(-c3 / 4 + d / 2);
                        results.push(-c3 / 4 - d / 2);
                    }
                }
            }
        }

        return results;
    };

    Polynomial.prototype.getRoots = function () {
        var result;

        this.simplify();
        switch (this.getDegree()) {
        case 0:
            result = new Array();
            break;
        case 1:
            result = this.getLinearRoot();
            break;
        case 2:
            result = this.getQuadraticRoots();
            break;
        case 3:
            result = this.getCubicRoots();
            break;
        case 4:
            result = this.getQuarticRoots();
            break;
        default:
            result = new Array();
            // should try Newton's method and/or bisection
        }

        return result;
    };

    exports.Polynomial = Polynomial;

});
define("geometric/shape", ['require', 'exports'], function (require, exports) {

    var Types = require('utility/types'),
        Point = require('geometric/point'),
        Intersection = require('geometric/intersection');

    function Shape() {};

    Shape.prototype = {
        Rotate: function (Value) {
            return true;
        },
        get Scale() {
            return this._scale || 1;
        },
        set Scale(Value) {

            switch (this.Type) {
            case 'Arc':
                {
                    this.Point.X *= Value;
                    this.Point.Y *= Value;
                    this.Radius *= Value;

                    break;
                }
            case 'Circle':
                {
                    this.Point.X *= Value;
                    this.Point.Y *= Value;
                    this.Radius *= Value;

                    break;
                }
            case 'Ellipse':
                {
                    this.Point.X *= Value;
                    this.Point.Y *= Value;
                    this.RadiusX *= Value;
                    this.RadiusY *= Value;

                    break;
                }
            case 'Line':
                {
                    this.Points.forEach(function (Point) {
                        Point.X *= Value;
                        Point.Y *= Value;
                    });

                    break;
                }
            case 'Polygon':
                {
                    this.Points.forEach(function (Point) {
                        Point.X *= Value;
                        Point.Y *= Value;
                    });

                    break;
                }
            case 'Rectangle':
                {
                    this.Point.X *= Value;
                    this.Point.Y *= Value;
                    this.Height *= Value;
                    this.Width *= Value;

                    break;
                }
            }

            this._scale = Value;
        },
        MoveTo: function (Value) {

            Value = {
                X: Value.X,
                Y: Value.Y
            };

            if (this.Point) {
                this.Point = this.Point.Sum(Value);
            } else {
                for (var i = 0; i <= this.Points.length - 1; i++) {
                    this.Points[i] = this.Points[i].Sum(Value);
                }
            }
            return true;
        },
        Contains: function (PointMouse) {

            switch (this.Type) {
            case 'Line':
                {
                    var PointA = this.Points[0],
                        PointB = this.Points[1]

                    if (Intersection.CircleLine(PointMouse, 2, PointA, PointB))
                        return true;

                    break;
                }
            case 'Rectangle':
                {
                    if (Intersection.CircleRectangle(PointMouse, 2, this.Point, this.Height, this.Width))
                        return true;

                    break;
                }
            case 'Arc':
                {
                    PointMouse = Point.Create(PointMouse.X, PointMouse.Y);

                    if (Intersection.CircleArc(PointMouse, 2, this.Point, this.Radius, this.StartAngle, this.EndAngle, this.ClockWise))
                        return true;

                    break;
                }
            case 'Circle':
                {
                    PointMouse = Point.Create(PointMouse.X, PointMouse.Y);

                    if (Intersection.CircleCircle(PointMouse, 2, this.Point, this.Radius))
                        return true;

                    break;
                }
            case 'Ellipse':
                return (Intersection.CircleEllipse(PointMouse, 2, 2, this.Point, this.RadiusY, this.RadiusX))
            case 'Polygon':
                {
                    var PointA = null,
                        PointB = null;
                    
                    for (var i = 0; i < this.Points.length; i++) {

                        if (i + 1 == this.Points.length) {
                            PointA = this.Points[i];
                            PointB = this.Points[0];
                        } else {
                            PointA = this.Points[i];
                            PointB = this.Points[i + 1];
                        }

                        if (Intersection.CircleLine(PointMouse, 2, pointOrigin, pointDestination))
                            return true;
                    }
                    break;
                }
            default:
                break;
            }

            return false;
        },
        Render: function (Context2D, Zoom) {

            if (this.Status == 'Over') {
                Context2D.strokeStyle = 'rgb(61, 142, 193)';
            }

            if (this.Status == 'Selected') {

                Context2D.strokeStyle = 'rgb(68, 121, 154)';
                if (this.Point) {
                    Context2D.strokeRect(this.Point.X - (Math.round(2 * Zoom) / 2), this.Point.Y - (Math.round(2 * Zoom) / 2), Math.round(2 * Zoom), Math.round(2 * Zoom));
                }
                if (this.Points) {
                    this.Points.forEach(function (Point) {
                        Context2D.strokeRect(Point.X - (Math.round(2 * Zoom) / 2), Point.Y - (Math.round(2 * Zoom) / 2), Math.round(2 * Zoom), Math.round(2 * Zoom));
                    });
                }
            }

            switch (this.Type) {
            case 'Arc':
                {
                    Context2D.translate(this.Point.X, this.Point.Y);
                    Context2D.Arc(0, 0, this.Radius, (Math.PI / 180) * this.StartAngle, (Math.PI / 180) * this.EndAngle, this.ClockWise);

                    return true;
                }
            case 'Circle':
                {
                    Context2D.translate(this.Point.X, this.Point.Y);
                    Context2D.Arc(0, 0, this.Radius, 0, Math.PI * 2, true);

                    return true;
                }
            case 'Ellipse':
                {
                    Context2D.translate(this.Point.X, this.Point.Y);
                    Context2D.Ellipse(0, 0, this.RadiusX, this.RadiusY, 0, 0, Math.PI * 2)

                    return true;
                }
            case 'Line':
                {
                    // possivel personalização
                    if (this.Status && (this.Status != 'Over')) {
                        Context2D.lineWidth = (this.Style && this.Style.LineWidth) ? this.Style.LineWidth : Context2D.LineWidth;
                        Context2D.strokeStyle = (this.Style && this.Style.LineColor) ? this.Style.LineColor : Context2D.strokeStyle;
                    }

                    Context2D.moveTo(this.Points[0].X, this.Points[0].Y);
                    Context2D.lineTo(this.Points[1].X, this.Points[1].Y);

                    return true;
                }
            case 'Polygon':
                {
                    Context2D.moveTo(this.Points[0].X, this.Points[0].Y);

                    this.Points.forEach(function (Point) {
                        Context2D.LineTo(Point.X, Point.Y);
                    });
                    Context2D.closePath();

                    return true;
                }
            case 'Rectangle':
                {
                    Context2D.translate(this.Point.X, this.Point.Y);
                    Context2D.strokeRect(0, 0, this.Width, this.Height);

                    return true;
                }
            }

        },
        ToObject: function () {

            switch (this.Type) {
            case 'Arc':
                return {
                    Uuid: this.Uuid,
                    Type: this.Type,
                    Name: this.Name,
                    Locked: this.Locked,
                    Visible: this.Visible,
                    X: Types.Math.ParseFloat(this.Point.X, 5),
                    Y: Types.Math.ParseFloat(this.Point.Y, 5),
                    Radius: Types.Math.ParseFloat(this.Radius, 5),
                    StartAngle: Types.Math.ParseFloat(this.StartAngle, 5),
                    EndAngle: Types.Math.ParseFloat(this.EndAngle, 5),
                    ClockWise: this.ClockWise
                };
            case 'Circle':
                return {
                    Uuid: this.Uuid,
                    Type: this.Type,
                    Name: this.Name,
                    Locked: this.Locked,
                    Visible: this.Visible,
                    X: Types.Math.ParseFloat(this.Point.X, 5),
                    Y: Types.Math.ParseFloat(this.Point.Y, 5),
                    Radius: Types.Math.ParseFloat(this.Radius, 5)
                };
            case 'Ellipse':
                return {
                    Uuid: this.Uuid,
                    Type: this.Type,
                    Name: this.Name,
                    Locked: this.Locked,
                    Visible: this.Visible,
                    X: Types.Math.ParseFloat(this.Point.X, 5),
                    Y: Types.Math.ParseFloat(this.Point.Y, 5),
                    RadiusX: Types.Math.ParseFloat(this.RadiusX, 5),
                    RadiusY: Types.Math.ParseFloat(this.RadiusY, 5)
                };
            case 'Line':
                return {
                    Uuid: this.Uuid,
                    Type: this.Type,
                    Name: this.Name,
                    Locked: this.Locked,
                    Visible: this.Visible,
                    X: [Types.Math.ParseFloat(this.Points[0].X, 5), Types.Math.ParseFloat(this.Points[0].Y, 5)],
                    Y: [Types.Math.ParseFloat(this.Points[1].X, 5), Types.Math.ParseFloat(this.Points[1].Y, 5)]
                };
            case 'Polygon':
                return {
                    Uuid: this.Uuid,
                    Type: this.Type,
                    Name: this.Name,
                    Locked: this.Locked,
                    Visible: this.Visible,
                    X: Types.Math.ParseFloat(this.Point.X, 5),
                    Y: Types.Math.ParseFloat(this.Point.Y, 5),
                    Sides: this.Sides
                };
            case 'Rectangle':
                return {
                    Uuid: this.Uuid,
                    Type: this.Type,
                    Name: this.Name,
                    Locked: this.Locked,
                    Visible: this.Visible,
                    X: Types.Math.ParseFloat(this.Point.X, 5),
                    Y: Types.Math.ParseFloat(this.Point.Y, 5),
                    Height: Types.Math.ParseFloat(this.Height, 5),
                    Width: Types.Math.ParseFloat(this.Width, 5)
                };
            }

        }
    };


    var Arc = Types.Function.Inherits(function Arc(Attrs) {
        this.Uuid = Attrs.Uuid;
        this.Name = Attrs.Name;
        this.Locked = Attrs.Locked;
        this.Visible = Attrs.Visible;
        this.Status = Attrs.Status;

        this.Type = 'Arc';
        this.Point = Attrs.Point;
        this.Radius = Attrs.Radius;
        this.StartAngle = Attrs.StartAngle;
        this.EndAngle = Attrs.EndAngle;
        this.ClockWise = Attrs.ClockWise;
    }, Shape);

    var Circle = Types.Function.Inherits(function Circle(Attrs) {
        this.Uuid = Attrs.Uuid;
        this.Name = Attrs.Name;
        this.Locked = Attrs.Locked;
        this.Visible = Attrs.Visible;
        this.Status = Attrs.Status;

        this.Type = 'Circle';
        this.Point = Attrs.Point;
        this.Radius = Attrs.Radius;
    }, Shape);

    var Ellipse = Types.Function.Inherits(function Ellipse(Attrs) {
        this.Uuid = Attrs.Uuid;
        this.Name = Attrs.Name;
        this.Locked = Attrs.Locked;
        this.Visible = Attrs.Visible;
        this.Status = Attrs.Status;

        this.Type = 'Ellipse';
        this.Point = Attrs.Point;
        this.RadiusY = Attrs.RadiusY;
        this.RadiusX = Attrs.RadiusX;
    }, Shape);

    var Line = Types.Function.Inherits(function Line(Attrs) {
        this.Uuid = Attrs.Uuid;
        this.Name = Attrs.Name;
        this.Locked = Attrs.Locked;
        this.Visible = Attrs.Visible;
        this.Status = Attrs.Status;

        this.Type = 'Line';
        this.Points = Attrs.Points;
        this.Style = Attrs.Style;
    }, Shape);

    var Polygon = Types.Function.Inherits(function Polygon(Attrs) {
        this.Uuid = Attrs.Uuid;
        this.Name = Attrs.Name;
        this.Locked = Attrs.Locked;
        this.Visible = Attrs.Visible;
        this.Status = Attrs.Status;

        this.Type = 'Polygon';
        this.Point = Attrs.Point;
        this.Points = Attrs.Points;
        this.Sides = Attrs.Sides;
    }, Shape);

    var Rectangle = Types.Function.Inherits(function Rectangle(Attrs) {
        this.Uuid = Attrs.Uuid;
        this.Name = Attrs.Name;
        this.Locked = Attrs.Locked;
        this.Visible = Attrs.Visible;
        this.Status = Attrs.Status;

        this.Type = 'Rectangle';
        this.Point = Attrs.Point;
        this.Height = Attrs.Height;
        this.Width = Attrs.Width;
    }, Shape);


    function Create(Uuid, Type, X, Y, Style, Radius, StartAngle, EndAngle, ClockWise, Sides, Height, Width, RadiusY, RadiusX) {

        var Attrs = {
            Uuid: Uuid,
            Name: 'Shape '.concat(Uuid),
            Style: Style,
            Locked: false,
            Visible: true,
            Status: null
        };

        switch (Type) {
        case 'Line':
            {
                Attrs.Points = [Point.Create(X[0], X[1]), Point.Create(Y[0], Y[1])];
                return new Line(Attrs);
            }
        case 'Rectangle':
            {
                Attrs.Point = Point.Create(X, Y);
                Attrs.Height = Height;
                Attrs.Width = Width;
                return new Rectangle(Attrs);
            }
        case 'Arc':
            {
                Attrs.Point = Point.Create(X, Y);
                Attrs.Radius = Radius;
                Attrs.StartAngle = StartAngle;
                Attrs.EndAngle = EndAngle;
                Attrs.ClockWise = ClockWise;
                return new Arc(Attrs);
            }
        case 'Circle':
            {
                Attrs.Point = Point.Create(X, Y);
                Attrs.Radius = Radius;
                return new Circle(Attrs);
            }
        case 'Ellipse':
            {
                Attrs.Point = Point.Create(X, Y);
                Attrs.RadiusY = RadiusY;
                Attrs.RadiusX = RadiusX;
                return new Ellipse(Attrs);
            }
        case 'Polygon':
            {
                Attrs.Point = Point.Create(X, Y);
                Attrs.Points = [];
                Attrs.Sides = Sides;

                for (var i = 0; i < Sides; i++) {

                    var pointX = (Radius * Math.cos(((Math.PI * 2) / Sides) * i) + X),
                        pointY = (Radius * Math.sin(((Math.PI * 2) / Sides) * i) + Y);

                    Attrs['Points'].push(Point.Create(pointX, pointY));
                }

                return new Polygon(Attrs);
            }
        default:
            break;
        }

    }

    exports.Create = Create;
});
define("plane", ['require', 'exports'], function (require, exports) {

    var Version = '3.0.0',
        Authors = ['lilo@c37.co', 'ser@c37.co'];

    var Types = require('utility/types'),
        Import = require('utility/import');

    var LayerStore = new Types.Data.Dictionary(),
        ToolsStore = new Types.Data.Dictionary();

    var Layer = require('structure/layer'),
        Shape = require('geometric/shape'),
        Tools = require('structure/tools');

    var LayerActive = null,
        LayerGrid = null,
        ViewPort = null,
        Settings = null;


    var Plane = Types.Object.Extend(new Types.Object.Event(), {

        Initialize: function (Config) {
            // verificações para as configurações
            if (Config == null) {
                throw new Error('Plane - Initialize - Config is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
            }
            if (typeof Config == "function") {
                throw new Error('Plane - Initialize - Config is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
            }
            if (Config.ViewPort == null) {
                throw new Error('Plane - Initialize - Config is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
            }
            // verificações para as Configurações

            ViewPort = Config.ViewPort;

            Settings = Types.Object.Merge({
                MetricSystem: 'mm',
                BackgroundColor: 'rgb(255, 255, 255)',
                GridEnable: true,
                GridColor: 'rgb(218, 222, 215)'
            }, Config.Settings || {});

            // start em eventos
            ViewPort.onmousemove = function (Event) {
                if (LayerActive) {
                    Tools.Event.Notify('onMouseMove', {
                        Type: 'onMouseMove',
                        Position: Types.Graphic.MousePosition(ViewPort, {
                            X: Event.clientX,
                            Y: Event.clientY
                        }),
                        Shapes: LayerActive.Shapes.List(),
                        Scroll: Plane.Scroll,
                        Update: Plane.Update
                    });
                }
            };
            ViewPort.onclick = function (Event) {
                if (LayerActive) {
                    Tools.Event.Notify('onClick', {
                        Type: 'onClick',
                        Position: Types.Graphic.MousePosition(ViewPort, {
                            X: Event.clientX,
                            Y: Event.clientY
                        }),
                        Shapes: LayerActive.Shapes.List(),
                        Scroll: Plane.Scroll,
                        Update: Plane.Update
                    });
                }
            }
            // start em eventos

            GridDraw(Settings.GridEnable, ViewPort.clientHeight, ViewPort.clientWidth, Settings.GridColor, this.Zoom, this.Scroll);

            return true;
        },
        Update: function (LayerSystem) {

            var LayerStyle = LayerSystem ? LayerSystem.Style : LayerActive.Style,
                LayerShapes = LayerSystem ? LayerSystem.Shapes.List() : LayerActive.Shapes.List(),
                LayerRender = LayerSystem ? LayerSystem.Render : LayerActive.Render,
                Context2D = LayerRender.getContext('2d');

            // limpando o render
            Context2D.clearRect(0, 0, ViewPort.clientWidth, ViewPort.clientHeight);

            // style of layer
            Context2D.lineCap = LayerStyle.LineCap;
            Context2D.lineJoin = LayerStyle.LineJoin;

            // render para cada shape
            LayerShapes.forEach(function (Shape) {
                // save state of all Configuration
                Context2D.save();
                Context2D.beginPath();

                Shape.Render(Context2D, Plane.Zoom);

                Context2D.stroke();
                // restore state of all Configuration
                Context2D.restore();
            });

            return true;
        },
        Clear: function () {

            Plane.Scroll = {
                X: 0,
                Y: 0
            };
            Plane.Zoom = 1;

            Plane.Layer.Delete();

            GridDraw(Settings.GridEnable, ViewPort.clientHeight, ViewPort.clientWidth, Settings.GridColor, this.Zoom, this.Scroll);
            
            return true;
        },
        Layer: Types.Object.Extend(new Types.Object.Event(), {
            Create: function (Attrs) {

                Attrs = Types.Object.Union(Attrs, {
                    ViewPort: ViewPort
                });

                var layer = Layer.Create(Attrs);

                LayerStore.Add(layer.Uuid, layer);
                this.Active = layer.Uuid;

            },
            List: function (Selector) {
                return LayerStore.List();
            },
            Delete: function (value) {
                LayerStore.List().forEach(function (Layer) {
                    var Element = document.getElementById(Layer.Render.id);
                    if (Element && Element.parentNode) {
                        Element.parentNode.removeChild(Element);
                    }
                    LayerStore.Delete(Layer.Uuid);
                });
            },
            get Active() {
                return LayerActive || {};
            },
            set Active(value) {
                this.Notify('onDeactive', {
                    type: 'onDeactive',
                    layer: LayerActive
                });

                LayerActive = LayerStore.Find(value);

                this.Notify('onActive', {
                    type: 'onActive',
                    layer: LayerActive
                });
            }

        }),
        Shape: {
            Create: function (Attrs) {
                if ((typeof Attrs == "function") || (Attrs == null)) {
                    throw new Error('Shape - Create - Attrs is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
                }
                if (['polygon', 'rectangle', 'Line', 'arc', 'circle', 'ellipse'].indexOf(Attrs.type.toLowerCase()) == -1) {
                    throw new Error('Shape - Create - Type is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
                }
                if ((Attrs.x == undefined) || (Attrs.y == undefined)) {
                    throw new Error('Shape - Create - X and Y is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
                }

                Attrs = Types.Object.Merge({
                    Uuid: Types.Math.Uuid(9, 16)
                }, Attrs);

                var shape = Shape.Create(Attrs.Uuid, Attrs.Type, Attrs.X, Attrs.Y, Attrs.Style, Attrs.Radius, Attrs.StartAngle,
                    Attrs.EndAngle, Attrs.ClockWise, Attrs.Sides, Attrs.Height, Attrs.Width, Attrs.RadiusY, Attrs.RadiusX);

                LayerActive.Shapes.Add(shape.Uuid, shape);

                return true;
            }
        },
        Import: {
            FromJson: function (StringJson) {

                var PlaneObject = JSON.parse(StringJson);

                Plane.Clear();

                Settings = PlaneObject.Settings;
                Plane.Zoom = PlaneObject.Zoom;
                Plane.Scroll = PlaneObject.Scroll;

                PlaneObject.Layers.forEach(function (Layer) {

                    Plane.Layer.Create({
                        Uuid: Layer.Uuid,
                        Name: Layer.Name,
                        Locked: Layer.Locked,
                        Visible: Layer.Visible,
                        Style: Layer.Style
                    });

                    Layer.Shapes.forEach(function (Shape) {
                        Plane.Shape.Create(Shape);
                    });

                    Plane.Update();
                });

                return true;
            },
            FromSvg: null,
            FromDxf: function (StringDxf) {
                try {
                    Plane.Clear();

                    var StringJson = Import.FromDxf(StringDxf);
                    var ObjectDxf = JSON.parse(StringJson.replace(/u,/g, '').replace(/undefined,/g, ''));

                    if (StringJson) {
                        Plane.Layer.Create();
                        for (var prop in ObjectDxf) {
                            Plane.Shape.Create(ObjectDxf[prop]);
                        }
                        Plane.Update();
                    }

                } catch (error) {
                    alert(error);
                }
            },
            FromDwg: null
        },
        Export: {
            ToJson: function () {
                var PlaneObject = {
                    Settings: Settings,
                    Zoom: Types.Math.ParseFloat(Plane.Zoom, 5),
                    Scroll: Plane.Scroll,
                    Layers: LayerStore.List().map(function (Layer) {
                        var LayerObject = Layer.ToObject();

                        LayerObject.Shapes = LayerObject.Shapes.map(function (Shape) {
                            return Shape.ToObject();
                        });

                        return LayerObject;
                    })
                }
                return JSON.stringify(PlaneObject);
            }
        },
        get Zoom() {
            return this._zoom || 1;
        },
        set Zoom(value) {

            // Plane.Zoom /= .9;  - more
            // Plane.Zoom *= .9; - less

            GridDraw(Settings.GridEnable, ViewPort.clientHeight, ViewPort.clientWidth, Settings.GridColor, value, this.Scroll);

            var LayerActive = Plane.Layer.Active,
                ZoomFactor = value / Plane.Zoom;

            Plane.Layer.List().forEach(function (Layer) {

                Plane.Layer.Active = Layer.Uuid;

                Plane.Layer.Active.Shapes.List().forEach(function (Shape) {
                    Shape.Scale = ZoomFactor;
                });

                Plane.Update();
            });

            Plane.Layer.Active = LayerActive.Uuid;

            this._zoom = value;
        },
        get Scroll() {
            return this._scroll || {
                X: 0,
                Y: 0
            };
        },
        set Scroll(value) {

            var LayerActive = Plane.Layer.Active;
            var MoveFactor = {
                X: value.X + this.Scroll.X,
                Y: value.Y + this.Scroll.Y
            };

            value.X = value.X * this.Zoom;
            value.Y = value.Y * this.Zoom;

            GridDraw(Settings.GridEnable, ViewPort.clientHeight, ViewPort.clientWidth, Settings.GridColor, this.Zoom, MoveFactor);

            Plane.Layer.List().forEach(function (Layer) {

                Plane.Layer.Active = Layer.Uuid;

                Plane.Layer.Active.Shapes.List().forEach(function (Shape) {
                    Shape.MoveTo(value);
                });

                Plane.Update();
            });

            Plane.Layer.Active = LayerActive.Uuid;

            this._scroll = MoveFactor;
        }
    });


    function GridDraw(Enabled, Height, Width, Color, Zoom, Scroll) {

        if (!Enabled) return;

        if (!LayerGrid) {
            var Attrs = { // atributos para a layer do grid (sistema) 
                ViewPort: ViewPort,
                Name: 'System - Grid',
                Style: {
                    LineCap: 'butt',
                    LineJoin: 'miter',
                    BackgroundColor: Settings.BackgroundColor
                }
            };
            LayerGrid = Layer.Create(Attrs);
        } else {
            LayerGrid.Shapes = new Types.Data.Dictionary();
        }

        // calculos para o Zoom
        Width = Zoom > 1 ? Math.round(Width * Zoom) : Math.round(Width / Zoom);
        Height = Zoom > 1 ? Math.round(Height * Zoom) : Math.round(Height / Zoom);

        debugger;
        
        var LineBold = 0;
        if (Scroll.X > 0) {
            for (var X = (Scroll.X * Zoom); X >= 0; X -= (10 * Zoom)) {

                var ShapeGrid = Shape.Create(Types.Math.Uuid(9, 16), 'Line', [X, 0], [X, Height], {
                    LineColor: Color,
                    LineWidth: LineBold % 5 == 0 ? .8 : .3
                });

                LayerGrid.Shapes.Add(ShapeGrid.Uuid, ShapeGrid);
                LineBold++;
            }
        }

        LineBold = 0;
        for (var X = (Scroll.X * Zoom); X <= Width; X += (10 * Zoom)) {

            var ShapeGrid = Shape.Create(Types.Math.Uuid(9, 16), 'Line', [X, 0], [X, Height], {
                LineColor: Color,
                LineWidth: LineBold % 5 == 0 ? .8 : .3
            });

            LayerGrid.Shapes.Add(ShapeGrid.Uuid, ShapeGrid);
            LineBold++;
        }

        LineBold = 0;
        if (Scroll.Y > 0) {
            for (var Y = (Scroll.Y * Zoom); Y >= 0; Y -= (10 * Zoom)) {

                var ShapeGrid = Shape.Create(Types.Math.Uuid(9, 16), 'Line', [0, Y], [Width, Y], {
                    LineColor: Color,
                    LineWidth: LineBold % 5 == 0 ? .8 : .3
                });

                LayerGrid.Shapes.Add(ShapeGrid.Uuid, ShapeGrid);
                LineBold++;
            }
        }

        LineBold = 0;
        for (var Y = (Scroll.Y * Zoom); Y <= Height; Y += (10 * Zoom)) {

            var ShapeGrid = Shape.Create(Types.Math.Uuid(9, 16), 'Line', [0, Y], [Width, Y], {
                LineColor: Color,
                LineWidth: LineBold % 5 == 0 ? .8 : .3
            });

            LayerGrid.Shapes.Add(ShapeGrid.Uuid, ShapeGrid);
            LineBold++;
        }

        Plane.Update(LayerGrid);
    };


    exports.PlaneApi = Plane;
});
define("structure/layer", ['require', 'exports'], function (require, exports) {

    var Types = require('utility/types');

    var Layer = Types.Function.Inherits(function Layer(Attrs) {
        this.Uuid = Attrs.Uuid;
        this.Name = Attrs.Name;
        this.Locked = Attrs.Locked;
        this.Visible = Attrs.Visible;
        this.Style = Attrs.Style;
        this.Render = Attrs.Render;
        this.Shapes = Attrs.Shapes;
    }, Types.Object.Event);

    Layer.prototype.ToObject = function () {
        return {
            Uuid: this.Uuid,
            Name: this.Name,
            Locked: this.Locked,
            Visible: this.Visible,
            Style: this.Style,
            Shapes: this.Shapes.List()
        };
    }


    function Create(Attrs) {
        if (typeof Attrs == "function") {
            throw new Error('Layer - Create - Attrs is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
        }

        var Uuid = Types.Math.Uuid(9, 16);

        // montando o Render da Layer
        var Render = document.createElement('canvas');

        Render.id = Types.Math.Uuid(9, 16);
        Render.width = Attrs.ViewPort.clientWidth;
        Render.height = Attrs.ViewPort.clientHeight;

        Render.style.position = "absolute";
        Render.style.backgroundColor = (Attrs.Style && Attrs.Style.BackgroundColor) ? Attrs.Style.BackgroundColor : 'transparent';

        // sistema cartesiano de coordenadas
        var Context2D = Render.getContext('2d');
        Context2D.translate(0, Render.height);
        Context2D.scale(1, -1);

        // parametros para a nova Layer
        Attrs = Types.Object.Merge({
            Uuid: Uuid,
            Name: 'New Layer '.concat(Uuid),
            Style: {
                fillColor: 'rgb(0,0,0)',
                lineCap: 'butt',
                lineJoin: 'miter',
                lineWidth: .7,
                lineColor: 'rgb(0, 0, 0)',
            },
            Locked: false,
            Visible: true,
            Shapes: new Types.Data.Dictionary(),
            Render: Render
        }, Attrs);
        // parametros para a nova Layer

        // nova Layer
        var layer = new Layer(Attrs);

        // add em ViewPort
        Attrs.ViewPort.appendChild(layer.Render);

        return layer;
    }

    exports.Create = Create;

});
define("structure/tools", ['require', 'exports'], function (require, exports) {

    var Types = require('utility/types');

    var ToolStore = new Types.Data.Dictionary();

    //    var Tools = Object.Extend(new Object.Event(), {
    //
    //        this.uuid: null,
    //        this.name: '',
    //        get active() {
    //            return this._active;
    //        },
    //        set active(value) {
    //            this._active = value;
    //        }
    //
    //    });

    function Tool(attrs) {
        this.uuid = attrs.uuid;
        this.name = attrs.name;

        this.__defineGetter__('active', function () {
            return this._active || false;
        });
        this.__defineSetter__('active', function (value) {
            this.notify(value ? 'onActive' : 'onDeactive', {
                type: value ? 'onActive' : 'onDeactive',
                now: new Date().toISOString()

            });
            this._active = value;
        });

        utility.object.event.call(this);
    }
    Tool.prototype = Types.Object.Event.prototype;


    function Create(attrs) {
        if (typeof attrs == "function") {
            throw new Error('Tool - Create - Attrs is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
        }

        attrs = Types.Object.Merge({
            uuid: Types.Math.Uuid(9, 16),
            name: 'Tool '.concat(ToolStore.count())
        }, attrs);

        var tool = Tool.Create(attrs.uuid, attrs.name);

        toolStore.add(attrs.uuid, tool);

        return true;
    }

    var EventProxy = new Types.Object.Event();

    EventProxy.Listen('onMouseMove', function (Message) {
        Message.Shapes.forEach(function (Shape) {
            if (Shape.status != 'Selected') {
                Shape.status = Shape.Contains(Message.Position) ? 'Over' : 'Out';
            }
        });
        Message.Update();
    });

    EventProxy.Listen('onClick', function (Message) {
        Message.Shapes.forEach(function (Shape) {
            if (Shape.Contains(Message.Position)) {
                Shape.status = Shape.status != 'Selected' ? 'Selected' : 'Over' ;
            }
        });
        Message.Update();
    });


    exports.Event = EventProxy;
    exports.Create = Create;

});
define("utility/export", ['require', 'exports'], function (require, exports) {
    
    function ToJson (){
        return true;
    }
    
    function ToSvg (){
        return true;
    }
    
    function ToDxf (){
        return true;
    }
    
    function ToPng (){
        return true;
    }
    
    function ToPdf (){
        return true;
    }

    
    exports.ToJson = ToJson;
    exports.ToSvg = ToSvg;
    exports.ToDxf = ToDxf;
    exports.ToPng = ToPng;
    exports.ToPdf = ToPdf;

});
define("utility/import", ['require', 'exports'], function (require, exports) {

//    var Types = require('utility/types');
    
    function FromDxf(stringDxf) {
        
        
        if (!String.prototype.format) {
            String.prototype.format = function () {
                var args = arguments;
                return this.replace(/{(\d+)}/g, function (match, number) {
                    return typeof args[number] != 'undefined' ? args[number] : match;
                });
            };
        }

        if (!String.prototype.contains) {
            String.prototype.contains = function () {
                return String.prototype.indexOf.apply(this, arguments) !== -1;
            };
        }        
        
        
        

        function aaaa(dxfObject) {

            switch (dxfObject.type) {
            case 'LINE':
                {
                    var line = '{ "type": "line", "x": [{0}, {1}], "y": [{2}, {3}] }';
                    return line.format(dxfObject.x, dxfObject.y, dxfObject.x1, dxfObject.y1);
                }
            case 'CIRCLE':
                {
                    var circle = '{ "type": "circle", "x": {0}, "y": {1}, "radius": {2} }';
                    return circle.format(dxfObject.x, dxfObject.y, dxfObject.r);
                }
            case 'ARC':
                {
                    var arc = '{"type": "arc", "x": {0}, "y": {1}, "radius": {2},"startAngle": {3}, "endAngle": {4}, "clockWise": {5} }';
                    return arc.format(dxfObject.x, dxfObject.y, dxfObject.r, dxfObject.a0, dxfObject.a1, false);
                }
            case 'ELLIPSE':
                {
                    var ellipse = '{"type": "ellipse", "x": {0}, "y": {1}, "radiusY": {2},"radiusX": {3} }',
                        radiusX = Math.abs(dxfObject.x1),
                        radiusY = radiusX * dxfObject.r;

                    return ellipse.format(dxfObject.x, dxfObject.y, radiusY, radiusX);
                }
            }

        }

        var groupCodes = {
            0: 'entityType',
            2: 'blockName',
            10: 'x',
            11: 'x1',
            20: 'y',
            21: 'y1',
            40: 'r',
            50: 'a0',
            51: 'a1',
        };

        var supportedEntities = ['LINE', 'CIRCLE', 'ARC', 'ELLIPSE'];

        var counter = 0;
        var code = null;
        var isEntitiesSectionActive = false;
        var object = {};
        var svg = '',
            json = '[';

        // Normalize platform-specific newlines.
        stringDxf = stringDxf.replace(/\r\n/g, '\n');
        stringDxf = stringDxf.replace(/\r/g, '\n');

        stringDxf.split('\n').forEach(function (line) {

            line = line.trim();

            if (counter++ % 2 === 0) {
                code = parseInt(line);
            } else {
                var value = line;
                var groupCode = groupCodes[code];
                if (groupCode === 'blockName' && value === 'ENTITIES') {
                    isEntitiesSectionActive = true;
                } else if (isEntitiesSectionActive) {

                    if (groupCode === 'entityType') { // New entity starts.
                        if (object.type) {
                            json += json.substring(json.length - 1, json.length) == '[' ? '' : ',';
                            json += aaaa(object);
                        }

                        object = supportedEntities.indexOf(value) > -1 ? {
                            type: value
                        } : {};

                        if (value === 'ENDSEC') {
                            isEntitiesSectionActive = false;
                        }
                    } else if (object.type && typeof groupCode !== 'undefined') { // Known entity property recognized.
                        object[groupCode] = parseFloat(value);
                    }
                }
            }
        });

        return json += ']';
    }

    function FromDwg(stringDwg) {
        return true;
    }

    function FromJson(stringJson) {
        return true;
    }

    function FromSvg(stringSvg) {
        return true;
    }

    exports.FromDxf = FromDxf;
    exports.FromDwg = FromDwg;
    exports.FromJson = FromJson;
    exports.FromSvg = FromSvg;

});
define("utility/types", ['require', 'exports'], function (require, exports) {

    var Maths = {
        Uuid: function (length, radix) {
            // http://www.ietf.org/rfc/rfc4122.txt
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
                uuid = [],
                i;
            radix = radix || chars.length;

            if (length) {
                for (i = 0; i < length; i++) uuid[i] = chars[0 | Math.random() * radix];
            } else {
                var r;

                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';

                for (i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | Math.random() * 16;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
            }

            return uuid.join('').toLowerCase();
        },
        ParseFloat: function(float, decimal) {
            return Number(parseFloat(float).toFixed(decimal));
        }
    }

    var String = {

        Format: function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        },
        Contains: function () {
            return String.prototype.indexOf.apply(this, arguments) !== -1;
        }

    }

    var Graphic = {

        MousePosition: function (element, position) {
            var bb = element.getBoundingClientRect();

            var x = (position.x - bb.left) * (element.clientWidth / bb.width);
            var y = (position.y - bb.top) * (element.clientHeight / bb.height);

            // tradução para o sistema de coordenadas cartesiano
            y = (y - element.clientHeight) * -1;

            return {
                x: x,
                y: y
            };
        }

    }

    var Data = {

        Dictionary: (function () {

            function Dictionary() {
                this.store = new Array();
            }

            Dictionary.prototype = {
                Add: function (key, value) {
                    this.store[key] = value;
                },
                Find: function (key) {
                    return this.store[key];
                },
                Delete: function (key) {
                    delete this.store[key];
                },
                Count: function () {
                    return Object.keys(this.store).length;
                },
                List: function () {
                    var self = this;
                    return Object.keys(this.store).map(function (key) {
                        return self.store[key];
                    });
                }
            }

            return Dictionary;
        })()

    }

    var Functions = {
        Inherits: function (f, p) {
            f.prototype = new p();
            return f;
        }
    }

    var Objects = {
        /*
         * Copy the enumerable properties of p to o, and return o
         * If o and p have a property by the same name, o's property is overwritten
         * This function does not handle getters and setters or copy attributes
         */
        Extend: function (o, p) {
            for (var prop in p) { // For all props in p.
                Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(p, prop)); // Add the property to o.
            }
            return o;
        },
        /*
         * Copy the enumerable properties of p to o, and return o
         * If o and p have a property by the same name, o's property is left alone
         * This function does not handle getters and setters or copy attributes
         */
        Merge: function (o, p) {
            for (var prop in p) { // For all props in p
                if (o.hasOwnProperty[prop]) continue; // Except those already in o
                o[prop] = p[prop]; // Add the property to o
            }
            return o;
        },
        /*
         * Remove properties from o if there is not a property with the same name in p
         * Return o
         */
        Restrict: function (o, p) {
            for (var prop in o) { // For all props in o
                if (!(prop in p)) delete o[prop]; // Delete if not in p
            }
            return o;
        },
        /*
         * For each property of p, delete the property with the same name from o
         * Return o
         */
        Subtract: function (o, p) {
            for (var prop in p) { // For all props in p
                delete o[prop]; // Delete from o (deleting a nonexistent prop is harmless)
            }
            return o;
        },
        /* 
         * Return a new object that holds the properties of both o and p.
         * If o and p have properties by the same name, the values from o are used
         */
        Union: function (o, p) {
            return Objects.Extend(Objects.Extend({}, o), p);
        },
        /*
         * Return a new object that holds only the properties of o that also appear
         * in p. This is something like the intersection of o and p, but the values of
         * the properties in p are discarded
         */
        Intersection: function (o, p) {
            return Restrict(extend({}, o), p);
        },
        /*
         * Return an array that holds the names of the enumerable own properties of o
         */
        Keys: function (o) {
            if (typeof o !== "object") throw TypeError(); // Object argument required
            var result = []; // The array we will return
            for (var prop in o) { // For all enumerable properties
                if (o.hasOwnProperty(prop)) // If it is an own property
                    result.push(prop); // add it to the array.
            }
            return result; // Return the array.
        },
        Event: (function () {

            function Event() {
                this.listeners = {};
            }

            Event.prototype.Listen = function (event, handler) {
                if (this.listeners[event] === undefined) {
                    this.listeners[event] = [];
                }
                this.listeners[event].push(handler);
            };

            Event.prototype.Notify = function (event, data) {
                if (this.listeners[event] !== undefined) {
                    for (var callback in this.listeners[event]) {
                        this.listeners[event][callback].call(this, data);
                    }
                }
            };

            Event.prototype.Unlisten = function (event, handler) {
                if (this.listeners[event] !== undefined) {
                    var index = this.listeners[event].indexOf(handler);
                    if (index !== -1) {
                        this.listeners[event].splice(index, 1);
                    }
                }
            };

            return Event;

        })()
    }

    exports.Math = Maths;
    exports.String = String;
    exports.Graphic = Graphic;
    exports.Data = Data;
    exports.Object = Objects;
    exports.Function = Functions;
});
window.Plane = require("plane").PlaneApi;
})(window);