'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _three = require('three');

var _core = require('../core/core.colors');

var _core2 = _interopRequireDefault(_core);

var _core3 = require('../core/core.utils');

var _core4 = _interopRequireDefault(_core3);

var _models = require('../models/models.base');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** * Imports ***/


var binaryString = require('math-float32-to-binary-string');

/**
 * Stack object.
 *
 * @module models/stack
 */

var ModelsStack = function (_ModelsBase) {
  _inherits(ModelsStack, _ModelsBase);

  /**
   * Models Stack constructor
   */
  function ModelsStack() {
    _classCallCheck(this, ModelsStack);

    var _this = _possibleConstructorReturn(this, (ModelsStack.__proto__ || Object.getPrototypeOf(ModelsStack)).call(this));

    _this._uid = null;
    _this._stackID = -1;

    _this._frame = [];
    _this._numberOfFrames = 0;

    _this._rows = 0;
    _this._columns = 0;
    _this._numberOfChannels = 1;
    _this._bitsAllocated = 8;
    _this._pixelType = 0;
    _this._pixelRepresentation = 0;

    _this._textureSize = 4096;
    _this._nbTextures = 7;
    _this._rawData = [];

    _this._windowCenter = 0;
    _this._windowWidth = 0;

    _this._rescaleSlope = 1;
    _this._rescaleIntercept = 0;

    _this._minMax = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];

    // TRANSFORMATION MATRICES
    _this._regMatrix = new _three.Matrix4();

    _this._ijk2LPS = null;
    _this._lps2IJK = null;

    _this._aabb2LPS = null;
    _this._lps2AABB = null;

    //
    // IJK dimensions
    _this._dimensionsIJK = null;
    _this._halfDimensionsIJK = null;
    _this._spacing = new _three.Vector3(1, 1, 1);
    _this._spacingBetweenSlices = 0;
    _this._sliceThickness = 0;
    _this._origin = null;
    _this._rightHanded = true;
    _this._xCosine = new _three.Vector3(1, 0, 0);
    _this._yCosine = new _three.Vector3(0, 1, 0);
    _this._zCosine = new _three.Vector3(0, 0, 1);

    // convenience vars
    _this._prepared = false;
    _this._packed = false;
    _this._packedPerPixel = 1;

    //
    _this._modality = 'Modality not set';

    // SEGMENTATION STUFF
    _this._segmentationType = null;
    _this._segmentationSegments = [];
    _this._segmentationDefaultColor = [63, 174, 128];
    _this._frameSegment = [];
    _this._segmentationLUT = [];
    _this._segmentationLUTO = [];

    // photometricInterpretation Monochrome1 VS Monochrome2
    _this._invert = false;
    return _this;
  }

  /**
   * Prepare segmentation stack.
   * A segmentation stack can hold x frames that are at the same location
   * but segmentation specific information:
   * - Frame X contains voxels for segmentation A.
   * - Frame Y contains voxels for segmenttation B.
   * - Frame X and Y are at the same location.
   *
   * We currently merge overlaping frames into 1.
   */


  _createClass(ModelsStack, [{
    key: 'prepareSegmentation',
    value: function prepareSegmentation() {
      // store frame and do special pre-processing
      this._frameSegment = this._frame;
      var mergedFrames = [];

      // order frames
      this.computeCosines();
      this._frame.map(this._computeDistanceArrayMap.bind(null, this._zCosine));
      this._frame.sort(this._sortDistanceArraySort);

      // merge frames
      var prevIndex = -1;
      for (var i = 0; i < this._frame.length; i++) {
        if (!mergedFrames[prevIndex] || mergedFrames[prevIndex]._dist != this._frame[i]._dist) {
          mergedFrames.push(this._frame[i]);
          prevIndex++;

          // Scale frame
          // by default each frame contains binary data about a segmentation.
          // we scale it by the referenceSegmentNumber in order to have a
          // segmentation specific voxel value rather than 0 or 1.
          // That allows us to merge frames later on.
          // If we merge frames without scaling, then we can not differenciate
          // voxels from segmentation A or B as the value is 0 or 1 in both cases.
          for (var k = 0; k < mergedFrames[prevIndex]._rows * mergedFrames[prevIndex]._columns; k++) {
            mergedFrames[prevIndex]._pixelData[k] *= this._frame[i]._referencedSegmentNumber;
          }
        } else {
          // frame already exsits at this location.
          // merge data from this segmentation into existing frame
          for (var _k = 0; _k < mergedFrames[prevIndex]._rows * mergedFrames[prevIndex]._columns; _k++) {
            mergedFrames[prevIndex]._pixelData[_k] += this._frame[i].pixelData[_k] * this._frame[i]._referencedSegmentNumber;
          }
        }

        mergedFrames[prevIndex].minMax = _core4.default.minMax(mergedFrames[prevIndex]._pixelData);
      }

      // get information about segments
      var dict = {};
      var max = 0;
      for (var _i = 0; _i < this._segmentationSegments.length; _i++) {
        max = Math.max(max, parseInt(this._segmentationSegments[_i].segmentNumber, 10));

        var color = this._segmentationSegments[_i].recommendedDisplayCIELab;
        if (color === null) {
          dict[this._segmentationSegments[_i].segmentNumber] = this._segmentationDefaultColor;
        } else {
          dict[this._segmentationSegments[_i].segmentNumber] = _core2.default.cielab2RGB.apply(_core2.default, _toConsumableArray(color));
        }
      }

      // generate LUTs
      for (var _i2 = 0; _i2 <= max; _i2++) {
        var index = _i2 / max;
        var opacity = _i2 ? 1 : 0;
        var rgb = [0, 0, 0];
        if (dict.hasOwnProperty(_i2.toString())) {
          rgb = dict[_i2.toString()];
        }

        rgb[0] /= 255;
        rgb[1] /= 255;
        rgb[2] /= 255;

        this._segmentationLUT.push([index].concat(_toConsumableArray(rgb)));
        this._segmentationLUTO.push([index, opacity]);
      }

      this._frame = mergedFrames;
    }

    /**
     * Compute cosines
     * Order frames
     * computeSpacing
     * sanityCheck
     * init some vars
     * compute min/max
     * compute transformation matrices
     *
     * @return {*}
     */

  }, {
    key: 'prepare',
    value: function prepare() {
      // if segmentation, merge some frames...
      if (this._modality === 'SEG') {
        this.prepareSegmentation();
      }

      // we need at least 1 frame
      if (this._frame && this._frame.length > 0) {
        this._numberOfFrames = this._frame.length;
      } else {
        window.console.log('_frame doesn\'t contain anything....');
        window.console.log(this._frame);
        return false;
      }

      // pass parameters from frame to stack
      this._rows = this._frame[0].rows;
      this._columns = this._frame[0].columns;
      this._dimensionsIJK = new _three.Vector3(this._columns, this._rows, this._numberOfFrames);
      this._halfDimensionsIJK = new _three.Vector3(this._dimensionsIJK.x / 2, this._dimensionsIJK.y / 2, this._dimensionsIJK.z / 2);
      this._spacingBetweenSlices = this._frame[0].spacingBetweenSlices;
      this._sliceThickness = this._frame[0].sliceThickness;

      // compute direction cosines
      this.computeCosines();

      // order the frames
      this.orderFrames();

      // compute/guess spacing
      this.computeSpacing();
      // set extra vars if nulls
      // do it now because before we would think image position/orientation
      // are defined and we would use it to compute spacing.
      if (!this._frame[0].imagePosition) {
        this._frame[0].imagePosition = [0, 0, 0];
      }
      if (!this._frame[0].imageOrientation) {
        this._frame[0].imageOrientation = [1, 0, 0, 0, 1, 0];
      }

      this._origin = this._arrayToVector3(this._frame[0].imagePosition, 0);

      // compute transforms
      this.computeIJK2LPS();

      this.computeLPS2AABB();
      // this.packEchos();

      var middleFrameIndex = Math.floor(this._frame.length / 2);
      var middleFrame = this._frame[middleFrameIndex];

      this._rescaleSlope = middleFrame.rescaleSlope || 1;
      this._rescaleIntercept = middleFrame.rescaleIntercept || 0;

      // rescale/slope min max
      this.computeMinMaxIntensities();
      this._minMax[0] = _core4.default.rescaleSlopeIntercept(this._minMax[0], this._rescaleSlope, this._rescaleIntercept);
      this._minMax[1] = _core4.default.rescaleSlopeIntercept(this._minMax[1], this._rescaleSlope, this._rescaleIntercept);

      var width = middleFrame.windowWidth * this._rescaleSlope || this._minMax[1] - this._minMax[0];
      this._windowWidth = width + this._rescaleIntercept;

      var center = middleFrame.windowCenter * this._rescaleSlope || this._minMax[0] + width / 2;
      this._windowCenter = center + this._rescaleIntercept;

      this._bitsAllocated = middleFrame.bitsAllocated;
      this._prepared = true;
    }
  }, {
    key: 'packEchos',
    value: function packEchos() {
      // 4 echo times...
      var echos = 4;
      var packedEcho = [];
      for (var i = 0; i < this._frame.length; i += echos) {
        var frame = this._frame[i];
        for (var k = 0; k < this._rows * this._columns; k++) {
          for (var j = 1; j < echos; j++) {
            frame.pixelData[k] += this._frame[i + j].pixelData[k];
          }
          frame.pixelData[k] /= echos;
        }
        packedEcho.push(frame);
      }
      this._frame = packedEcho;
      this._numberOfFrames = this._frame.length;
      this._dimensionsIJK = new _three.Vector3(this._columns, this._rows, this._numberOfFrames);
      this._halfDimensionsIJK = new _three.Vector3(this._dimensionsIJK.x / 2, this._dimensionsIJK.y / 2, this._dimensionsIJK.z / 2);
    }

    // frame.cosines - returns array [x, y, z]

  }, {
    key: 'computeCosines',
    value: function computeCosines() {
      if (this._frame && this._frame[0]) {
        var cosines = this._frame[0].cosines();
        this._xCosine = cosines[0];
        this._yCosine = cosines[1];
        this._zCosine = cosines[2];
      }
    }
  }, {
    key: 'orderFrames',
    value: function orderFrames() {
      // order the frames based on theirs dimension indices
      // first index is the most important.
      // 1,1,1,1 willl be first
      // 1,1,2,1 will be next
      // 1,1,2,3 will be next
      // 1,1,3,1 wil be next
      if (this._frame[0].dimensionIndexValues) {
        this._frame.sort(this._orderFrameOnDimensionIndicesArraySort);

        // else order with image position and orientation
      } else if (this._frame[0].imagePosition && this._frame[0].imageOrientation && this._frame[1] && this._frame[1].imagePosition && this._frame[1].imageOrientation && this._frame[0].imagePosition.join() !== this._frame[1].imagePosition.join()) {
        // compute and sort by dist in this series
        this._frame.map(this._computeDistanceArrayMap.bind(null, this._zCosine));
        this._frame.sort(this._sortDistanceArraySort);
      } else if (this._frame[0].instanceNumber !== null && this._frame[1] && this._frame[1].instanceNumber !== null && this._frame[0].instanceNumber !== this._frame[1].instanceNumber) {
        this._frame.sort(this._sortInstanceNumberArraySort);
      } else if (this._frame[0].sopInstanceUID && this._frame[1] && this._frame[1].sopInstanceUID && this._frame[0].sopInstanceUID !== this._frame[1].sopInstanceUID) {
        this._frame.sort(this._sortSopInstanceUIDArraySort);
      } else {
        // window.console.log(this._frame[0]);
        // window.console.log(this._frame[1]);
        // window.console.log(this._frame[0].instanceNumber !== null && true);
        // window.console.log(
        // this._frame[0].instanceNumber !== this._frame[1].instanceNumber);
        window.console.log('do not know how to order the frames...');
        // else slice location
        // image number
        // ORDERING BASED ON instance number
        // _ordering = 'instance_number';
        // first_image.sort(function(a,b){
        // return a["instance_number"]-b["instance_number"]});
      }
    }
  }, {
    key: 'computeSpacing',
    value: function computeSpacing() {
      this.xySpacing();
      this.zSpacing();
    }

    /**
     * Compute stack z spacing
     */

  }, {
    key: 'zSpacing',
    value: function zSpacing() {
      if (this._numberOfFrames > 1) {
        if (this._frame[0].pixelSpacing && this._frame[0].pixelSpacing[2]) {
          this._spacing.z = this._frame[0].pixelSpacing[2];
        } else {
          // compute and sort by dist in this series
          this._frame.map(this._computeDistanceArrayMap.bind(null, this._zCosine));

          // if distances are different, re-sort array
          if (this._frame[1].dist !== this._frame[0].dist) {
            this._frame.sort(this._sortDistanceArraySort);
            this._spacing.z = this._frame[1].dist - this._frame[0].dist;
          } else if (this._spacingBetweenSlices) {
            this._spacing.z = this._spacingBetweenSlices;
          } else if (this._frame[0].sliceThickness) {
            this._spacing.z = this._frame[0].sliceThickness;
          }
        }
      }

      // Spacing
      // can not be 0 if not matrix can not be inverted.
      if (this._spacing.z === 0) {
        this._spacing.z = 1;
      }
    }

    /**
     *  FRAME CAN DO IT
     */

  }, {
    key: 'xySpacing',
    value: function xySpacing() {
      if (this._frame && this._frame[0]) {
        var spacingXY = this._frame[0].spacingXY();
        this._spacing.x = spacingXY[0];
        this._spacing.y = spacingXY[1];
      }
    }

    /**
     * Find min and max intensities among all frames.
     */

  }, {
    key: 'computeMinMaxIntensities',
    value: function computeMinMaxIntensities() {
      // what about colors!!!!?
      // we ignore values if NaNs
      // https://github.com/FNNDSC/ami/issues/185
      for (var i = 0; i < this._frame.length; i++) {
        // get min/max
        var min = this._frame[i].minMax[0];
        if (!Number.isNaN(min)) {
          this._minMax[0] = Math.min(this._minMax[0], min);
        }

        var max = this._frame[i].minMax[1];
        if (!Number.isNaN(max)) {
          this._minMax[1] = Math.max(this._minMax[1], max);
        }
      }
    }

    /**
     * Compute IJK to LPS and invert transforms
     */

  }, {
    key: 'computeIJK2LPS',
    value: function computeIJK2LPS() {
      // ijk to lps
      this._ijk2LPS = _core4.default.ijk2LPS(this._xCosine, this._yCosine, this._zCosine, this._spacing, this._origin, this._regMatrix);

      // lps 2 ijk
      this._lps2IJK = new _three.Matrix4();
      this._lps2IJK.getInverse(this._ijk2LPS);
    }

    /**
     * Compute LPS to AABB and invert transforms
     */

  }, {
    key: 'computeLPS2AABB',
    value: function computeLPS2AABB() {
      this._aabb2LPS = _core4.default.aabb2LPS(this._xCosine, this._yCosine, this._zCosine, this._origin);

      this._lps2AABB = new _three.Matrix4();
      this._lps2AABB.getInverse(this._aabb2LPS);
    }

    /**
     * Merge stacks
     *
     * @param {*} stack
     *
     * @return {*}
     */

  }, {
    key: 'merge',
    value: function merge(stack) {
      // also make sure x/y/z cosines are a match!
      if (this._stackID === stack.stackID) {
        return this.mergeModels(this._frame, stack.frame);
      } else {
        return false;
      }
    }

    /**
     * Pack current stack pixel data into 8 bits array buffers
     */

  }, {
    key: 'pack',
    value: function pack() {
      // Get total number of voxels
      var nbVoxels = this._dimensionsIJK.x * this._dimensionsIJK.y * this._dimensionsIJK.z;

      // Packing style
      if (this._bitsAllocated === 16 && this._numberOfChannels === 1) {
        this._packedPerPixel = 2;
      }

      // Loop through all the textures we need
      var textureDimension = this._textureSize * this._textureSize;
      var requiredTextures = Math.ceil(nbVoxels / (textureDimension * this._packedPerPixel));
      var voxelIndexStart = 0;
      var voxelIndexStop = this._packedPerPixel * textureDimension;
      if (voxelIndexStop > nbVoxels) {
        voxelIndexStop = nbVoxels;
      }

      for (var ii = 0; ii < requiredTextures; ii++) {
        var packed = this._packTo8Bits(this._numberOfChannels, this._frame, this._textureSize, voxelIndexStart, voxelIndexStop);
        this._textureType = packed.textureType;
        this._rawData.push(packed.data);

        voxelIndexStart += this._packedPerPixel * textureDimension;
        voxelIndexStop += this._packedPerPixel * textureDimension;
        if (voxelIndexStop > nbVoxels) {
          voxelIndexStop = nbVoxels;
        }
      }

      this._packed = true;
    }

    /**
     * Pack frame data to 32 bits texture
     * @param {*} channels
     * @param {*} frame
     * @param {*} textureSize
     * @param {*} startVoxel
     * @param {*} stopVoxel
     */

  }, {
    key: '_packTo8Bits',
    value: function _packTo8Bits(channels, frame, textureSize, startVoxel, stopVoxel) {
      var packed = {
        textureType: null,
        data: null
      };

      var bitsAllocated = frame[0].bitsAllocated;
      var pixelType = frame[0].pixelType;

      // transform signed to unsigned for convenience
      var offset = 0;
      if (this._minMax[0] < 0) {
        offset -= this._minMax[0];
      }

      var packIndex = 0;
      var frameIndex = 0;
      var inFrameIndex = 0;
      // frame should return it!
      var frameDimension = frame[0].rows * frame[0].columns;

      if (bitsAllocated === 8 && channels === 1 || bitsAllocated === 1) {
        var data = new Uint8Array(textureSize * textureSize * 1);
        for (var i = startVoxel; i < stopVoxel; i++) {
          frameIndex = ~~(i / frameDimension);
          inFrameIndex = i % frameDimension;

          var raw = frame[frameIndex].pixelData[inFrameIndex] += offset;
          if (!Number.isNaN(raw)) {
            data[packIndex] = raw;
          }

          packIndex++;
        }
        packed.textureType = THREE.LuminanceFormat;
        packed.data = data;
      } else if (bitsAllocated === 16 && channels === 1) {
        var _data = new Uint8Array(textureSize * textureSize * 4);
        var coordinate = 0;
        var channelOffset = 0;

        for (var _i3 = startVoxel; _i3 < stopVoxel; _i3++) {
          frameIndex = ~~(_i3 / frameDimension);
          inFrameIndex = _i3 % frameDimension;

          var _raw = frame[frameIndex].pixelData[inFrameIndex] + offset;
          if (!Number.isNaN(_raw)) {
            _data[4 * coordinate + 2 * channelOffset] = _raw & 0x00FF;
            _data[4 * coordinate + 2 * channelOffset + 1] = _raw >>> 8 & 0x00FF;
          }

          packIndex++;
          coordinate = Math.floor(packIndex / 2);
          channelOffset = packIndex % 2;
        }

        packed.textureType = THREE.RGBAFormat;
        packed.data = _data;
      } else if (bitsAllocated === 32 && channels === 1 && pixelType === 0) {
        var _data2 = new Uint8Array(textureSize * textureSize * 4);
        for (var _i4 = startVoxel; _i4 < stopVoxel; _i4++) {
          frameIndex = ~~(_i4 / frameDimension);
          inFrameIndex = _i4 % frameDimension;

          var _raw2 = frame[frameIndex].pixelData[inFrameIndex] + offset;
          if (!Number.isNaN(_raw2)) {
            _data2[4 * packIndex] = _raw2 & 0x000000FF;
            _data2[4 * packIndex + 1] = _raw2 >>> 8 & 0x000000FF;
            _data2[4 * packIndex + 2] = _raw2 >>> 16 & 0x000000FF;
            _data2[4 * packIndex + 3] = _raw2 >>> 24 & 0x000000FF;
          }

          packIndex++;
        }
        packed.textureType = THREE.RGBAFormat;
        packed.data = _data2;
      } else if (bitsAllocated === 32 && channels === 1 && pixelType === 1) {
        var _data3 = new Uint8Array(textureSize * textureSize * 4);

        for (var _i5 = startVoxel; _i5 < stopVoxel; _i5++) {
          frameIndex = ~~(_i5 / frameDimension);
          inFrameIndex = _i5 % frameDimension;

          var _raw3 = frame[frameIndex].pixelData[inFrameIndex] + offset;
          if (!Number.isNaN(_raw3)) {
            var bitString = binaryString(_raw3);
            var bitStringArray = bitString.match(/.{1,8}/g);

            _data3[4 * packIndex] = parseInt(bitStringArray[0], 2);
            _data3[4 * packIndex + 1] = parseInt(bitStringArray[1], 2);
            _data3[4 * packIndex + 2] = parseInt(bitStringArray[2], 2);
            _data3[4 * packIndex + 3] = parseInt(bitStringArray[3], 2);
          }

          packIndex++;
        }

        packed.textureType = THREE.RGBAFormat;
        packed.data = _data3;
      } else if (bitsAllocated === 8 && channels === 3) {
        var _data4 = new Uint8Array(textureSize * textureSize * 3);

        for (var _i6 = startVoxel; _i6 < stopVoxel; _i6++) {
          frameIndex = ~~(_i6 / frameDimension);
          inFrameIndex = _i6 % frameDimension;

          _data4[3 * packIndex] = frame[frameIndex].pixelData[3 * inFrameIndex];
          _data4[3 * packIndex + 1] = frame[frameIndex].pixelData[3 * inFrameIndex + 1];
          _data4[3 * packIndex + 2] = frame[frameIndex].pixelData[3 * inFrameIndex + 2];
          packIndex++;
        }

        packed.textureType = THREE.RGBFormat;
        packed.data = _data4;
      }

      return packed;
    }

    /**
     * Get the stack world center
     *
     *@return {*}
     */

  }, {
    key: 'worldCenter',
    value: function worldCenter() {
      var center = this._halfDimensionsIJK.clone().addScalar(-0.5).applyMatrix4(this._ijk2LPS);
      return center;
    }

    /**
     * Get the stack world bounding box
     * @return {*}
     */

  }, {
    key: 'worldBoundingBox',
    value: function worldBoundingBox() {
      var bbox = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];

      var dims = this._dimensionsIJK;

      for (var i = 0; i <= dims.x; i += dims.x) {
        for (var j = 0; j <= dims.y; j += dims.y) {
          for (var k = 0; k <= dims.z; k += dims.z) {
            var world = new _three.Vector3(i, j, k).applyMatrix4(this._ijk2LPS);
            bbox = [Math.min(bbox[0], world.x), Math.max(bbox[1], world.x), // x min/max
            Math.min(bbox[2], world.y), Math.max(bbox[3], world.y), Math.min(bbox[4], world.z), Math.max(bbox[5], world.z)];
          }
        }
      }

      return bbox;
    }

    /**
     * Get AABB size in LPS space.
     *
     * @return {*}
     */

  }, {
    key: 'AABBox',
    value: function AABBox() {
      var world0 = new _three.Vector3().addScalar(-0.5).applyMatrix4(this._ijk2LPS).applyMatrix4(this._lps2AABB);

      var world7 = this._dimensionsIJK.clone().addScalar(-0.5).applyMatrix4(this._ijk2LPS).applyMatrix4(this._lps2AABB);

      var minBBox = new _three.Vector3(Math.abs(world0.x - world7.x), Math.abs(world0.y - world7.y), Math.abs(world0.z - world7.z));

      return minBBox;
    }

    /**
     * Get AABB center in LPS space
     */

  }, {
    key: 'centerAABBox',
    value: function centerAABBox() {
      var centerBBox = this.worldCenter();
      centerBBox.applyMatrix4(this._lps2AABB);
      return centerBBox;
    }
  }, {
    key: '_arrayToVector3',
    value: function _arrayToVector3(array, index) {
      return new _three.Vector3(array[index], array[index + 1], array[index + 2]);
    }
  }, {
    key: '_orderFrameOnDimensionIndicesArraySort',
    value: function _orderFrameOnDimensionIndicesArraySort(a, b) {
      if ('dimensionIndexValues' in a && Object.prototype.toString.call(a.dimensionIndexValues) === '[object Array]' && 'dimensionIndexValues' in b && Object.prototype.toString.call(b.dimensionIndexValues) === '[object Array]') {
        for (var i = 0; i < a.dimensionIndexValues.length; i++) {
          if (parseInt(a.dimensionIndexValues[i], 10) > parseInt(b.dimensionIndexValues[i], 10)) {
            return 1;
          }
          if (parseInt(a.dimensionIndexValues[i], 10) < parseInt(b.dimensionIndexValues[i], 10)) {
            return -1;
          }
        }
      } else {
        window.console.log('One of the frames doesn\'t have a dimensionIndexValues array.');
        window.console.log(a);
        window.console.log(b);
      }

      return 0;
    }
  }, {
    key: '_computeDistanceArrayMap',
    value: function _computeDistanceArrayMap(normal, frame) {
      frame.dist = frame.imagePosition[0] * normal.x + frame.imagePosition[1] * normal.y + frame.imagePosition[2] * normal.z;
      return frame;
    }
  }, {
    key: '_sortDistanceArraySort',
    value: function _sortDistanceArraySort(a, b) {
      return a.dist - b.dist;
    }
  }, {
    key: '_sortInstanceNumberArraySort',
    value: function _sortInstanceNumberArraySort(a, b) {
      return a.instanceNumber - b.instanceNumber;
    }
  }, {
    key: '_sortSopInstanceUIDArraySort',
    value: function _sortSopInstanceUIDArraySort(a, b) {
      return a.sopInstanceUID - b.sopInstanceUID;
    }
  }, {
    key: 'numberOfChannels',
    set: function set(numberOfChannels) {
      this._numberOfChannels = numberOfChannels;
    },
    get: function get() {
      return this._numberOfChannels;
    }
  }, {
    key: 'frame',
    set: function set(frame) {
      this._frame = frame;
    },
    get: function get() {
      return this._frame;
    }
  }, {
    key: 'prepared',
    set: function set(prepared) {
      this._prepared = prepared;
    },
    get: function get() {
      return this._prepared;
    }
  }, {
    key: 'packed',
    set: function set(packed) {
      this._packed = packed;
    },
    get: function get() {
      return this._packed;
    }
  }, {
    key: 'packedPerPixel',
    set: function set(packedPerPixel) {
      this._packedPerPixel = packedPerPixel;
    },
    get: function get() {
      return this._packedPerPixel;
    }
  }, {
    key: 'dimensionsIJK',
    set: function set(dimensionsIJK) {
      this._dimensionsIJK = dimensionsIJK;
    },
    get: function get() {
      return this._dimensionsIJK;
    }
  }, {
    key: 'halfDimensionsIJK',
    set: function set(halfDimensionsIJK) {
      this._halfDimensionsIJK = halfDimensionsIJK;
    },
    get: function get() {
      return this._halfDimensionsIJK;
    }
  }, {
    key: 'regMatrix',
    set: function set(regMatrix) {
      this._regMatrix = regMatrix;
    },
    get: function get() {
      return this._regMatrix;
    }
  }, {
    key: 'ijk2LPS',
    set: function set(ijk2LPS) {
      this._ijk2LPS = ijk2LPS;
    },
    get: function get() {
      return this._ijk2LPS;
    }
  }, {
    key: 'lps2IJK',
    set: function set(lps2IJK) {
      this._lps2IJK = lps2IJK;
    },
    get: function get() {
      return this._lps2IJK;
    }
  }, {
    key: 'lps2AABB',
    set: function set(lps2AABB) {
      this._lps2AABB = lps2AABB;
    },
    get: function get() {
      return this._lps2AABB;
    }
  }, {
    key: 'textureSize',
    set: function set(textureSize) {
      this._textureSize = textureSize;
    },
    get: function get() {
      return this._textureSize;
    }
  }, {
    key: 'textureType',
    set: function set(textureType) {
      this._textureType = textureType;
    },
    get: function get() {
      return this._textureType;
    }
  }, {
    key: 'bitsAllocated',
    set: function set(bitsAllocated) {
      this._bitsAllocated = bitsAllocated;
    },
    get: function get() {
      return this._bitsAllocated;
    }
  }, {
    key: 'rawData',
    set: function set(rawData) {
      this._rawData = rawData;
    },
    get: function get() {
      return this._rawData;
    }
  }, {
    key: 'windowWidth',
    get: function get() {
      return this._windowWidth;
    },
    set: function set(windowWidth) {
      this._windowWidth = windowWidth;
    }
  }, {
    key: 'windowCenter',
    get: function get() {
      return this._windowCenter;
    },
    set: function set(windowCenter) {
      this._windowCenter = windowCenter;
    }
  }, {
    key: 'rescaleSlope',
    get: function get() {
      return this._rescaleSlope;
    },
    set: function set(rescaleSlope) {
      this._rescaleSlope = rescaleSlope;
    }
  }, {
    key: 'rescaleIntercept',
    get: function get() {
      return this._rescaleIntercept;
    },
    set: function set(rescaleIntercept) {
      this._rescaleIntercept = rescaleIntercept;
    }
  }, {
    key: 'xCosine',
    get: function get() {
      return this._xCosine;
    },
    set: function set(xCosine) {
      this._xCosine = xCosine;
    }
  }, {
    key: 'yCosine',
    get: function get() {
      return this._yCosine;
    },
    set: function set(yCosine) {
      this._yCosine = yCosine;
    }
  }, {
    key: 'zCosine',
    get: function get() {
      return this._zCosine;
    },
    set: function set(zCosine) {
      this._zCosine = zCosine;
    }
  }, {
    key: 'minMax',
    get: function get() {
      return this._minMax;
    },
    set: function set(minMax) {
      this._minMax = minMax;
    }
  }, {
    key: 'stackID',
    get: function get() {
      return this._stackID;
    },
    set: function set(stackID) {
      this._stackID = stackID;
    }
  }, {
    key: 'pixelType',
    get: function get() {
      return this._pixelType;
    },
    set: function set(pixelType) {
      this._pixelType = pixelType;
    }
  }, {
    key: 'pixelRepresentation',
    get: function get() {
      return this._pixelRepresentation;
    },
    set: function set(pixelRepresentation) {
      this._pixelRepresentation = pixelRepresentation;
    }
  }, {
    key: 'invert',
    set: function set(invert) {
      this._invert = invert;
    },
    get: function get() {
      return this._invert;
    }
  }, {
    key: 'modality',
    set: function set(modality) {
      this._modality = modality;
    },
    get: function get() {
      return this._modality;
    }
  }, {
    key: 'rightHanded',
    get: function get() {
      return this._rightHanded;
    },
    set: function set(rightHanded) {
      this._rightHanded = rightHanded;
    }
  }, {
    key: 'spacingBetweenSlices',
    get: function get() {
      return this._spacingBetweenSlices;
    },
    set: function set(spacingBetweenSlices) {
      this._spacingBetweenSlices = spacingBetweenSlices;
    }
  }, {
    key: 'segmentationSegments',
    set: function set(segmentationSegments) {
      this._segmentationSegments = segmentationSegments;
    },
    get: function get() {
      return this._segmentationSegments;
    }
  }, {
    key: 'segmentationType',
    set: function set(segmentationType) {
      this._segmentationType = segmentationType;
    },
    get: function get() {
      return this._segmentationType;
    }
  }, {
    key: 'segmentationLUT',
    set: function set(segmentationLUT) {
      this._segmentationLUT = segmentationLUT;
    },
    get: function get() {
      return this._segmentationLUT;
    }
  }, {
    key: 'segmentationLUTO',
    set: function set(segmentationLUTO) {
      this._segmentationLUTO = segmentationLUTO;
    },
    get: function get() {
      return this._segmentationLUTO;
    }

    // DEPRECATED FUNCTION

    /**
     * @deprecated for core.utils.value
     *
     * Get voxel value.
     *
     * @param {*} stack
     * @param {*} coordinate
     *
     * @return {*}
     */

  }], [{
    key: 'indexInDimensions',
    value: function indexInDimensions(index, dimensions) {
      if (index.x >= 0 && index.y >= 0 && index.z >= 0 && index.x < dimensions.x && index.y < dimensions.y && index.z < dimensions.z) {
        return true;
      }

      return false;
    }
  }, {
    key: 'value',
    value: function value(stack, coordinate) {
      window.console.warn('models.stack.value is deprecated.\n       Please use core.utils.value instead.');
      return _core4.default.value(stack, coordinate);
    }

    /**
     * @deprecated for core.utils.rescaleSlopeIntercept
     *
     * Apply slope/intercept to a value.
     *
     * @param {*} value
     * @param {*} slope
     * @param {*} intercept
     *
     * @return {*}
     */

  }, {
    key: 'valueRescaleSlopeIntercept',
    value: function valueRescaleSlopeIntercept(value, slope, intercept) {
      window.console.warn('models.stack.valueRescaleSlopeIntercept is deprecated.\n       Please use core.utils.rescaleSlopeIntercept instead.');
      return _core4.default.rescaleSlopeIntercept(value, slope, intercept);
    }

    /**
     * @deprecated for core.utils.worldToData
     *
     * Transform coordinates from world coordinate to data
     *
     * @param {*} stack
     * @param {*} worldCoordinates
     *
     * @return {*}
     */

  }, {
    key: 'worldToData',
    value: function worldToData(stack, worldCoordinates) {
      window.console.warn('models.stack.worldToData is deprecated.\n       Please use core.utils.worldToData instead.');

      return _core4.default.worldToData(stack._lps2IJK, worldCoordinates);
    }
  }]);

  return ModelsStack;
}(_models2.default);

exports.default = ModelsStack;
//# sourceMappingURL=models.stack.js.map