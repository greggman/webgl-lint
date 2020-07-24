/* global console */

import * as twgl from '../js/twgl-full.module.js';
import {gl, tagObject} from '../shared.js';

export default [
  { desc: 'test naming objects',
    expect: [/my-test-prg/],
    func() {
      console.assert(gl.getExtension('OES_vertex_array_objects') === gl.getExtension('OES_vertex_array_objects'));
      console.assert(gl.getSupportedExtensions().includes('GMAN_debug_helper'));
      const p = gl.createProgram();
      tagObject(p, 'my-test-prg');
      gl.useProgram(p);
    },
  },
  { desc: 'test getting names of uniforms',
    expect: [/diffuseColor.*?NaN/],
    func() {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0);
          }
        `,
        `
          precision mediump float;
          uniform vec4 diffuseColor;
          void main() {
            gl_FragColor = diffuseColor;
          }
        `,
      ]);
      tagObject(prg, 'simple program');
      gl.useProgram(prg);
      const loc = gl.getUniformLocation(prg, 'diffuseColor');
      gl.uniform4fv(loc, [1, 2, 3, 4]);
      gl.uniform4fv(loc, [1, 2, 3 / 'foo', 4]);
    },
  },
  { desc: 'test large uniform',
    expect: [/diffuseColors.*?NaN/],
    func() {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0);
          }
        `,
        `
          precision mediump float;
          uniform vec4 diffuseColors[9];
          void main() {
            gl_FragColor = diffuseColors[8];
          }
        `,
      ]);
      tagObject(prg, 'simple program');
      gl.useProgram(prg);
      const loc = gl.getUniformLocation(prg, 'diffuseColors');
      const value = new Array(36).fill(0);
      value[33] = 3 / 'foo';
      gl.uniform4fv(loc, value);
    },
  },
];