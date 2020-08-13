import * as twgl from '../js/twgl-full.module.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('namings test', () => {

  it('test naming objects', () => {
    const {gl, tagObject} = createContext();
    // console.assert(gl.getExtension('OES_vertex_array_objects') === gl.getExtension('OES_vertex_array_objects'));
    // console.assert(gl.getSupportedExtensions().includes('GMAN_debug_helper'));
    const p = gl.createProgram();
    tagObject(p, 'my-test-prg');
    assertThrowsWith(() => {
      gl.useProgram(p);
    }, [/my-test-prg/]);
  });

  it('test getting names of uniforms', () => {
    const {gl, tagObject} = createContext();
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
    assertThrowsWith(() => {
      gl.uniform4fv(loc, [1, 2, 3 / 'foo', 4]);
    }, [/diffuseColor.*?NaN/]);
  });

  it('test large uniform', () => {
    const {gl, tagObject} = createContext();
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
    assertThrowsWith(() => {
      gl.uniform4fv(loc, value);
    }, [/diffuseColors.*?NaN/]);
  });

});