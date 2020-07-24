import * as twgl from '../js/twgl-full.module.js';
import {gl, tagObject} from '../shared.js';

export default [
  { desc: 'test uniform mis-match',
    expect: [/vec4 which is wrong for uniform3fv/],
    func() {
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
      gl.uniform3fv(loc, [1, 0.7, .5]); // error, needs to be 4fv
    },
  },
];