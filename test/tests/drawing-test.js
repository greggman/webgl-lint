import * as twgl from '../js/twgl-full.module.js';
import {describe, it} from '../mocha-support.js';
import {gl, tagObject} from '../shared.js';

describe('test drawing', () => {
  it('draws', () => {
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0, 0, 0, 1);
           gl_PointSize = 128.0;
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
    gl.uniform4fv(loc, [1, 0.7, .5, 1]);
    gl.drawArrays(gl.POINTS, 0, 1);
  });
});
