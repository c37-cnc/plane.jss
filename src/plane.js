define("plane", ['require', 'exports'], function (require, exports) {

    var version = '3.0.0',
        authors = ['lilo@c37.co', 'ser@c37.co'];

    var types = require('utility/types'),
        importer = require('utility/importer'),
        exporter = require('utility/exporter');

    var layerManager = require('structure/layer'),
        shapeManager = require('geometric/shape'),
        toolManager = require('structure/tool');

    var centerHistory = types.data.list.create();

    var viewPort = null,
        _view = {
            zoom: 1,
            center: {
                x: 0,
                y: 0,
                reset: function () {

                    var layerActive = layerManager.active(),
                        centerInitial = {
                            x: (_view.size.width * _view.zoom) / 2,
                            y: (_view.size.height * _view.zoom) / 2
                        };


                    // utilizo o histórico de movimentação de centro 
                    // para retornar ao inicio
                    var moveFactor = {
                        x: 0,
                        y: 0
                    };

                    // calculando o centro através do histórico de movimentos
                    centerHistory.list().forEach(function (itemHistory) {
                        moveFactor.x += itemHistory.x;
                        moveFactor.y += itemHistory.y;
                    });

                    // aplicando o zoom atual na soma 
                    moveFactor.x *= _view.zoom;
                    moveFactor.y *= _view.zoom;

                    // negativo
                    moveFactor.x *= -1;
                    moveFactor.y *= -1;

                    // limpando os históricos de centro
                    centerHistory.clear();

                    // limpando os limites
                    _view.bounds.height = _view.size.height * _view.zoom;
                    _view.bounds.width = _view.size.width * _view.zoom;
                    _view.bounds.x = 0;
                    _view.bounds.y = 0;


                    _view.center.x += moveFactor.x;
                    _view.center.y += moveFactor.y;

                    // movimentando todos os shapes de todas as layers
                    layerManager.list().forEach(function (layer) {

                        layerManager.active(layer.uuid);

                        layerManager.active().shapes.list().forEach(function (shape) {
                            shape.moveTo(moveFactor);
                        });

                        layerManager.update();
                    });
                    layerManager.active(layerActive.uuid);

                    return true;
                },
                add: function (moveFactor) {

                    // adicionado ao histórico dos movimentos de centro
                    centerHistory.add({
                        x: moveFactor.x,
                        y: moveFactor.y
                    });

                    _view.center.x += moveFactor.x;
                    _view.center.y += moveFactor.y;

                    var layerActive = layerManager.active();
                    // movimentando todos os shapes de todas as layers
                    layerManager.list().forEach(function (layer) {

                        layerManager.active(layer.uuid);

                        layerManager.active().shapes.list().forEach(function (shape) {
                            shape.moveTo(moveFactor);
                        });

                        layerManager.update();
                    });
                    layerManager.active(layerActive.uuid);

                    return true;
                }
            },
            size: {
                height: 0,
                width: 0
            },
            bounds: {
                x: 0,
                y: 0,
                height: 0,
                width: 0
            }
        }


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

        // iniciando configurações para View

        // o centro inicial
        _view.center.x = viewPort.clientWidth / 2;
        _view.center.y = viewPort.clientHeight / 2;

        // os limites de tamanho inicial
        _view.bounds.height = viewPort.clientHeight;
        _view.bounds.width = viewPort.clientWidth;

        // os tamanhos que são fixos
        _view.size.height = viewPort.clientHeight;
        _view.size.width = viewPort.clientWidth;


        toolManager.event.start({
            viewPort: viewPort
        });

        return true;
    }

    function clear() {
        // reset em center
        //        center({
        //            factor: 1,
        //            center: {
        //                x: _center.position.x * -1,
        //                y: _center.position.y * -1
        //            }
        //        });

        // remove em todas as layers
        layerManager.remove();

        return true;
    }

    // plane.view.zoom =/ .9;  - more
    // plane.view.zoom =* .9; - less
    var view = {
        get zoom() {
            return _view.zoom;
        },
        set zoom(value) {

            var layerActive = layerManager.active(),
                zoomFactor = value / _view.zoom;

            // com o valor do middle anterior para retroceder os valores sem perder a medida do centro
            var middlePrevious = {
                x: ((viewPort.clientWidth - (viewPort.clientWidth * _view.zoom)) / 2) * -1,
                y: ((viewPort.clientHeight - (viewPort.clientHeight * _view.zoom)) / 2) * -1,
            };
            // ATENÇÃO - os sinais!
            _view.bounds.x += middlePrevious.x;
            _view.bounds.y += middlePrevious.y;

            _view.bounds.height *= _view.zoom;
            _view.bounds.width *= _view.zoom;

            // com o meio atualizando pelo zoom
            var middleCurrent = {
                x: ((viewPort.clientWidth - (viewPort.clientWidth * value)) / 2),
                y: (viewPort.clientHeight - (viewPort.clientHeight * value)) / 2,
            };
            // atualizando os limites
            _view.bounds.x += middleCurrent.x;
            _view.bounds.y += middleCurrent.y;

            layerManager.list().forEach(function (layer) {

                layerManager.active(layer.uuid);

                layerManager.active().shapes.list().forEach(function (shape) {
                    shape.moveTo(middlePrevious);
                    shape.scaleTo(zoomFactor);
                    shape.moveTo(middleCurrent);
                });

                layerManager.update();
            });
            layerManager.active(layerActive.uuid);

            _view.zoom = value;
        },
        get center() {
            return _view.center;
        },
        set center(value) {
            // verificamos se o novo status de centro é realmente diferente do atual
            if (value && (value.x != 0 || value.y != 0) && (value.x != _view.center.x || value.y != _view.center.y)) {

                var layerActive = layerManager.active(),
                    // fator de movimento - calculando e atualizando com o zoom atual
                    moveFactor = {
                        x: (value.x - _view.center.x) * _view.zoom,
                        y: (value.y - _view.center.y) * _view.zoom
                    }

                // adicionado ao histórico dos movimentos de centro
                centerHistory.add({
                    x: value.x - _view.center.x,
                    y: value.y - _view.center.y
                });

                // movimentando todos os shapes de todas as layers
                layerManager.list().forEach(function (layer) {

                    layerManager.active(layer.uuid);

                    layerManager.active().shapes.list().forEach(function (shape) {
                        shape.moveTo(moveFactor);
                    });

                    layerManager.update();
                });
                layerManager.active(layerActive.uuid);

                // atualizando os valores para o centro com seus movimentos
                _view.center.x += (value.x - _view.center.x);
                _view.center.y += (value.y - _view.center.y);
            }
        },
        get bounds() {
            var boundsHistory = {
                x: 0,
                y: 0
            };

            // calculando o centro através do histórico de movimentos
            centerHistory.list().forEach(function (itemHistory) {
                boundsHistory.x += itemHistory.x;
                boundsHistory.y += itemHistory.y;
            });

            // aplicando o zoom atual na soma 
            boundsHistory.x *= _view.zoom;
            boundsHistory.y *= _view.zoom;

            // somando aos movimentos de zoom
            // calculando os limites
            return {
                x: _view.bounds.x + boundsHistory.x,
                y: _view.bounds.y + boundsHistory.y,
                height: _view.bounds.height,
                width: _view.bounds.width
            };
        },
        get size() {
            return _view.size;
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

        //        _center = planeObject.position;

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
            //            center: _center,
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


    exports.initialize = initialize;
    exports.clear = clear;
    exports.view = view;

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