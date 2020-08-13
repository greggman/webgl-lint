import * as twgl from '../js/twgl-full.module.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext, not} from '../webgl.js';

describe('zero matrix tests', () => {

  it('test zero matrix', () => {
    const {gl, tagObject} = createContext();
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
    assertThrowsWith(() => {
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'perspective'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
    }, [
      /perspective/,
      not('view'),
      not('model'),
    ]);
  });

  it('test zero matrix disabled', () => {
    const {gl, ext, tagObject} = createContext();
    if (ext) {
      ext.setConfiguration({failZeroMatrixUniforms: false});
    }
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
  });

});