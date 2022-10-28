/* global mocha */
/* global URLSearchParams */
/* global window */

import './tests/arrays-with-offsets-tests.js';
import './tests/bad-data-tests.js';
import './tests/buffer-overflow-tests.js';
import './tests/data-view-tests.js';
import './tests/disable-tests.js';
import './tests/draw-reports-program-and-vao-tests.js';
import './tests/drawing-test.js';
import './tests/framebuffer-feedback-tests.js';
import './tests/enum-tests.js';
import './tests/extension-enum-tests.js';
import './tests/ignore-uniforms-tests.js';
import './tests/naming-tests.js';
import './tests/program-delete-tests.js';
import './tests/report-vao-tests.js';
import './tests/shader-fail-tests.js';
import './tests/undefined-uniform-tests.js';
import './tests/uniform-buffer-tests.js';
import './tests/uniform-mismatch-tests.js';
import './tests/uniform-type-tests.js';
import './tests/uniformXXv-tests.js';
import './tests/untagged-objects-tests.js';
import './tests/unrenderable-texture-tests.js';
import './tests/unset-uniform-tests.js';
import './tests/wrong-number-of-arguments-tests.js';
import './tests/zero-matrix-tests.js';

const settings = Object.fromEntries(new URLSearchParams(window.location.search).entries());
if (settings.reporter) {
  mocha.reporter(settings.reporter);
}
mocha.run((failures) => {
  window.testsPromiseInfo.resolve(failures);
});
