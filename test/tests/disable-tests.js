/* global document */

import * as twgl from '../js/twgl-full.module.js';
import {assertEqual, assertNotEqual} from '../assert.js';
import {describe, it} from '../mocha-support.js';

describe('disable tests', () => {

  it('test disable', () => {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl.getExtension('GMAN_debug_helper');
    if (!ext) {
      return;
    }
    const vaoExt = gl.getExtension('OES_vertex_array_objects');
    const before = gl.bufferData.toString();
    const beforeVAO = vaoExt ? vaoExt.createVertexArrayOES.toString() : 'b4';
    ext.disable();
    const after = gl.bufferData.toString();
    const afterVAO = vaoExt ? vaoExt.createVertexArrayOES.toString() : 'af';
    assertNotEqual(before, after);
    assertNotEqual(beforeVAO, afterVAO);
  });

  it('test disable on maxDrawCalls', () => {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl.getExtension('GMAN_debug_helper');
    if (!ext) {
      return;
    }
    ext.setConfiguration({
      maxDrawCalls: 2,
    });

    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0, 0, 0, 1);
           gl_PointSize = 128.0;
        }
      `,
      `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(0);
        }
      `,
    ]);
    gl.useProgram(prg);
    const before = gl.bufferData.toString();
    gl.drawArrays(gl.POINTS, 0, 1);
    const between = gl.bufferData.toString();
    assertEqual(before, between);
    gl.drawArrays(gl.POINTS, 0, 1);
    const after = gl.bufferData.toString();
    assertNotEqual(before, after);
  });

});