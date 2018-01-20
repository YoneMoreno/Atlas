'use strict';

var _controls = require('../../src/controls/controls.trackball');

var _controls2 = _interopRequireDefault(_controls);

var _helpers = require('../../src/helpers/helpers.lut');

var _helpers2 = _interopRequireDefault(_helpers);

var _loaders = require('../../src/loaders/loaders.volume');

var _loaders2 = _interopRequireDefault(_loaders);

var _shaders = require('../../src/shaders/shaders.raycasting');

var _shaders2 = _interopRequireDefault(_shaders);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* globals Stats, dat*/

var glslify = require('glslify');

// standard global letiables
var controls = void 0,
    threeD = void 0,
    renderer = void 0,
    stats = void 0,
    camera = void 0,
    sceneRTT = void 0,
    sceneScreen = void 0,
    uniformsSecondPass = void 0;
var rtTexture = void 0;
var lut = void 0;
var ready = false;

var myStack = {
  lut: 'walking_dead',
  opacity: 'linear',
  steps: 256,
  alphaCorrection: 0.5,
  frequence: 0,
  amplitude: 0
};

function onMouseDown() {
  if (uniformsSecondPass) {
    uniformsSecondPass.uSteps.value = Math.floor(myStack.steps / 2);
  }
}

function onMouseUp() {
  if (uniformsSecondPass) {
    uniformsSecondPass.uSteps.value = myStack.steps;
  }
}

function onWindowResize() {
  // update the camera
  camera.aspect = threeD.offsetWidth / threeD.offsetHeight;
  camera.updateProjectionMatrix();

  // notify the renderer of the size change
  renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
}

function buildGUI() {
  var gui = new dat.GUI({
    autoPlace: false
  });

  var customContainer = document.getElementById('my-gui-container');
  customContainer.appendChild(gui.domElement);

  var stackFolder = gui.addFolder('Settings');
  var lutUpdate = stackFolder.add(myStack, 'lut', lut.lutsAvailable());
  lutUpdate.onChange(function (value) {
    lut.lut = value;
    uniformsSecondPass.uTextureLUT.value.dispose();
    uniformsSecondPass.uTextureLUT.value = lut.texture;
  });
  // init LUT
  lut.lut = myStack.lut;
  uniformsSecondPass.uTextureLUT.value.dispose();
  uniformsSecondPass.uTextureLUT.value = lut.texture;

  var opacityUpdate = stackFolder.add(myStack, 'opacity', lut.lutsAvailable('opacity'));
  opacityUpdate.onChange(function (value) {
    lut.lutO = value;
    uniformsSecondPass.uTextureLUT.value.dispose();
    uniformsSecondPass.uTextureLUT.value = lut.texture;
  });

  var stepsUpdate = stackFolder.add(myStack, 'steps', 0, 512).step(1);
  stepsUpdate.onChange(function (value) {
    if (uniformsSecondPass) {
      uniformsSecondPass.uSteps.value = value;
    }
  });

  var alphaCorrrectionUpdate = stackFolder.add(myStack, 'alphaCorrection', 0, 1).step(0.01);
  alphaCorrrectionUpdate.onChange(function (value) {
    if (uniformsSecondPass) {
      uniformsSecondPass.uAlphaCorrection.value = value;
    }
  });

  var frequenceUpdate = stackFolder.add(myStack, 'frequence', 0, 1).step(0.01);
  frequenceUpdate.onChange(function (value) {
    if (uniformsSecondPass) {
      uniformsSecondPass.uFrequence.value = value;
    }
  });

  var amplitudeUpdate = stackFolder.add(myStack, 'amplitude', 0, 0.5).step(0.01);
  amplitudeUpdate.onChange(function (value) {
    if (uniformsSecondPass) {
      uniformsSecondPass.uAmplitude.value = value;
    }
  });

  stackFolder.open();
}

function init() {

  // this function is executed on each animation frame
  function animate() {
    // render
    controls.update();

    if (ready) {
      renderer.render(sceneRTT, camera, rtTexture, true);
      renderer.render(sceneScreen, camera);
    }

    stats.update();

    // request new frame
    requestAnimationFrame(function () {
      animate();
    });
  }

  // renderer
  threeD = document.getElementById('r3d');
  renderer = new THREE.WebGLRenderer({
    alpha: true
  });
  renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
  threeD.appendChild(renderer.domElement);

  // stats
  stats = new Stats();
  threeD.appendChild(stats.domElement);

  // camera
  camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 0.1, 100000);
  camera.position.x = 166;
  camera.position.y = -471;
  camera.position.z = 153;
  camera.up.set(-0.42, 0.86, 0.26);

  // controls
  controls = new _controls2.default(camera, threeD);
  controls.rotateSpeed = 5.5;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;

  threeD.addEventListener('mousedown', onMouseDown, false);
  threeD.addEventListener('mouseup', onMouseUp, false);
  window.addEventListener('resize', onWindowResize, false);

  // start rendering loop
  animate();
}

window.onload = function () {

  // init threeJS
  init();

  var t2 = ['36444280', '36444294', '36444308', '36444322', '36444336', '36444350', '36444364', '36444378', '36444392', '36444406', '36444420', '36444434', '36444448', '36444462', '36444476', '36444490', '36444504', '36444518', '36444532', '36746856', '36746870', '36746884', '36746898', '36746912', '36746926', '36746940', '36746954', '36746968', '36746982', '36746996', '36747010', '36747024', '36748200', '36748214', '36748228', '36748270', '36748284', '36748298', '36748312', '36748326', '36748340', '36748354', '36748368', '36748382', '36748396', '36748410', '36748424', '36748438', '36748452', '36748466', '36748480', '36748494', '36748508', '36748522', '36748242', '36748256'];

  var files = t2.map(function (v) {
    return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v;
  });

  //   let data = [
  //  'scan-00109_rec-01a.nii_.gz'
  //   // '7002_t1_average_BRAINSABC.nii.gz'
  // ];

  // let files = data.map(function(v) {
  //   return '../../data/nii/' + v;
  // });

  // load sequence for each file
  // instantiate the loader
  // it loads and parses the dicom image
  // hookup a progress bar....
  var loader = new _loaders2.default(threeD);
  var seriesContainer = [];
  var loadSequence = [];
  files.forEach(function (url) {
    loadSequence.push(Promise.resolve()
    // fetch the file
    .then(function () {
      return loader.fetch(url);
    }).then(function (data) {
      return loader.parse(data);
    }).then(function (series) {
      seriesContainer.push(series);
    }).catch(function (error) {
      window.console.log('oops... something went wrong...');
      window.console.log(error);
    }));
  });

  // load sequence for all files
  Promise.all(loadSequence).then(function () {
    loader.free();
    loader = null;

    var series = seriesContainer[0].mergeSeries(seriesContainer)[0];
    // get first stack from series
    var stack = series.stack[0];
    // prepare and pack it
    stack.prepare();
    stack.pack();

    // box is centered on 0,0,0
    // we want first voxel of the box to be centered on 0,0,0
    // in IJK space
    var boxGeometry = new THREE.BoxGeometry(stack.dimensionsIJK.x - 1, stack.dimensionsIJK.y - 1, stack.dimensionsIJK.z - 1);

    // box is centered on 0,0,0
    // we want first voxel of the box to be centered on 0,0,0
    // in IJK space
    var offset = new THREE.Vector3(-0.5, -0.5, -0.5);
    boxGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(stack.halfDimensionsIJK.x + offset.x, stack.halfDimensionsIJK.y + offset.y, stack.halfDimensionsIJK.z + offset.z));

    // slice material
    var textures = [];
    for (var m = 0; m < stack._rawData.length; m++) {
      var tex = new THREE.DataTexture(stack.rawData[m], stack.textureSize, stack.textureSize, stack.textureType, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
      tex.needsUpdate = true;
      tex.flipY = true;
      textures.push(tex);
    }

    // Create first pass mesh, scene, and textyre to be rendered to
    //

    // material
    var uniformsFirstPass = _shaders2.default.firstPassUniforms();
    uniformsFirstPass.uWorldBBox.value = stack.worldBoundingBox();
    var materialFirstPass = new THREE.ShaderMaterial({
      uniforms: uniformsFirstPass,
      vertexShader: glslify('../../src/shaders/shaders.data.vert'),
      fragmentShader: glslify('../../src/shaders/shaders.raycasting.firstPass.frag'),
      side: THREE.BackSide
    });

    // mesh
    var boxMeshFirstPass = new THREE.Mesh(boxGeometry, materialFirstPass);
    // go the LPS space
    boxMeshFirstPass.applyMatrix(stack._ijk2LPS);

    // scene
    sceneRTT = new THREE.Scene();
    sceneRTT.add(boxMeshFirstPass);

    // target texture
    rtTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBFormat
    });

    // Create second pass mesh and scene
    //

    // material
    uniformsSecondPass = _shaders2.default.secondPassUniforms();
    uniformsSecondPass.uTextureSize.value = stack.textureSize;
    uniformsSecondPass.uTextureContainer.value = textures;
    uniformsSecondPass.uWorldToData.value = stack.lps2IJK;
    uniformsSecondPass.uNumberOfChannels.value = stack.numberOfChannels;
    uniformsSecondPass.uBitsAllocated.value = stack.bitsAllocated;
    uniformsSecondPass.uPackedPerPixel.value = stack.packedPerPixel;
    uniformsSecondPass.uWindowCenterWidth.value = [stack.windowCenter, stack.windowWidth * 0.8];
    uniformsSecondPass.uRescaleSlopeIntercept.value = [stack.rescaleSlope, stack.rescaleIntercept];
    uniformsSecondPass.uTextureBack.value = rtTexture;
    uniformsSecondPass.uWorldBBox.value = stack.worldBoundingBox();
    uniformsSecondPass.uDataDimensions.value = [stack.dimensionsIJK.x, stack.dimensionsIJK.y, stack.dimensionsIJK.z];
    uniformsSecondPass.uSteps.value = myStack.steps;

    // CREATE LUT
    lut = new _helpers2.default('my-lut-canvases');
    lut.luts = _helpers2.default.presetLuts();
    lut.lutsO = _helpers2.default.presetLutsO();

    uniformsSecondPass.uTextureLUT.value = lut.texture;
    uniformsSecondPass.uLut.value = 1;
    uniformsSecondPass.uAlphaCorrection.value = myStack.alphaCorrection;

    var materialSecondPass = new THREE.ShaderMaterial({
      uniforms: uniformsSecondPass,
      vertexShader: glslify('../../src/shaders/shaders.raycasting.secondPass.vert'),
      fragmentShader: glslify('../../src/shaders/shaders.raycasting.secondPass.frag'),
      side: THREE.FrontSide,
      transparent: true
    });

    // mesh
    var boxMeshSecondPass = new THREE.Mesh(boxGeometry, materialSecondPass);
    // go the LPS space
    boxMeshSecondPass.applyMatrix(stack._ijk2LPS);

    // scene
    sceneScreen = new THREE.Scene();
    sceneScreen.add(boxMeshSecondPass);

    // update camrea's and interactor's target
    var centerLPS = stack.worldCenter();
    camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    camera.updateProjectionMatrix();
    controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

    buildGUI();

    var screenshotElt = document.getElementById('screenshot');
    screenshotElt.addEventListener('click', function () {
      controls.update();

      if (ready) {
        renderer.render(sceneRTT, camera, rtTexture, true);
        renderer.render(sceneScreen, camera);
      }

      var screenshot = renderer.domElement.toDataURL();
      screenshotElt.download = 'VJS-' + Date.now() + '.png';
      screenshotElt.href = screenshot;
    });

    // good to go
    ready = true;
  }).catch(function (error) {
    return window.console.log(error);
  });
};
//# sourceMappingURL=vr_doublepass.js.map