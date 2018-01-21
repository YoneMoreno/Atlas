'use strict';

var _core = require('base/core/core.utils');

var _core2 = _interopRequireDefault(_core);

var _loaders = require('base/loaders/loaders.volume');

var _loaders2 = _interopRequireDefault(_loaders);

var _helpers = require('base/helpers/helpers.stack');

var _helpers2 = _interopRequireDefault(_helpers);

var _helpers3 = require('base/helpers/helpers.lut');

var _helpers4 = _interopRequireDefault(_helpers3);

var _cameras = require('base/cameras/cameras.orthographic');

var _cameras2 = _interopRequireDefault(_cameras);

var _controls = require('base/controls/controls.trackballortho');

var _controls2 = _interopRequireDefault(_controls);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// standard global variables
/* globals dat*/
var controls = void 0;
var renderer = void 0;
var scene = void 0;
var camera = void 0;
var threeD = void 0;
var lut = void 0;

var ctrlDown = false;
var drag = {
    start: {
        x: null,
        y: null
    }
};

// probe
var camUtils = {
    invertRows: false,
    invertColumns: false,
    rotate: false,
    orientation: 'default',
    convention: 'radio'
};

/**
 * Init the scene
 */
function init() {
    /**
     * Animation loop
     */
    function animate() {
        // render
        controls.update();
        renderer.render(scene, camera);

        // request new frame
        requestAnimationFrame(function () {
            animate();
        });
    }

    setRenderer();

    function setRenderer() {
        threeD = document.getElementById('r3d');
        var smoothBorders = true;
        renderer = new THREE.WebGLRenderer({
            antialias: smoothBorders
        });
        renderer.setSize(threeD.clientWidth, threeD.clientHeight);
        var gray = 0x212121;
        var opacity = 1;
        renderer.setClearColor(gray, opacity);

        threeD.appendChild(renderer.domElement);
    }

    scene = new THREE.Scene();

    setCamera();

    function setCamera() {
        var left = threeD.clientWidth / -2;
        var right = threeD.clientWidth / 2;
        var top = threeD.clientHeight / 2;
        var bottom = threeD.clientHeight / -2;
        var near = 0.1;
        var far = 10000;
        camera = new _cameras2.default(left, right, top, bottom, near, far);
    }

    setControls();

    function setControls() {
        var object = camera;
        var domElement = threeD;
        controls = new _controls2.default(object, domElement);
        controls.staticMoving = true;
        controls.noRotate = true;
        camera.controls = controls;
    }

    animate();
}

window.onload = function () {
    setFileInputOnButtonClick();

    function setFileInputOnButtonClick() {
        document.getElementById('buttoninput').onclick = function () {
            document.getElementById('filesinput').click();
        };
    }

    // init threeJS...
    init();

    function updateLabels(labels, modality) {
        if (modality === 'CR' || modality === 'DX') return;

        var top = document.getElementById('top');
        top.innerHTML = labels[0];

        var bottom = document.getElementById('bottom');
        bottom.innerHTML = labels[1];

        var right = document.getElementById('right');
        right.innerHTML = labels[2];

        var left = document.getElementById('left');
        left.innerHTML = labels[3];
    }

    function buildGUI(stackHelper) {
        var _createGui = createGui(),
            stack = _createGui.stack,
            gui = _createGui.gui;

        function createGui() {
            var stack = stackHelper._stack;

            var gui = new dat.GUI({
                autoPlace: false
            });

            var customContainer = document.getElementById('my-gui-container');
            customContainer.appendChild(gui.domElement);
            return { stack: stack, gui: gui };
        }

        var stackFolder = createStackFolderOnGui();

        function createStackFolderOnGui() {
            var stackFolder = gui.addFolder('Stack');
            return stackFolder;
        }

        setWindowWidth();

        function setWindowWidth() {
            var minWidth = 1;
            var maxWidth = stack.minMax[1] - stack.minMax[0];
            stackFolder.add(stackHelper.slice, 'windowWidth', minWidth, maxWidth).step(1).listen();
        }

        setWindowCenter();

        function setWindowCenter() {
            var minCenter = stack.minMax[0];
            var maxCenter = stack.minMax[1];
            stackFolder.add(stackHelper.slice, 'windowCenter', minCenter, maxCenter).step(1).listen();
        }

        setIntensity();

        function setIntensity() {
            stackFolder.add(stackHelper.slice, 'intensityAuto').listen();
        }

        setInvert();

        function setInvert() {
            stackFolder.add(stackHelper.slice, 'invert');
        }

        setInterpolation();

        function setInterpolation() {
            var minInterpolation = 0;
            var maxInterpolation = 1;
            stackFolder.add(stackHelper.slice, 'interpolation', minInterpolation, maxInterpolation).step(1).listen();
        }

        // CREATE LUT

        setLUT();

        function setLUT() {
            createLUT();

            function createLUT() {
                var domTarget = 'my-lut-canvases';
                var lookUpTable = 'default';
                var modeToApplyGradientInLut = 'linear_full';
                var color = [[0, 0, 0, 0], [1, 1, 1, 1]];
                var opacity = [[0, 1], [1, 1]];
                lut = new _helpers4.default(domTarget, lookUpTable, modeToApplyGradientInLut, color, opacity);
                lut.luts = _helpers4.default.presetLuts();
            }

            updateLUT();

            function updateLUT() {
                var lutUpdate = stackFolder.add(stackHelper.slice, 'lut', lut.lutsAvailable());
                lutUpdate.onChange(function (value) {
                    lut.lut = value;
                    stackHelper.slice.lutTexture = lut.texture;
                });
            }

            discreteLUT();

            function discreteLUT() {
                var lutDiscrete = stackFolder.add(lut, 'discrete', false);
                lutDiscrete.onChange(function (value) {
                    lut.discrete = value;
                    stackHelper.slice.lutTexture = lut.texture;
                });
            }
        }

        var index = setIndex();

        function setIndex() {
            var minIndex = 0;
            var maxIndex = stack.dimensionsIJK.z - 1;
            var index = stackFolder.add(stackHelper, 'index', minIndex, maxIndex).step(1).listen();
            return index;
        }

        stackFolder.open();

        createCameraFolderOnGui();

        function createCameraFolderOnGui() {
            var cameraFolder = gui.addFolder('Camera');

            setInvertRows();

            function setInvertRows() {
                var invertRows = cameraFolder.add(camUtils, 'invertRows');
                invertRows.onChange(function () {
                    camera.invertRows();
                    updateLabels(camera.directionsLabel, stack.modality);
                });
            }

            function setInvertColumns() {
                var invertColumns = cameraFolder.add(camUtils, 'invertColumns');
                invertColumns.onChange(function () {
                    camera.invertColumns();
                    updateLabels(camera.directionsLabel, stack.modality);
                });
            }

            setInvertColumns();

            var angle = cameraFolder.add(camera, 'angle', 0, 360).step(1).listen();
            angle.onChange(function () {
                updateLabels(camera.directionsLabel, stack.modality);
            });

            setRotation();

            function setRotation() {
                var rotate = cameraFolder.add(camUtils, 'rotate');
                rotate.onChange(function () {
                    camera.rotate();
                    updateLabels(camera.directionsLabel, stack.modality);
                });
            }

            setOrientation();

            function setOrientation() {
                var orientationUpdate = cameraFolder.add(camUtils, 'orientation', ['default', 'axial', 'coronal', 'sagittal']);

                updateOrientation();

                function updateOrientation() {
                    orientationUpdate.onChange(function (value) {
                        camera.orientation = value;
                        camera.update();

                        var numberOfDirectionsToRecalculateCameraZoom = 2;
                        camera.fitBox(numberOfDirectionsToRecalculateCameraZoom);
                        stackHelper.orientation = camera.stackOrientation;
                        updateLabels(camera.directionsLabel, stack.modality);

                        index.__max = stackHelper.orientationMaxIndex;
                        stackHelper.index = putRotationAnglesSliderAtMediumPointOnGui();

                        function putRotationAnglesSliderAtMediumPointOnGui() {
                            return Math.floor(index.__max / 2);
                        }
                    });
                }
            }

            setConvention();

            function setConvention() {
                var conventionUpdate = cameraFolder.add(camUtils, 'convention', ['radio', 'neuro']);
                conventionUpdate.onChange(function (value) {
                    camera.convention = value;
                    camera.update();
                    camera.fitBox(2);
                    updateLabels(camera.directionsLabel, stack.modality);
                });
            }
        }
    }

    /**
     * Connect all callbevent observesrs
     */
    function hookCallbacks(stackHelper) {
        var stack = stackHelper._stack;

        setOnScrollControl();

        function setOnScrollControl() {
            controls.addEventListener('OnScroll', function (e) {
                if (e.delta > 0) {
                    if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
                        return false;
                    }
                    stackHelper.index += 1;
                } else {
                    if (stackHelper.index <= 0) {
                        return false;
                    }
                    stackHelper.index -= 1;
                }
            });
        }

        /**
         * On window resize callback
         */
        function onWindowResize() {
            var threeD = document.getElementById('r3d');
            camera.canvas = {
                width: threeD.clientWidth,
                height: threeD.clientHeight
            };
            camera.fitBox(2);

            renderer.setSize(threeD.clientWidth, threeD.clientHeight);

            // update info to draw borders properly
            stackHelper.slice.canvasWidth = threeD.clientWidth;
            stackHelper.slice.canvasHeight = threeD.clientHeight;
        }

        window.addEventListener('resize', onWindowResize, false);
        onWindowResize();

        /**
         * On key pressed callback
         */
        function onWindowKeyPressed(event) {
            ctrlDown = event.ctrlKey;
            if (!ctrlDown) {
                drag.start.x = null;
                drag.start.y = null;
            }
        }

        document.addEventListener('keydown', onWindowKeyPressed, false);
        document.addEventListener('keyup', onWindowKeyPressed, false);

        /**
         * On mouse move callback
         */
        function onMouseMove(event) {
            if (ctrlDown) {
                if (drag.start.x === null) {
                    drag.start.x = event.clientX;
                    drag.start.y = event.clientY;
                }
                var threshold = 15;

                stackHelper.slice.intensityAuto = false;

                var dynamicRange = stack.minMax[1] - stack.minMax[0];
                dynamicRange /= threeD.clientWidth;

                if (Math.abs(event.clientX - drag.start.x) > threshold) {
                    // window width
                    stackHelper.slice.windowWidth += dynamicRange * (event.clientX - drag.start.x);
                    drag.start.x = event.clientX;
                }

                if (Math.abs(event.clientY - drag.start.y) > threshold) {
                    // window center
                    stackHelper.slice.windowCenter -= dynamicRange * (event.clientY - drag.start.y);
                    drag.start.y = event.clientY;
                }
            }
        }

        document.addEventListener('mousemove', onMouseMove);
    }

    /**
     * Visulaize incoming data
     */
    function handleSeries(seriesContainer) {
        // cleanup the loader and its progress bar
        loader.free();
        loader = null;
        // prepare for slice visualization
        // first stack of first series
        var stack = seriesContainer[0].mergeSeries(seriesContainer)[0].stack[0];

        var stackHelper = new _helpers2.default(stack);
        stackHelper.bbox.visible = false;
        stackHelper.borderColor = '#2196F3';
        stackHelper.border.visible = false;
        scene.add(stackHelper);

        console.log(stackHelper.stack);

        setCamera();

        function setCamera() {
            var lpsDims = calculateLPSCoordinates();

            function calculateLPSCoordinates() {
                var worldbb = stack.worldBoundingBox();
                var leftRightDimension = (worldbb[1] - worldbb[0]) / 2;
                var posteriorAnteriorDimension = (worldbb[3] - worldbb[2]) / 2;
                var superiorInferiorDimension = (worldbb[5] - worldbb[4]) / 2;
                var lpsDims = new THREE.Vector3(leftRightDimension, posteriorAnteriorDimension, superiorInferiorDimension);
                return lpsDims;
            }

            var box = calculateCameraFieldOfView();

            function calculateCameraFieldOfView() {
                var box = {
                    center: stack.worldCenter().clone(),
                    halfDimensions: new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10)
                };
                return box;
            }

            var canvas = createCanvas();

            function createCanvas() {
                var canvas = {
                    width: threeD.clientWidth,
                    height: threeD.clientHeight
                };
                return canvas;
            }

            configureCamera();

            function configureCamera() {
                camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
                camera.box = box;
                camera.canvas = canvas;
                camera.update();
                camera.fitBox(2);
            }

            updateLabels(camera.directionsLabel, stack.modality);
        }

        buildGUI(stackHelper);
        hookCallbacks(stackHelper);
    }

    var loader = new _loaders2.default(threeD);
    var seriesContainer = [];

    /**
     * Filter array of data by extension
     * extension {String}
     * item {Object}
     * @return {Boolean}
     */
    function _filterByExtension(extension, item) {
        if (item.extension.toUpperCase() === extension.toUpperCase()) {
            return true;
        }
        return false;
    }

    /**
     * Parse incoming files
     */
    function readMultipleFiles(evt) {

        if (filesHaveBeenLoaded()) {
            hideFileUploadButton();
        }

        function filesHaveBeenLoaded() {
            return evt.target.files.length;
        }

        function hideFileUploadButton() {
            document.getElementById('home-container').style.display = 'none';
        }

        /**
         * Load sequence
         */
        function loadSequence(index, files) {
            return Promise.resolve().then(function () {

                return read();

                function read() {
                    return new Promise(function (resolve, reject) {
                        var myReader = new FileReader();
                        myReader.addEventListener('load', function (e) {
                            resolve(e.target.result);
                        });
                        myReader.readAsArrayBuffer(files[index]);
                    });
                }
            }).then(function (buffer) {
                return parse();

                function parse() {
                    return loader.parse({ url: files[index].name, buffer: buffer });
                }
            }).then(function (series) {
                load();

                function load() {
                    seriesContainer.push(series);
                }
            }).catch(function (error) {
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            });
        }

        /**
         * Load group sequence
         */
        function loadSequenceGroup(files) {
            var fetchSequence = [];

            var _loop = function _loop(i) {
                fetchSequence.push(new Promise(function (resolve, reject) {
                    read();

                    function read() {
                        var myReader = new FileReader();
                        myReader.addEventListener('load', function (e) {
                            resolve(e.target.result);
                        });
                        myReader.readAsArrayBuffer(files[i].file);
                    }
                }).then(function (buffer) {
                    return parse();

                    function parse() {
                        return { url: files[i].file.name, buffer: buffer };
                    }
                }));
            };

            for (var i = 0; i < files.length; i++) {
                _loop(i);
            }

            return Promise.all(fetchSequence).then(function (rawdata) {
                return loader.parse(rawdata);
            }).then(function (series) {
                seriesContainer.push(series);
            }).catch(function (error) {
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            });
        }

        var loadSequenceContainer = [];

        var data = [];
        var dataGroups = [];

        convertObjectIntoArray();

        function convertObjectIntoArray() {
            for (var i = 0; i < evt.target.files.length; i++) {
                var dataUrl = _core2.default.parseUrl(evt.target.files[i].name);
                if (dataUrl.extension.toUpperCase() === 'MHD' || dataUrl.extension.toUpperCase() === 'RAW') {
                    dataGroups.push({
                        file: evt.target.files[i],
                        extension: dataUrl.extension.toUpperCase()
                    });
                } else {
                    data.push(evt.target.files[i]);
                }
            }
        }

        if (someFilesMustBeLoadedTogether()) {
            var _someFilesMustBeLoadedTogether = function _someFilesMustBeLoadedTogether() {
                return dataGroups.length === 2;
            };

            var mhdFile = dataGroups.filter(_filterByExtension.bind(null, 'MHD'));
            var rawFile = dataGroups.filter(_filterByExtension.bind(null, 'RAW'));
            if (thereIsRawMhdPair()) {
                var _thereIsRawMhdPair = function _thereIsRawMhdPair() {
                    return mhdFile.length === 1 && rawFile.length === 1;
                };

                loadSequenceContainer.push(loadSequenceGroup(dataGroups));
            }
        }
        loadTheRestOfTheFiles();

        function loadTheRestOfTheFiles() {
            for (var i = 0; i < data.length; i++) {
                loadSequenceContainer.push(loadSequence(i, data));
            }
        }

        runTheLoadSequenceForAllFiles();

        function runTheLoadSequenceForAllFiles() {
            Promise.all(loadSequenceContainer).then(function () {
                handleSeries(seriesContainer);
            }).catch(function (error) {
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            });
        }
    }

    hookUpFileInputListener();

    function hookUpFileInputListener() {
        document.getElementById('filesinput').addEventListener('change', readMultipleFiles, false);
    }
};
//# sourceMappingURL=viewers_upload.js.map