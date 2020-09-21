import * as twgl from '../js/twgl-full.module.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('uniform type tests', () => {

  it('test uniform fails if array of arrays passed to v func', () => {
    const {gl, tagObject} = createContext();
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0, 0, 0, 1);
        }
      `,
      `
        precision mediump float;
        uniform vec3 pointColor[4];
        void main() {
          gl_FragColor = vec4(pointColor[3], 1);
        }
      `,
    ]);
    tagObject(prg, 'point program');
    gl.useProgram(prg);
    const loc = gl.getUniformLocation(prg, 'pointColor');
    const value = [
      [1, 2, 3],
      [5, 6, 7],
      [9, 10, 11],
      [13, 14, 15],
    ];
    assertThrowsWith(() => {
      gl.uniform3fv(loc, value);
    }, [/point program/, /pointColor/, /flat arrays/]);
  });

});