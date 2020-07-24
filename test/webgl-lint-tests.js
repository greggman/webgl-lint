/* global console */
/* global document */
/* global setTimeout */
/* global URLSearchParams */
/* global window */

import {config} from './assert.js';
import {resetContexts, escapeRE} from './shared.js';

const settings = Object.fromEntries(new URLSearchParams(window.location.search).entries());
const testGrepRE = new RegExp(escapeRE(settings.grep || ''));

import drawingTests from './tests/drawing-test.js';
import namingTests from './tests/naming-tests.js';
import enumTests from './tests/enum-tests.js';
import badDataTests from './tests/bad-data-tests.js';
import dataViewTests from './tests/data-view-tests.js';
import unsetUniformTests from './tests/unset-uniform-tests.js';
import zeroMatrixTests from './tests/zero-matrix-tests.js';
import ignoreUniformsTests from './tests/ignore-uniforms-tests.js';
import reportVaoTests from './tests/report-vao-tests.js';
import extensionEnumTests from './tests/extension-enum-tests.js';
import framebufferFeedbackTests from './tests/framebuffer-feedback-tests.js';
import bufferOverflowTests from './tests/buffer-overflow-tests.js';
import wrongNumberOfArgumentsTests from './tests/wrong-number-of-arguments-tests.js';
import unnamedObjectsTests from './tests/unnamed-objects-tests.js';
import drawReportsProgramAndVaoTests from './tests/draw-reports-program-and-vao-tests.js';
import uniformMismatchTests from './tests/uniform-mismatch-tests.js';
import uniformXXvTests from './tests/uniformXXv-tests.js';
import arraysWithOffsetsTests from './tests/arrays-with-offsets-tests.js';
import disableTests from './tests/disable-tests.js';

const tests = [
  ...drawingTests,
  ...namingTests,
  ...enumTests,
  ...badDataTests,
  ...dataViewTests,
  ...unsetUniformTests,
  ...zeroMatrixTests,
  ...ignoreUniformsTests,
  ...reportVaoTests,
  ...extensionEnumTests,
  ...framebufferFeedbackTests,
  ...bufferOverflowTests,
  ...wrongNumberOfArgumentsTests,
  ...unnamedObjectsTests,
  ...drawReportsProgramAndVaoTests,
  ...uniformMismatchTests,
  ...uniformXXvTests,
  ...arraysWithOffsetsTests,
  ...disableTests,
];

function fail(...args) {
  logImpl('red', 'FAIL:', ...args);
}

function pass(...args) {
  logImpl('green', 'PASS:', ...args);
}

/*
function log(...args) {
  logImpl('inherit', ...args);
}
*/

function logImpl(color, ...args) {
  const elem = document.createElement('pre');
  elem.style.color = color;
  elem.textContent = args.join(' ');
  document.body.appendChild(elem);
}

function check(expect, actual, desc) {
  const actualNoBreaks = actual.replace(/\n/g, ' ');
  for (const expected of expect) {
    if (!expected.test(actualNoBreaks)) {
      fail(desc, ': expected:', expected, 'actual:', actual);
      return false;
    }
  }
  return true;
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  for (const {desc, expect, func, test} of tests) {
    if (!testGrepRE.test(desc)) {
      continue;
    }
    console.log(`\n\n--------------[ ${desc} ]---------------`);
    if (func) {
      let actual = 'undefined';
      if (config.throwOnError === false) {
        const origFn = console.error;
        let errors = [];
        console.error = function(...args) {
          errors.push(args.join(' '));
        };
        func();
        console.error = origFn;
        if (errors.length) {
          actual = errors.join('\n');
          console.error(actual);
        }
      } else {
        try {
          func();
        } catch(e) {
          console.error(e);
          actual = e.toString();
        }
      }
      
      if (check(expect, actual, desc)) {
        pass(desc);
      }
    } else if (test) {
      try {
        test();
        pass(desc);
      } catch (e) {
        console.error(e);
        fail(desc, e);
      }
    } else {
      fail(desc, 'no test');
    }

    resetContexts();
    await wait();
  }
}
runTests();