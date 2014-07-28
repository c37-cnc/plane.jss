define("plane", ['require', 'exports'], function (require, exports) {

    var version = '3.0.0',
        authors = ['lilo@c37.co', 'ser@c37.co'];

    var types = require('utility/types'),
        importer = require('utility/importer'),
        exporter = require('utility/exporter');

    var layerManager = require('structure/layer'),
        shapeManager = require('geometric/shape'),
        toolManager = require('structure/tool');

    var layerSystem = null,
        viewPort = null;

    var _zoom = 1,
        _scroll = {
            x: 0,
            y: 0
        },
        _settings = {
            metricSystem: 'mm',
            backgroundColor: 'rgb(255, 255, 255)',
            gridEnable: true,
            gridColor: 'rgb(218, 222, 215)'
        };


    function initialize(config) {
        if (config == null) {
            throw new Error('plane - initialize - config is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
        }
        if (typeof config == "function") {
            throw new Error('plane - initialize - config is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
        }
        if (config.viewPort == null) {
            throw new Error('plane - initialize - config is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
        }

        viewPort = config.viewPort;

        _settings = config.settings ? config.settings : _settings;

        gridDraw(viewPort.clientHeight, viewPort.clientWidth, _zoom, _scroll);

        toolManager.event.start({
            viewPort: viewPort
        });

        return true;
    }

    function clear() {
        // reset em scroll
        if ((scroll().x != 0) || (scroll().y != 0)) {
            scroll({
                x: 0,
                y: 0
            });
        };

        // reset em zoom
        if (zoom() != 1) {
            zoom(1);
        }

        // remove em layer system
        layerSystem = null;

        // remove em todas as layers
        layerManager.remove();

        return true;
    }

    function scroll(value) {
        if (value) {
            var layerActive = layerManager.active(),
                scrollFactor = {
                    x: value.x + _scroll.x,
                    y: value.y + _scroll.y
                };

            gridDraw(viewPort.clientHeight, viewPort.clientWidth, _zoom, scrollFactor);

            // Se não alguma Layer Ativa = clear || importer
            if (layerActive) {
                layerManager.list().forEach(function (layer) {

                    layerManager.active(layer.uuid);

                    layerManager.active().shapes.list().forEach(function (shape) {
                        shape.moveTo({
                            x: value.x * _zoom,
                            y: value.y * _zoom
                        });
                    });

                    layerManager.update();

                });
                layerManager.active(layerActive.uuid);
            }

            return _scroll = scrollFactor;
        } else {
            return _scroll;
        }
    }

    function zoom(value) {
        if (value) {
            // plane.zoom(plane.zoom() / .9);  - more
            // plane.zoom(plane.zoom() * .9); - less
            var layerActive = layerManager.active(),
                zoomFactor = value / _zoom;

            gridDraw(viewPort.clientHeight, viewPort.clientWidth, value, _scroll);

            // Se não alguma Layer Ativa = clear || importer
            if (layerActive) {
                layerManager.list().forEach(function (layer) {

                    layerManager.active(layer.uuid);

                    layerManager.active().shapes.list().forEach(function (shape) {
                        shape.scaleTo(zoomFactor);
                    });

                    layerManager.update();
                });
                layerManager.active(layerActive.uuid);
            }
            return _zoom = value;
        } else {
            return _zoom;
        }
    }

    function settings(value) {
        if (value) {
            return _settings = value;
        } else {
            return _settings;
        }
    }




    var layer = types.object.extend(types.object.event.create(), {
        create: function (attrs) {
            if ((typeof attrs == "function")) {
                throw new Error('layer - create - attrs is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
            }

            attrs = types.object.union(attrs, {
                viewPort: viewPort
            });

            return layerManager.create(attrs);
        },
        list: function (selector) {
            return layerManager.list();
        },
        remove: function (uuid) {
            layerManager.remove(uuid);
        },
        get active() {
            return layerManager.active();
        },
        set active(value) {
            this.notify('onDeactive', {
                type: 'onDeactive',
                layer: layerManager.active()
            });

            layerManager.active(value);

            this.notify('onActive', {
                type: 'onActive',
                layer: layerManager.active()
            });
        },
        update: function () {
            return layerManager.update();
        }
    });

    var shape = {
        create: function (attrs) {
            if ((typeof attrs == "function") || (attrs == null)) {
                throw new Error('shape - create - attrs is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
            }
            if (['polyline', 'polygon', 'rectangle', 'line', 'arc', 'circle', 'ellipse', 'bezier'].indexOf(attrs.type) == -1) {
                throw new Error('shape - create - type is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
            }
            if (((attrs.type != 'polyline') && (attrs.type != 'bezier') && (attrs.type != 'line')) && ((attrs.x == undefined) || (attrs.y == undefined))) {
                throw new Error('shape - create - x and y is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
            }

            var shape = shapeManager.create(attrs);

            layerManager.active().shapes.add(shape.uuid, shape);

            return true;
        }
    };

    var tool = {
        create: function (attrs) {
            if (typeof attrs == "function") {
                throw new Error('Tool - create - attrs is not valid \n http://requirejs.org/docs/errors.html#' + 'errorCode');
            }

            return toolManager.create(attrs);
        }
    };

    // importer
    function fromJson(stringJson) {

        var planeObject = JSON.parse(stringJson);

        clear();

        _settings = planeObject.settings;
        _zoom = planeObject.zoom;
        _scroll = planeObject.scroll;

        planeObject.layers.forEach(function (layerObject) {

            layerManager.create({
                uuid: layerObject.uuid,
                name: layerObject.name,
                locked: layerObject.locked,
                Visible: layerObject.Visible,
                style: layerObject.style,
                viewPort: viewPort
            });

            layerObject.shapes.forEach(function (shapeObject) {
                shape.create(shapeObject)
            });

            layerManager.update();
        });

        return true;
    };

    function fromSvg(stringSvg) {
        return true;
    };

    function fromDxf(stringDxf) {
        clear();

        var stringJson = importer.fromDxf(stringDxf);
        var objectDxf = JSON.parse(stringJson);

        if (stringJson) {
            layer.create();
            for (var prop in objectDxf) {
                shape.create(objectDxf[prop]);
            }
            layer.update();
        }
    };

    function fromDwg(stringDwg) {
        return true;
    }
    // importer

    // exporter
    function toJson() {

        var planeExport = {
            settings: _settings,
            zoom: types.math.parseFloat(_zoom, 5),
            scroll: _scroll,
            layers: layerManager.list().map(function (layer) {
                var layerObject = layer.toObject();

                layerObject.shapes = layerObject.shapes.map(function (shape) {
                    return shape.toObject();
                });

                return layerObject;
            })
        }

        return JSON.stringify(planeExport);
    }

    function toSvg() {
        return true;
    }
    // exporter


    function gridDraw(height, width, zoom, scroll) {
        if (!_settings.gridEnable) return;

        if (!layerSystem) {
            var attrs = { // atributos para a layer do grid (sistema) 
                viewPort: viewPort,
                name: 'Plane - System',
                status: 'system',
                style: {
                    backgroundColor: _settings.backgroundColor
                }
            };
            layerSystem = layerManager.create(attrs);
        } else {
            layerSystem.shapes.clear();
        }

        // calculos para o zoom
        width = zoom > 1 ? Math.round(width * zoom) : Math.round(width / zoom);
        height = zoom > 1 ? Math.round(height * zoom) : Math.round(height / zoom);

        var lineBold = 0;
        if (scroll.x > 0) {
            for (var x = (scroll.x * zoom); x >= 0; x -= (10 * zoom)) {

                var shape = shapeManager.create({
                    uuid: types.math.uuid(9, 16),
                    type: 'line',
                    a: [x, 0],
                    b: [x, height],
                    style: {
                        lineColor: _settings.gridColor,
                        lineWidth: lineBold % 5 == 0 ? .8 : .3
                    }
                });

                layerSystem.shapes.add(shape.uuid, shape);
                lineBold++;
            }
        }

        lineBold = 0;
        for (var x = (scroll.x * zoom); x <= width; x += (10 * zoom)) {

            var shape = shapeManager.create({
                uuid: types.math.uuid(9, 16),
                type: 'line',
                a: [x, 0],
                b: [x, height],
                style: {
                    lineColor: _settings.gridColor,
                    lineWidth: lineBold % 5 == 0 ? .8 : .3
                }
            });

            layerSystem.shapes.add(shape.uuid, shape);
            lineBold++;
        }

        lineBold = 0;
        if (scroll.y > 0) {
            for (var y = (scroll.y * zoom); y >= 0; y -= (10 * zoom)) {

                var shape = shapeManager.create({
                    uuid: types.math.uuid(9, 16),
                    type: 'line',
                    a: [0, y],
                    b: [width, y],
                    style: {
                        lineColor: _settings.gridColor,
                        lineWidth: lineBold % 5 == 0 ? .8 : .3
                    }
                });

                layerSystem.shapes.add(shape.uuid, shape);
                lineBold++;
            }
        }

        lineBold = 0;
        for (var y = (scroll.y * zoom); y <= height; y += (10 * zoom)) {

            var shape = shapeManager.create({
                uuid: types.math.uuid(9, 16),
                type: 'line',
                a: [0, y],
                b: [width, y],
                style: {
                    lineColor: _settings.gridColor,
                    lineWidth: lineBold % 5 == 0 ? .8 : .3
                }
            });

            layerSystem.shapes.add(shape.uuid, shape);
            lineBold++;
        }

        layerManager.update(layerSystem);
    };




    exports.initialize = initialize;
    exports.clear = clear;
    exports.scroll = scroll;
    exports.zoom = zoom;
    exports.settings = settings;

    exports.layer = layer;
    exports.shape = shape;
    exports.tool = tool;

    exports.importer = {
        fromJson: fromJson,
        fromSvg: fromSvg,
        fromDxf: fromDxf,
        fromDwg: fromDwg
    };
    exports.exporter = {
        toJson: toJson,
        toSvg: toSvg
    };
});