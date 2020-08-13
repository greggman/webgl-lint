import * as twgl from '../js/twgl-full.module.js';
import assert from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('uniform mismatch tests', () => {
  it('test uniform mis-match', () => {
    const {gl, tagObject} = createContext();
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0, 0, 0, 1);
        }
      `,
      `
        precision mediump float;
        uniform vec4 pointColor;
        void main() {
          gl_FragColor = pointColor;
        }
      `,
    ]);
    tagObject(prg, 'point program');
    gl.useProgram(prg);
    const loc = gl.getUniformLocation(prg, 'pointColor');
    assert.throwsWith(() => {
      gl.uniform3fv(loc, [1, 0.7, .5]); // error, needs to be 4fv
    }, [/vec4 which is wrong for uniform3fv/]);
  });

});