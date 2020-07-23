import * as twgl from '../js/twgl-full.module.js';
import {gl, tagObject} from '../shared.js';

export default [
  {
    desc: 'test arrays when uniformXXv has offset',
    expect: [/element 13 of argument 1 is undefined/],
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
      const array = new Array(16).fill(1);
      array[13] = undefined;
      gl.uniform4fv(loc, array, 12);
    },
  },
  {
    desc: 'test arrays when uniformXXv has offset and length',
    expect: [/element 9 of argument 1 is undefined/],
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
      const array = new Array(16).fill(1);
      array[9] = undefined;
      gl.uniform4fv(loc, array, 8, 4);
    },
  },
];