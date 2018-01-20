'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _widgets = require('./widgets.base');

var _widgets2 = _interopRequireDefault(_widgets);

var _geometries = require('../geometries/geometries.voxel');

var _geometries2 = _interopRequireDefault(_geometries);

var _models = require('../models/models.stack');

var _models2 = _interopRequireDefault(_models);

var _models3 = require('../models/models.voxel');

var _models4 = _interopRequireDefault(_models3);

var _core = require('../core/core.intersections');

var _core2 = _interopRequireDefault(_core);

var _three = require('three');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @module widgets/voxelProbe
 */

var WidgetsVoxelProbe = function (_WidgetsBase) {
  _inherits(WidgetsVoxelProbe, _WidgetsBase);

  function WidgetsVoxelProbe(stack, targetMesh, controls, camera, container) {
    _classCallCheck(this, WidgetsVoxelProbe);

    var _this = _possibleConstructorReturn(this, (WidgetsVoxelProbe.__proto__ || Object.getPrototypeOf(WidgetsVoxelProbe)).call(this, container));

    _this._stack = stack;

    _this._targetMesh = targetMesh;
    _this._controls = controls;
    _this._camera = camera;

    // if no target mesh, use plane for FREE dragging.
    _this._plane = {
      position: new _three.Vector3(),
      direction: new _three.Vector3()
    };

    _this._offset = new _three.Vector3();
    _this._raycaster = new THREE.Raycaster();

    _this._tracking = false;

    _this._mouse = new _three.Vector2();
    _this._lastEvent = null;

    // world (LPS) position of the center
    _this._worldPosition = new _three.Vector3();

    // screen position of the center
    _this._screenPosition = new _three.Vector2();

    // mesh stuff
    _this._material = null;
    _this._geometry = null;
    _this._mesh = null;
    _this._meshDisplayed = true;
    _this._meshHovered = false;
    _this._meshStyle = 'sphere'; // cube, etc.

    // dom stuff
    _this._dom = null;
    _this._domDisplayed = true;
    _this._domHovered = false;
    _this._domStyle = 'circle'; // square, triangle

    if (_this._targetMesh !== null) {
      _this._worldPosition.copy(_this._targetMesh.position);
    }

    _this._screenPosition = _this.worldToScreen(_this._worldPosition, _this._camera, _this._container);

    // create handle
    _this.create();
    _this.initOffsets();

    // event listeners
    _this.onMove = _this.onMove.bind(_this);
    _this.onHover = _this.onHover.bind(_this);
    _this.onEndControl = _this.onEndControl.bind(_this);
    _this.addEventListeners();
    return _this;
  }

  _createClass(WidgetsVoxelProbe, [{
    key: 'addEventListeners',
    value: function addEventListeners() {
      this._dom.addEventListener('mouseenter', this.onHover);
      this._dom.addEventListener('mouseleave', this.onHover);

      this._container.addEventListener('mousewheel', this.onMove);
      this._container.addEventListener('DOMMouseScroll', this.onMove);

      this._controls.addEventListener('end', this.onEndControl);
    }
  }, {
    key: 'removeEventListeners',
    value: function removeEventListeners() {
      this._dom.removeEventListener('mouseenter', this.onHover);
      this._dom.removeEventListener('mouseleave', this.onHover);

      this._container.removeEventListener('mousewheel', this.onMove);
      this._container.removeEventListener('DOMMouseScroll', this.onMove);

      this._controls.removeEventListener('end', this.onEndControl);
    }
  }, {
    key: 'onStart',
    value: function onStart(evt) {
      this._lastEvent = evt;
      evt.preventDefault();

      var offsets = this.getMouseOffsets(evt, this._container);
      this._mouse.set(offsets.x, offsets.y);

      // update raycaster
      this._raycaster.setFromCamera(this._mouse, this._camera);
      this._raycaster.ray.position = this._raycaster.ray.origin;

      if (this._hovered) {
        this._active = true;
        this._controls.enabled = false;

        if (this._targetMesh) {
          var intersectsTarget = this._raycaster.intersectObject(this._targetMesh);
          if (intersectsTarget.length > 0) {
            this._offset.copy(intersectsTarget[0].point).sub(this._worldPosition);
          }
        } else {
          this._plane.position.copy(this._worldPosition);
          this._plane.direction.copy(this._camera.getWorldDirection());
          var intersection = _core2.default.rayPlane(this._raycaster.ray, this._plane);
          if (intersection !== null) {
            this._offset.copy(intersection).sub(this._plane.position);
          }
        }

        this.update();
      }
    }
  }, {
    key: 'onEnd',
    value: function onEnd(evt) {
      this._lastEvent = evt;
      evt.preventDefault();

      // stay active and keep controls disabled
      if (this._tracking === true) {
        return;
      }

      // unselect if go up without moving
      if (!this._dragged && this._active) {
        // change state if was not dragging
        this._selected = !this._selected;
      }

      this._active = false;
      this._dragged = false;
      this._controls.enabled = true;

      this.update();
    }
  }, {
    key: 'onEndControl',
    value: function onEndControl() {
      var _this2 = this;

      if (!this._lastEvent) {
        return;
      }

      window.requestAnimationFrame(function () {
        _this2.onMove(_this2._lastEvent);
      });
    }
  }, {
    key: 'onMove',
    value: function onMove(evt) {
      this._lastEvent = evt;
      evt.preventDefault();

      var offsets = this.getMouseOffsets(evt, this._container);
      this._mouse.set(offsets.x, offsets.y);

      // update raycaster
      // set ray.position to satisfy CoreIntersections::rayPlane API
      this._raycaster.setFromCamera(this._mouse, this._camera);
      this._raycaster.ray.position = this._raycaster.ray.origin;

      if (this._active) {
        this._dragged = true;

        if (this._targetMesh !== null) {
          var intersectsTarget = this._raycaster.intersectObject(this._targetMesh);
          if (intersectsTarget.length > 0) {
            this._worldPosition.copy(intersectsTarget[0].point.sub(this._offset));
          }
        } else {
          if (this._plane.direction.length() === 0) {
            // free mode!this._targetMesh
            this._plane.position.copy(this._worldPosition);
            this._plane.direction.copy(this._camera.getWorldDirection());
          }

          var intersection = _core2.default.rayPlane(this._raycaster.ray, this._plane);
          if (intersection !== null) {
            this._worldPosition.copy(intersection.sub(this._offset));
          }
        }
      } else {
        this.onHover(null);
      }

      this.update();
    }
  }, {
    key: 'onHover',
    value: function onHover(evt) {
      if (evt) {
        this._lastEvent = evt;
        evt.preventDefault();
        this.hoverDom(evt);
      }

      this.hoverMesh();

      this._hovered = this._meshHovered || this._domHovered;
      this._container.style.cursor = this._hovered ? 'pointer' : 'default';
    }
  }, {
    key: 'hoverMesh',
    value: function hoverMesh() {
      // check raycast intersection, do we want to hover on mesh or just css?
      var intersectsHandle = this._raycaster.intersectObject(this._mesh);
      this._meshHovered = intersectsHandle.length > 0;
    }
  }, {
    key: 'hoverDom',
    value: function hoverDom(evt) {
      this._domHovered = evt.type === 'mouseenter';
    }
  }, {
    key: 'worldToScreen',
    value: function worldToScreen(worldCoordinate, camera, canvas) {
      var screenCoordinates = worldCoordinate.clone();
      screenCoordinates.project(camera);

      screenCoordinates.x = Math.round((screenCoordinates.x + 1) * canvas.offsetWidth / 2);
      screenCoordinates.y = Math.round((-screenCoordinates.y + 1) * canvas.offsetHeight / 2);
      screenCoordinates.z = 0;

      return screenCoordinates;
    }
  }, {
    key: 'create',
    value: function create() {
      this.createVoxel();
      this.createMesh();
      this.createDOM();
    }
  }, {
    key: 'createVoxel',
    value: function createVoxel() {
      this._voxel = new _models4.default();
      this._voxel.id = this.id;
      this._voxel.worldCoordinates = this._worldCoordinates;
    }
  }, {
    key: 'createMesh',
    value: function createMesh() {
      var dataCoordinates = _models2.default.worldToData(this._stack, this._worldPosition);

      this._geometry = new _geometries2.default(dataCoordinates);
      this._material = new THREE.MeshBasicMaterial({
        wireframe: true,
        wireframeLinewidth: 1
      });
      this._mesh = new THREE.Mesh(this._geometry, this._material);
      this._mesh.applyMatrix(this._stack.ijk2LPS);
      this._mesh.visible = true;

      this.updateMeshColor();

      this.add(this._mesh);
    }
  }, {
    key: 'updateMeshColor',
    value: function updateMeshColor() {
      if (this._material) {
        this._material.color.set(this._color);
      }
    }
  }, {
    key: 'createDOM',
    value: function createDOM() {
      // dom
      this._dom = document.createElement('div');
      this._dom.setAttribute('id', this.uuid);
      this._dom.setAttribute('class', 'AMI Widget VoxelProbe');
      this._dom.style.border = '2px solid #000';
      this._dom.style.backgroundColor = 'rgb(249, 249, 249)';
      this._dom.style.color = '#212121';
      this._dom.style.position = 'absolute';
      this._dom.style.transformOrigin = '0px 100% 0px';

      // measurenents
      var measurementsContainer = document.createElement('div');
      // LPS
      var lpsContainer = document.createElement('div');
      lpsContainer.setAttribute('id', 'lpsPosition');
      measurementsContainer.appendChild(lpsContainer);
      // IJK
      var ijkContainer = document.createElement('div');
      ijkContainer.setAttribute('id', 'ijkPosition');
      measurementsContainer.appendChild(ijkContainer);
      // Value
      var valueContainer = document.createElement('div');
      valueContainer.setAttribute('id', 'value');
      measurementsContainer.appendChild(valueContainer);

      this.updateDOMColor();
      this._dom.appendChild(measurementsContainer);

      // add it!
      this._container.appendChild(this._dom);
    }
  }, {
    key: 'updateDOMContent',
    value: function updateDOMContent() {
      var rasContainer = this._dom.querySelector('#lpsPosition');
      rasContainer.innerHTML = 'LPS: \n      ' + this._voxel.worldCoordinates.x.toFixed(2) + ' :\n      ' + this._voxel.worldCoordinates.y.toFixed(2) + ' :\n      ' + this._voxel.worldCoordinates.z.toFixed(2);

      var ijkContainer = this._dom.querySelector('#ijkPosition');
      ijkContainer.innerHTML = 'IJK: \n      ' + this._voxel.dataCoordinates.x + ' :\n      ' + this._voxel.dataCoordinates.y + ' :\n      ' + this._voxel.dataCoordinates.z;

      var valueContainer = this._dom.querySelector('#value');
      valueContainer.innerHTML = 'Value: ' + this._voxel.value;
    }
  }, {
    key: 'update',
    value: function update() {
      // general update
      this.updateColor();
      this._screenPosition = this.worldToScreen(this._worldPosition, this._camera, this._container);

      // set data coordinates && value
      this.updateVoxel(this._worldPosition);

      // update mesh position
      this.updateMeshColor();
      if (this._mesh && this._mesh.geometry) {
        this._mesh.geometry.location = this._voxel.dataCoordinates;
        this._mesh.updateMatrix();
      }

      // update dom
      this.updateDOMContent();
      this.updateDOMColor();
      this.updateDOMPosition();
    }
  }, {
    key: 'updateVoxel',
    value: function updateVoxel(worldCoordinates) {
      // update world coordinates
      this._voxel.worldCoordinates = worldCoordinates;

      // update data coordinates
      this._voxel.dataCoordinates = _models2.default.worldToData(this._stack, this._voxel.worldCoordinates);

      // update value
      var value = _models2.default.value(this._stack, this._voxel.dataCoordinates);

      this._voxel.value = _models2.default.valueRescaleSlopeIntercept(value, this._stack.rescaleSlope, this._stack.rescaleIntercept);
    }
  }, {
    key: 'updateDOMPosition',
    value: function updateDOMPosition() {
      if (this._dom) {
        var posY = this._screenPosition.y - this._container.offsetHeight;
        this._dom.style.transform = 'translate3D(' + this._screenPosition.x + 'px, ' + posY + 'px, 0)';
      }
    }
  }, {
    key: 'updateDOMColor',
    value: function updateDOMColor() {
      this._dom.style.borderColor = '' + this._color;
    }
  }, {
    key: 'free',
    value: function free() {
      this._container.removeEventListener('mouseup', this.onMouseUpHandler, false);
      this._container.removeEventListener('mousemove', this.onMouseMoveHandler, false);

      this._container.removeEventListener('mousewheel', this.onMouseMoveHandler, false);
      this._container.removeEventListener('DOMMouseScroll', this.onMouseMoveHandler, false);

      this._voxel.removeTest();
      this.remove(this._voxel);
      this._voxel = null;

      _get(WidgetsVoxelProbe.prototype.__proto__ || Object.getPrototypeOf(WidgetsVoxelProbe.prototype), 'free', this).call(this);
    }
  }, {
    key: 'hoverVoxel',
    value: function hoverVoxel(mouseScreenCoordinates, currentDataCoordinates) {
      // update distance mouse/this._voxel
      var dx = mouseScreenCoordinates.screenX - this._voxel.voxel.screenCoordinates.x;
      var dy = mouseScreenCoordinates.screenY - this._voxel.voxel.screenCoordinates.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      this._voxel.distance = distance;
      if (distance >= 0 && distance < 10) {
        this._hover = true;
      } else {
        this._hover = false;
      }
    }
  }, {
    key: 'hideDOM',
    value: function hideDOM() {
      this._dom.style.display = 'none';
    }
  }, {
    key: 'showDOM',
    value: function showDOM() {
      this._dom.style.display = '';
    }
  }, {
    key: 'hideMesh',
    value: function hideMesh() {
      this.visible = false;
    }
  }, {
    key: 'showMesh',
    value: function showMesh() {
      this.visible = true;
    }
  }, {
    key: 'show',
    value: function show() {
      this.showDOM();
      this.showMesh();
    }
  }, {
    key: 'hide',
    value: function hide() {
      this.hideDOM();
      this.hideMesh();
    }
  }, {
    key: 'worldPosition',
    set: function set(worldPosition) {
      this._worldPosition.copy(worldPosition);
      this.update();
    }
  }, {
    key: 'defaultColor',
    set: function set(defaultColor) {
      this._defaultColor = defaultColor;
      this.update();
    },
    get: function get() {
      return this._defaultColor;
    }
  }, {
    key: 'activeColor',
    set: function set(activeColor) {
      this._activeColor = activeColor;
      this.update();
    },
    get: function get() {
      return this._activeColor;
    }
  }, {
    key: 'hoverColor',
    set: function set(hoverColor) {
      this._hoverColor = hoverColor;
      this.update();
    },
    get: function get() {
      return this._hoverColor;
    }
  }, {
    key: 'selectedColor',
    set: function set(selectedColor) {
      this._selectedColor = selectedColor;
      this.update();
    },
    get: function get() {
      return this._selectedColor;
    }
  }, {
    key: 'showVoxel',
    set: function set(showVoxel) {
      this._showVoxel = showVoxel;
      this.update();
    },
    get: function get() {
      return this._showVoxel;
    }
  }, {
    key: 'showDomSVG',
    set: function set(showDomSVG) {
      this._showDomSVG = showDomSVG;
      this.update();
    },
    get: function get() {
      return this._showDomSVG;
    }
  }, {
    key: 'showDomMeasurements',
    set: function set(showDomMeasurements) {
      this._showDomMeasurements = showDomMeasurements;
      this.update();
    },
    get: function get() {
      return this._showDomMeasurements;
    }
  }]);

  return WidgetsVoxelProbe;
}(_widgets2.default);

exports.default = WidgetsVoxelProbe;
//# sourceMappingURL=widgets.voxelProbe.js.map