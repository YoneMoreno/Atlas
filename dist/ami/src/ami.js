'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cameras = require('./cameras/cameras');

Object.keys(_cameras).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _cameras[key];
    }
  });
});

var _controls = require('./controls/controls');

Object.keys(_controls).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _controls[key];
    }
  });
});

var _core = require('./core/core');

Object.keys(_core).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _core[key];
    }
  });
});

var _geometries = require('./geometries/geometries');

Object.keys(_geometries).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _geometries[key];
    }
  });
});

var _helpers = require('./helpers/helpers');

Object.keys(_helpers).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _helpers[key];
    }
  });
});

var _loaders = require('./loaders/loaders');

Object.keys(_loaders).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _loaders[key];
    }
  });
});

var _models = require('./models/models');

Object.keys(_models).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _models[key];
    }
  });
});

var _parsers = require('./parsers/parsers');

Object.keys(_parsers).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _parsers[key];
    }
  });
});

var _presets = require('./presets/presets');

Object.keys(_presets).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _presets[key];
    }
  });
});

var _shaders = require('./shaders/shaders');

Object.keys(_shaders).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _shaders[key];
    }
  });
});

var _widgets = require('./widgets/widgets');

Object.keys(_widgets).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _widgets[key];
    }
  });
});


var pckg = require('../package.json');
window.console.log('AMI ' + pckg.version + ' ( ThreeJS ' + pckg.config.threeVersion + ')');
//# sourceMappingURL=ami.js.map