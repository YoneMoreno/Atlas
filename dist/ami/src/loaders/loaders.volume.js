'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _loaders = require('./loaders.base');

var _loaders2 = _interopRequireDefault(_loaders);

var _core = require('../core/core.utils');

var _core2 = _interopRequireDefault(_core);

var _models = require('../models/models.series');

var _models2 = _interopRequireDefault(_models);

var _models3 = require('../models/models.stack');

var _models4 = _interopRequireDefault(_models3);

var _models5 = require('../models/models.frame');

var _models6 = _interopRequireDefault(_models5);

var _parsers = require('../parsers/parsers.dicom');

var _parsers2 = _interopRequireDefault(_parsers);

var _parsers3 = require('../parsers/parsers.mhd');

var _parsers4 = _interopRequireDefault(_parsers3);

var _parsers5 = require('../parsers/parsers.nifti');

var _parsers6 = _interopRequireDefault(_parsers5);

var _parsers7 = require('../parsers/parsers.nrrd');

var _parsers8 = _interopRequireDefault(_parsers7);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** * Imports ***/
var PAKO = require('pako');

/**
 *
 * It is typically used to load a DICOM image. Use loading manager for
 * advanced usage, such as multiple files handling.
 *
 * Demo: {@link https://fnndsc.github.io/vjs#loader_dicom}
 *
 * @module loaders/volumes
 * @example
 * var files = ['/data/dcm/fruit'];
 *
 * // Instantiate a dicom loader
 * var lDicomoader = new dicom();
 *
 * // load a resource
 * loader.load(
 *   // resource URL
 *   files[0],
 *   // Function when resource is loaded
 *   function(object) {
 *     //scene.add( object );
 *     window.console.log(object);
 *   }
 * );
 */
var LoadersVolumes = function (_LoadersBase) {
  _inherits(LoadersVolumes, _LoadersBase);

  function LoadersVolumes() {
    _classCallCheck(this, LoadersVolumes);

    return _possibleConstructorReturn(this, (LoadersVolumes.__proto__ || Object.getPrototypeOf(LoadersVolumes)).apply(this, arguments));
  }

  _createClass(LoadersVolumes, [{
    key: 'parse',

    /**
     * Parse response.
     * response is formated as:
     *    {
     *      url: 'resource url',
     *      buffer: xmlresponse,
     *    }
     * @param {object} response - response
     * @return {promise} promise
     */
    value: function parse(response) {
      var _this2 = this;

      // emit 'parse-start' event
      this.emit('parse-start', {
        file: response.url,
        time: new Date()
      });
      // give a chance to the UI to update because
      // after the rendering will be blocked with intensive JS
      // will be removed after eventer set up
      if (this._progressBar) {
        this._progressBar.update(0, 100, 'parse');
      }

      return new Promise(function (resolve, reject) {
        window.setTimeout(function () {
          resolve(new Promise(function (resolve, reject) {
            var data = response;

            if (!Array.isArray(data)) {
              data = [data];
            }

            data.forEach(function (dataset) {
              _this2._preprocess(dataset);
            });

            if (data.length === 1) {
              data = data[0];
            } else {
              // if raw/mhd pair
              var mhdFile = data.filter(_this2._filterByExtension.bind(null, 'MHD'));
              var rawFile = data.filter(_this2._filterByExtension.bind(null, 'RAW'));
              if (data.length === 2 && mhdFile.length === 1 && rawFile.length === 1) {
                data.url = mhdFile[0].url;
                data.extension = mhdFile[0].extension;
                data.mhdBuffer = mhdFile[0].buffer;
                data.rawBuffer = rawFile[0].buffer;
              }
            }

            var Parser = _this2._parser(data.extension);
            if (!Parser) {
              // emit 'parse-error' event
              _this2.emit('parse-error', {
                file: response.url,
                time: new Date(),
                error: data.filename + 'can not be parsed.'
              });
              reject(data.filename + ' can not be parsed.');
            }

            // check extension
            var volumeParser = null;
            try {
              volumeParser = new Parser(data, 0);
            } catch (e) {
              window.console.log(e);
              // emit 'parse-error' event
              _this2.emit('parse-error', {
                file: response.url,
                time: new Date(),
                error: e
              });
              reject(e);
            }

            // create a series
            var series = new _models2.default();
            // global information
            series.seriesInstanceUID = volumeParser.seriesInstanceUID();
            series.transferSyntaxUID = volumeParser.transferSyntaxUID();
            series.seriesDate = volumeParser.seriesDate();
            series.seriesDescription = volumeParser.seriesDescription();
            series.studyDate = volumeParser.studyDate();
            series.studyDescription = volumeParser.studyDescription();
            series.numberOfFrames = volumeParser.numberOfFrames();
            if (!series.numberOfFrames) {
              series.numberOfFrames = 1;
            }
            series.numberOfChannels = volumeParser.numberOfChannels();
            series.modality = volumeParser.modality();
            // if it is a segmentation, attach extra information
            if (series.modality === 'SEG') {
              // colors
              // labels
              // etc.
              series.segmentationType = volumeParser.segmentationType();
              series.segmentationSegments = volumeParser.segmentationSegments();
            }
            // patient information
            series.patientID = volumeParser.patientID();
            series.patientName = volumeParser.patientName();
            series.patientAge = volumeParser.patientAge();
            series.patientBirthdate = volumeParser.patientBirthdate();
            series.patientSex = volumeParser.patientSex();

            // just create 1 dummy stack for now
            var stack = new _models4.default();
            stack.numberOfChannels = volumeParser.numberOfChannels();
            stack.pixelRepresentation = volumeParser.pixelRepresentation();
            stack.pixelType = volumeParser.pixelType();
            stack.invert = volumeParser.invert();
            stack.spacingBetweenSlices = volumeParser.spacingBetweenSlices();
            stack.modality = series.modality;
            // if it is a segmentation, attach extra information
            if (stack.modality === 'SEG') {
              // colors
              // labels
              // etc.
              stack.segmentationType = series.segmentationType;
              stack.segmentationSegments = series.segmentationSegments;
            }
            series.stack.push(stack);
            // recursive call for each frame
            // better than for loop to be able
            // to update dom with "progress" callback
            setTimeout(_this2.parseFrame(series, stack, response.url, 0, volumeParser, resolve, reject), 0);
          }));
        }, 10);
      });
    }

    /**
     * recursive parse frame
     * @param {ModelsSeries} series - data series
     * @param {ModelsStack} stack - data stack
     * @param {string} url - resource url
     * @param {number} i - frame index
     * @param {parser} dataParser - selected parser
     * @param {promise.resolve} resolve - promise resolve args
     * @param {promise.reject} reject - promise reject args
     */

  }, {
    key: 'parseFrame',
    value: function parseFrame(series, stack, url, i, dataParser, resolve, reject) {
      var frame = new _models6.default();
      frame.sopInstanceUID = dataParser.sopInstanceUID(i);
      frame.url = url;
      frame.index = i;
      frame.rows = dataParser.rows(i);
      frame.columns = dataParser.columns(i);
      frame.numberOfChannels = stack.numberOfChannels;
      frame.pixelRepresentation = stack.pixelRepresentation;
      frame.pixelType = stack.pixelType;
      frame.pixelData = dataParser.extractPixelData(i);
      frame.pixelSpacing = dataParser.pixelSpacing(i);
      frame.spacingBetweenSlices = dataParser.spacingBetweenSlices(i);
      frame.sliceThickness = dataParser.sliceThickness(i);
      frame.imageOrientation = dataParser.imageOrientation(i);
      frame.rightHanded = dataParser.rightHanded();
      stack.rightHanded = frame.rightHanded;
      if (frame.imageOrientation === null) {
        frame.imageOrientation = [1, 0, 0, 0, 1, 0];
      }
      frame.imagePosition = dataParser.imagePosition(i);
      if (frame.imagePosition === null) {
        frame.imagePosition = [0, 0, i];
      }
      frame.dimensionIndexValues = dataParser.dimensionIndexValues(i);
      frame.bitsAllocated = dataParser.bitsAllocated(i);
      frame.instanceNumber = dataParser.instanceNumber(i);
      frame.windowCenter = dataParser.windowCenter(i);
      frame.windowWidth = dataParser.windowWidth(i);
      frame.rescaleSlope = dataParser.rescaleSlope(i);
      frame.rescaleIntercept = dataParser.rescaleIntercept(i);
      // should pass frame index for consistency...
      frame.minMax = dataParser.minMaxPixelData(frame.pixelData);

      // if series.mo
      if (series.modality === 'SEG') {
        frame.referencedSegmentNumber = dataParser.referencedSegmentNumber(i);
      }

      stack.frame.push(frame);

      // update status
      this._parsed = i + 1;
      this._totalParsed = series.numberOfFrames;

      // will be removed after eventer set up
      if (this._progressBar) {
        this._progressBar.update(this._parsed, this._totalParsed, 'parse');
      }

      // emit 'parsing' event
      this.emit('parsing', {
        file: url,
        total: this._totalParsed,
        parsed: this._parsed,
        time: new Date()
      });

      if (this._parsed === this._totalParsed) {
        // emit 'parse-success' event
        this.emit('parse-success', {
          file: url,
          total: this._totalParsed,
          parsed: this._parsed,
          time: new Date()
        });

        resolve(series);
      } else {
        setTimeout(this.parseFrame(series, stack, url, this._parsed, dataParser, resolve, reject), 0);
      }
    }

    /**
     * Return parser given an extension
     * @param {string} extension - extension
     * @return {parser} selected parser
     */

  }, {
    key: '_parser',
    value: function _parser(extension) {
      var Parser = null;

      switch (extension.toUpperCase()) {
        case 'NII':
        case 'NII_':
          Parser = _parsers6.default;
          break;
        case 'DCM':
        case 'DICOM':
        case 'IMA':
        case '':
          Parser = _parsers2.default;
          break;
        case 'MHD':
          Parser = _parsers4.default;
          break;
        case 'NRRD':
          Parser = _parsers8.default;
          break;
        default:
          window.console.log('unsupported extension: ' + extension);
          return false;
      }
      return Parser;
    }

    /**
     * Pre-process data to be parsed (find data type and de-compress)
     * @param {*} data
     */

  }, {
    key: '_preprocess',
    value: function _preprocess(data) {
      var parsedUrl = _core2.default.parseUrl(data.url);
      // update data
      data.filename = parsedUrl.filename;
      data.extension = parsedUrl.extension;
      data.pathname = parsedUrl.pathname;
      data.query = parsedUrl.query;

      // unzip if extension is '.gz'
      if (data.extension === 'gz') {
        data.gzcompressed = true;
        data.extension = data.filename.split('.gz').shift().split('.').pop();
        var decompressedData = PAKO.inflate(data.buffer);
        data.buffer = decompressedData.buffer;
      } else {
        data.gzcompressed = false;
      }
    }

    /**
     * Filter data by extension
     * @param {*} extension
     * @param {*} item
     * @returns Boolean
     */

  }, {
    key: '_filterByExtension',
    value: function _filterByExtension(extension, item) {
      if (item.extension.toUpperCase() === extension.toUpperCase()) {
        return true;
      }
      return false;
    }
  }]);

  return LoadersVolumes;
}(_loaders2.default);

exports.default = LoadersVolumes;
//# sourceMappingURL=loaders.volume.js.map