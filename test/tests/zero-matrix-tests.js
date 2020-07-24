/* global document */

import * as twgl from '../js/twgl-full.module.js';
import {gl, tagObject, not} from '../shared.js';

export default [
  {
    desc: 'test zero matrix',
    expect: [/perspective/, not('view'), not('model')],
    func() {
      const prg = twgl.createProgram(gl, [
        `
          attribute vec4 position;
          uniform mat4 perspective;
          uniform mat4 view;
          uniform mat4 model;
          void main() {
             gl_Position = perspective * view * model * position;
          }
        `,
        `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(0);
          }
        `,
      ]);
      tagObject(prg, 'uniforms-with-matrices');
      gl.useProgram(prg);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'model'), false, [
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'view'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'perspective'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
    },
  },
  {
    desc: 'test zero matrix disabled',
    expect: [/undefined/],
    func() {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl.getExtension('GMAN_debug_helper');
      if (ext) {
        ext.setConfiguration({failZeroMatrixUniforms: false});
      }
      const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
      const prg = twgl.createProgram(gl, [
        `
          attribute vec4 position;
          uniform mat4 perspective;
          uniform mat4 view;
          uniform mat4 model;
          void main() {
             gl_Position = perspective * view * model * position;
          }
        `,
        `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(0);
          }
        `,
      ]);
      tagObject(prg, 'uniforms-with-matrices');
      gl.useProgram(prg);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'model'), false, [
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'view'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'perspective'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
    },
  },
];