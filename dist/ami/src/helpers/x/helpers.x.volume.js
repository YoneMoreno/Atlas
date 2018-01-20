'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _helpers = require('../helpers.stack');

var _helpers2 = _interopRequireDefault(_helpers);

var _loaders = require('../../loaders/loaders.volume');

var _loaders2 = _interopRequireDefault(_loaders);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @module helpers/x/volume
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var _class = function (_THREE$Object3D) {
  _inherits(_class, _THREE$Object3D);

  function _class() {
    _classCallCheck(this, _class);

    var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

    _this._file = null;
    _this._progressbarContainer = null;
    _this._stack = null;
    _this._centerLPS = null;
    _this._xSlice = null;
    _this._ySlice = null;
    _this._zSlice = null;
    return _this;
  }

  // accessor properties


  _createClass(_class, [{
    key: '_createSlice',


    // private methods
    value: function _createSlice(orientation) {
      if (this._stack) {
        var stackHelper = new _helpers2.default(this._stack);
        stackHelper.orientation = orientation;

        if (orientation === 0) {
          stackHelper.border.color = 0xF44336;
          this._xSlice = stackHelper;
        } else if (orientation === 1) {
          stackHelper.bbox.visible = false;
          stackHelper.border.color = 0x4CAF50;
          this._ySlice = stackHelper;
        } else {
          stackHelper.bbox.visible = false;
          stackHelper.border.color = 0x2196F3;
          this._zSlice = stackHelper;
        }

        this._centerLPS = stackHelper.stack.worldCenter();
      }
    }

    // public methods

  }, {
    key: 'load',
    value: function load() {
      var _this2 = this;

      if (this.file) {
        // instantiate the loader
        // it loads and parses the dicom image
        var loader = new _loaders2.default(this._progressbarContainer);
        return loader.load(this.file).then(function () {
          return new Promise(function (resolve, reject) {
            if (loader.data.length <= 0) {
              return reject({ message: 'No data loaded: ' + loader.data + '.' });
            }

            // create the three slices when all files have been loaded
            var series = loader.data[0].mergeSeries(loader.data)[0];
            loader.free();

            _this2._stack = series.stack[0];
            _this2._createSlice(0);
            _this2.add(_this2._xSlice);
            _this2._createSlice(1);
            _this2.add(_this2._ySlice);
            _this2._createSlice(2);
            _this2.add(_this2._zSlice);

            return resolve(_this2);
          });
        }).catch(function (error) {
          loader.free();
          window.console.log('Something went wrong loading the volume...');
          window.console.log(error);
        });
      }

      return Promise.reject({ message: 'File not defined: ' + this.file + '.' });
    }
  }, {
    key: 'file',
    get: function get() {
      return this._file;
    },
    set: function set(fname) {
      this._file = fname;
    }
  }, {
    key: 'progressbarContainer',
    set: function set(container) {
      this._progressbarContainer = container;
    }
  }, {
    key: 'centerLPS',
    get: function get() {
      return this._centerLPS;
    }
  }, {
    key: 'stack',
    get: function get() {
      return this._stack;
    }
  }]);

  return _class;
}(THREE.Object3D);

exports.default = _class;
//# sourceMappingURL=helpers.x.volume.js.map