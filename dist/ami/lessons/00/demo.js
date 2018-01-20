'use strict';

/* globals AMI*/

var container = getElementToContainProgressBar();

function getElementToContainProgressBar() {
    return document.getElementById('container');
}

var loader = getLoader();

function getLoader() {
    return new AMI.VolumeLoader(container);
}

var t2 = setDataURLTermination();

function setDataURLTermination() {
    return ['36444280', '36444294', '36444308', '36444322', '36444336', '36444350', '36444364', '36444378', '36444392', '36444406', '36444434', '36444448', '36444462', '36444476', '36444490', '36444504', '36444518', '36444532', '36746856'];
}

var files = getFiles();

function getFiles() {
    return t2.map(function (currentTermination) {
        return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + currentTermination;
    });
}

loader.load(files).then(function () {

    var series = loader.data[0].mergeSeries(loader.data);
    loader.free();
    loader = null;

    displaySeriesInfo(series);
}).catch(function (error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
});

function displaySeriesInfo(series) {
    var seriesIndex = 1;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = series[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var mySeries = _step.value;

            var seriesDiv = document.createElement('div');
            seriesDiv.className += 'indent';
            seriesDiv.insertAdjacentHTML('beforeend', '<div> SERIES (' + seriesIndex + '/' + series.length + ')</div>');
            seriesDiv.insertAdjacentHTML('beforeend', '<div class="series"> numberOfChannels: ' + mySeries.numberOfChannels + '</div>');

            container.appendChild(seriesDiv);

            displayStackInfo(mySeries, seriesDiv);

            seriesIndex++;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
}

function displayStackInfo(mySeries, seriesDiv) {
    var stackIndex = 1;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = mySeries.stack[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var myStack = _step2.value;

            var _stackDiv = document.createElement('div');
            _stackDiv.className += 'indent';
            _stackDiv.insertAdjacentHTML('beforeend', '<div> STACK (' + stackIndex + '/' + mySeries.stack.length + ')</div>');
            _stackDiv.insertAdjacentHTML('beforeend', '<div class="stack"> bitsAllocated: ' + myStack.bitsAllocated + '</div>');

            seriesDiv.appendChild(_stackDiv);

            displayFrameInfo(myStack, _stackDiv);

            stackIndex++;
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    return { stackIndex: stackIndex, stackDiv: stackDiv };
}

function displayFrameInfo(myStack, stackDiv) {
    var frameIndex = 1;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = myStack.frame[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var myFrame = _step3.value;

            var frameDiv = document.createElement('div');
            frameDiv.className += 'indent';
            frameDiv.insertAdjacentHTML('beforeend', '<div> FRAME (' + frameIndex + '/' + myStack.frame.length + ')</div>');
            frameDiv.insertAdjacentHTML('beforeend', '<div class="frame"> instanceNumber: ' + myFrame.instanceNumber + '</div>');

            stackDiv.appendChild(frameDiv);
            frameIndex++;
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return { frameIndex: frameIndex };
}
//# sourceMappingURL=demo.js.map