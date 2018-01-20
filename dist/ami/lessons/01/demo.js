'use strict';

var _setupRenderer = setupRenderer(),
    container = _setupRenderer.container,
    renderer = _setupRenderer.renderer;

function setupRenderer() {
    var container = document.getElementById('container');
    var smootBorders = true;
    var renderer = new THREE.WebGLRenderer({
        antialias: smootBorders
    });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    var greyBackgroundColor = 0x353535;
    var alpha = 1;
    renderer.setClearColor(greyBackgroundColor, alpha);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    return { container: container, renderer: renderer };
}

var scene = setupScene();

function setupScene() {
    return new THREE.Scene();
}

var camera = setupCamera();

function setupCamera() {
    var fov = 45;
    var aspect = container.offsetWidth / container.offsetHeight;
    var near = 0.01;
    var far = 10000000;

    var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.x = 150;
    camera.position.y = 150;
    camera.position.z = 100;

    return camera;
}

var controls = setupControlls();

function setupControlls() {
    return new AMI.TrackballControl(camera, container);
}

function onWindowResize() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    updateProjectionMatrixToDetermineHowToDisplay3DDataas2DImage();
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    function updateProjectionMatrixToDetermineHowToDisplay3DDataas2DImage() {
        camera.updateProjectionMatrix();
    }
}

window.addEventListener('resize', onWindowResize, false);

function gui(stackHelper) {
    var _createGui = createGui(),
        stack = _createGui.stack,
        gui = _createGui.gui;

    function createGui() {
        var stack = stackHelper.stack;
        var gui = new dat.GUI({
            autoPlace: false
        });
        var guiElementId = 'my-gui-container';
        var customContainer = document.getElementById(guiElementId);
        customContainer.appendChild(gui.domElement);
        return { stack: stack, gui: gui };
    }

    var _createStackPanel = createStackPanel(),
        stackFolder = _createStackPanel.stackFolder,
        index = _createStackPanel.index,
        orientation = _createStackPanel.orientation;

    function createStackPanel() {
        var stackGuiLabel = 'Stack';
        var stackFolder = gui.addFolder(stackGuiLabel);

        var indexGuiLabel = 'index';
        var index = createIndexSlider();

        function createIndexSlider() {
            var min = 0;
            var max = stack.dimensionsIJK.z - 1;

            var index = stackFolder.add(stackHelper, indexGuiLabel, min, max).step(1).listen();

            return index;
        }

        var orientation = createOrientationSlider();

        function createOrientationSlider() {
            var orientationGuiLabel = 'orientation';
            var orientationMin = 0;
            var orientationMax = 2;

            var orientation = stackFolder.add(stackHelper, orientationGuiLabel, orientationMin, orientationMax).step(1).listen();

            return orientation;
        }

        return { stackFolder: stackFolder, index: index, orientation: orientation };
    }

    addOrientationEventListener();

    function addOrientationEventListener() {
        orientation.onChange(function () {
            index.__max = stackHelper.orientationMaxIndex;
            var centerIndexSliderOnGuiFormula = Math.floor(index.__max / 2);
            stackHelper.index = centerIndexSliderOnGuiFormula;
        });
    }

    stackFolder.open();

    createSlicePanel();

    function createSlicePanel() {
        var sliceFolder = gui.addFolder('Slice');

        createWindowWidthSlider();

        function createWindowWidthSlider() {
            var vindowWidthGuiLabel = 'windowWidth';
            var minWindowWidth = 1;
            var maxWindowWidth = stack.minMax[1] - stack.minMax[0];
            sliceFolder.add(stackHelper.slice, vindowWidthGuiLabel, minWindowWidth, maxWindowWidth).step(1).listen();
        }

        createWindowCenterSlider();

        function createWindowCenterSlider() {
            var windowCenterGuiLabel = 'windowCenter';
            var windowCenterMinValue = stack.minMax[0];
            var windowCenterMaxValue = stack.minMax[1];

            sliceFolder.add(stackHelper.slice, windowCenterGuiLabel, windowCenterMinValue, windowCenterMaxValue).step(1).listen();
        }

        addColorImageEventListeners();

        function addColorImageEventListeners() {
            sliceFolder.add(stackHelper.slice, 'intensityAuto').listen();
            sliceFolder.add(stackHelper.slice, 'invert');
        }

        sliceFolder.open();
    }

    createBorderBoxPanel();

    function createBorderBoxPanel() {
        var boundingBoxGuiLabel = 'Bounding Box';
        var bboxFolder = gui.addFolder(boundingBoxGuiLabel);

        createVisibleCheckBox();

        function createVisibleCheckBox() {
            var visibleGuiLabel = 'visible';
            bboxFolder.add(stackHelper.bbox, visibleGuiLabel);
        }

        createBorderBoxColorPicker();

        function createBorderBoxColorPicker() {
            var colorGuiLabel = 'color';
            bboxFolder.addColor(stackHelper.bbox, colorGuiLabel);
        }

        bboxFolder.open();
    }

    createBorder();

    function createBorder() {
        var borderFolder = createBorderPanel();

        function createBorderPanel() {
            var borderGuiLabel = 'Border';
            var borderFolder = gui.addFolder(borderGuiLabel);
            return borderFolder;
        }

        createVisibleBorderCheckBox();

        function createVisibleBorderCheckBox() {
            var visibleGuiLabel = 'visible';
            borderFolder.add(stackHelper.border, visibleGuiLabel);
        }

        createBorderColorPicker();

        function createBorderColorPicker() {
            var colorGuiLabel = 'color';
            borderFolder.addColor(stackHelper.border, colorGuiLabel);
        }

        borderFolder.open();
    }
}

function animate() {
    controls.update();
    renderer.render(scene, camera);

    // request new frame
    requestAnimationFrame(function () {
        animate();
    });
}

animate();

var loader = createLoader();

function createLoader() {
    var loader = new AMI.VolumeLoader(container);
    return loader;
}

var urlEndings = ['36444280', '36444294', '36444308', '36444322', '36444336', '36444350', '36444364', '36444378', '36444392', '36444406', '36444434', '36444448', '36444462', '36444476', '36444490', '36444504', '36444518', '36444532', '36746856'];
var files = urlEndings.map(function (currentUrlEnding) {
    var fileUrl = 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/';
    return fileUrl + currentUrlEnding;
});

loader.load(files).then(function () {
    var series = mergeFilesIntoACleanSeriesStackFrameStructure();

    function mergeFilesIntoACleanSeriesStackFrameStructure() {
        var series = loader.data[0].mergeSeries(loader.data);
        return series;
    }

    var stack = getCurrentStack();

    function getCurrentStack() {
        var stack = series[0].stack[0];
        return stack;
    }

    loader.free();
    loader = null;

    var stackHelper = createStackHelperToOperateEasilyWithCurrentImage();

    function createStackHelperToOperateEasilyWithCurrentImage() {
        var stackHelper = new AMI.StackHelper(stack);
        var greenColor = 0x8bc34a;
        var redColor = 0xf44336;
        stackHelper.bbox.color = greenColor;
        stackHelper.border.color = redColor;

        scene.add(stackHelper);
        return stackHelper;
    }

    gui(stackHelper);

    var centerLPS = centerCamera();

    function centerCamera() {
        var centerLPS = stackHelper.stack.worldCenter();
        camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
        camera.updateProjectionMatrix();
        return centerLPS;
    }

    centerImage();

    function centerImage() {
        controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
    }
}).catch(function (error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
});
//# sourceMappingURL=demo.js.map