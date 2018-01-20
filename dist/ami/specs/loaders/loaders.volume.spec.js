'use strict';

var _loaders = require('../../src/loaders/loaders.volume');

var _loaders2 = _interopRequireDefault(_loaders);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Volume Loader', function () {
  var loader = void 0;
  var eventsHandleSpy = {};
  var sourceUrl = '/base/data/dicom/adi_slice.dcm';
  var baseSinonMatch = new sinon.match({ file: sourceUrl }).and(new sinon.match.hasOwn('time'));

  beforeEach(function () {
    loader = new _loaders2.default();
    // setup event handle spy
    ['load-start', 'fetch-start', 'fetch-success', 'fetch-error', 'fetch-abort', 'fetch-timeout', 'fetch-progress', 'fetch-end', 'parse-start', 'parsing', 'parse-success', 'parse-error'].map(function (evtName) {
      eventsHandleSpy[evtName] = new sinon.spy();
      loader.on(evtName, eventsHandleSpy[evtName]);
    });
  });

  afterEach(function () {
    loader = null;
  });

  describe('parse data', function () {
    it('give a single url', function (done) {
      loader.load(sourceUrl).then(function (data) {
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(1);
        // just test events of parse, the other events test at loader.base.spec.js
        sinon.assert.calledWith(eventsHandleSpy['parse-start'], baseSinonMatch);
        sinon.assert.calledWith(eventsHandleSpy['parsing'], baseSinonMatch.and(new sinon.match.hasOwn('total')).and(new sinon.match.hasOwn('parsed')));
        sinon.assert.calledWith(eventsHandleSpy['parse-success'], baseSinonMatch.and(new sinon.match.hasOwn('total')).and(new sinon.match.hasOwn('parsed')));
        done();
      });
    });

    it('give urls with array', function (done) {
      var urls = ['/base/data/dicom/adi_slice.dcm', '/base/data/nifti/adi_slice.nii'];
      loader.load(urls).then(function (data) {
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(2);
        done();
      });
    });
  });
}); /* globals describe, fdescribe, it, fit, expect, beforeEach*/
//# sourceMappingURL=loaders.volume.spec.js.map