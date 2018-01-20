'use strict';

/* globals dat, AMI*/

var newRenderer = setRenderer();
var container = newRenderer.container;
var renderer = newRenderer.renderer;
var scene = new THREE.Scene();
var camera = setCamera();
var controls = setControls();

function onWindowResize() {
    var numberOfDirectionsToRecalculateZoom = 2;

    camera.canvas = {
        width: container.offsetWidth,
        height: container.offsetHeight
    };
    camera.fitBox(numberOfDirectionsToRecalculateZoom);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

var attachEventListenerOnWindowLoad = true;
window.addEventListener('resize', onWindowResize, attachEventListenerOnWindowLoad);

function gui(stackHelper) {
    var myGuiContainerId = 'my-gui-container';
    var gui = new dat.GUI({
        autoPlace: false
    });

    var customContainer = document.getElementById(myGuiContainerId);
    customContainer.appendChild(gui.domElement);

    var camUtils = {
        Invertir_Eje_X: false,
        Invertir_Eje_Y: false,
        Rotar_Derecha: false,
        rotate: 0,
        Orientacion: 'axial',
        Convencion: 'radio'
    };

    var cameraFolder = gui.addFolder('Camera');
    var Invertir_Eje_X = cameraFolder.add(camUtils, 'Invertir_Eje_X');
    Invertir_Eje_X.onChange(function () {
        camera.invertRows();
    });

    var Invertir_Eje_Y = cameraFolder.add(camUtils, 'Invertir_Eje_Y');
    Invertir_Eje_Y.onChange(function () {
        camera.invertColumns();
    });

    var Rotar_Derecha = cameraFolder.add(camUtils, 'Rotar_Derecha');
    Rotar_Derecha.onChange(function () {
        camera.rotate();
    });

    cameraFolder.add(camera, 'angle', 0, 360).step(1).listen();

    var Orientacion = 'Orientacion';
    var medicalImageAxisNames = ['axial', 'coronal', 'sagittal'];

    var orientationUpdate = cameraFolder.add(camUtils, Orientacion, medicalImageAxisNames);
    orientationUpdate.onChange(function (value) {
        camera.orientation = value;
        camera.update();
        var numberOfDirectionsToRecalculateCameraDimension = 2;
        camera.fitBox(numberOfDirectionsToRecalculateCameraDimension);
        stackHelper.orientation = camera.stackOrientation;
    });

    var medicalConvention = 'Convencion';
    var modesToVisualizeImage = ['radio', 'neuro'];

    var conventionUpdate = cameraFolder.add(camUtils, medicalConvention, modesToVisualizeImage);
    conventionUpdate.onChange(function (value) {
        camera.convention = value;
        camera.update();
        camera.fitBox(2);
    });

    cameraFolder.open();

    var stackFolder = gui.addFolder('Stack');

    var guiIndexLabel = 'index';
    var firstSeriesImage = 0;
    var lastSeriesImage = Math.max(stackHelper.stack.dimensionsIJK.x - 1, stackHelper.stack.dimensionsIJK.y - 1, stackHelper.stack.dimensionsIJK.z - 1);
    stackFolder.add(stackHelper, guiIndexLabel, firstSeriesImage, lastSeriesImage).step(1).listen();

    var modeToApplySlicing = 'interpolation';
    var minValue = 0;
    var maxValue = 1;
    stackFolder.add(stackHelper.slice, modeToApplySlicing, minValue, maxValue).step(1).listen();
    stackFolder.open();
}

function animate() {
    controls.update();
    renderer.render(scene, camera);

    requestAnimationFrame(function () {
        animate();
    });
}

animate();

var loader = new AMI.VolumeLoader(container);
var file = 'https://cdn.rawgit.com/FNNDSC/data/master/nifti/adi_brain/adi_brain.nii.gz';

loader.load(file).then(function () {

    var series = mergeFilesIntoCleanSeriesStackFrameStructure();
    var stack = createStackOfASeriesOfImages();
    detachLoaderAndProgressBarFromDOM();
    var stackHelper = createStackHelperToManipulateOrientationAndSliceDisplayed();

    stackHelper.bbox.visible = false;
    var orangeColor = 0xff9800;
    stackHelper.border.color = orangeColor;
    scene.add(stackHelper);
    gui(stackHelper, 'my-gui-container');

    var worldbb = stack.worldBoundingBox();
    var adjustBorderBoxStackHelperDimensionsToFitInWindow = new THREE.Vector3(worldbb[1] - worldbb[0], worldbb[3] - worldbb[2], worldbb[5] - worldbb[4]);
    var lpsDims = adjustBorderBoxStackHelperDimensionsToFitInWindow;

    var box = {
        center: stack.worldCenter().clone(),
        halfDimensions: new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10)
    };

    var initCanvasAndZoom = {
        width: container.clientWidth,
        height: container.clientHeight
    };

    var ratioBetweenTheAdjacentCatechusAndHypotenuse = [stack.xCosine, stack.yCosine, stack.zCosine];
    camera.directions = ratioBetweenTheAdjacentCatechusAndHypotenuse;
    camera.box = box;
    camera.canvas = initCanvasAndZoom;
    camera.update();
    var numberOfDirectionsToRecalculateZoom = 2;
    camera.fitBox(numberOfDirectionsToRecalculateZoom);

    function mergeFilesIntoCleanSeriesStackFrameStructure() {
        var target = 0;
        var series = loader.data[target].mergeSeries(loader.data);
        return series;
    }

    function createStackOfASeriesOfImages() {
        return series[0].stack[0];
    }

    function detachLoaderAndProgressBarFromDOM() {
        loader.free();
    }

    function createStackHelperToManipulateOrientationAndSliceDisplayed() {
        return new AMI.StackHelper(stack);
    }
}).catch(function (error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
});

function setRenderer() {
    var container = document.getElementById('container');
    var smoothBorders = true;

    var renderer = new THREE.WebGLRenderer({
        antialias: smoothBorders
    });
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    var blackColor = 0x353535;
    var alpha = 1;

    renderer.setClearColor(blackColor, alpha);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    return { container: container, renderer: renderer };
}

function setCamera() {

    var left = container.clientWidth / -2;
    var right = container.clientWidth / 2;
    var top = container.clientHeight / 2;
    var bottom = container.clientHeight / -2;
    var near = 0.1;
    var far = 10000;

    return new AMI.OrthographicCamera(left, right, top, bottom, near, far);
}

function setControls() {
    var controls = new AMI.TrackballOrthoControl(camera, container);
    controls.staticMoving = true;
    controls.noRotate = true;
    camera.controls = controls;
    return controls;
}
//# sourceMappingURL=demo.js.map