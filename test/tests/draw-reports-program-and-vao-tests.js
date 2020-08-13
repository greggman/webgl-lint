import * as twgl from '../js/twgl-full.module.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext2} from '../shared.js';

describe('draw reports program and vao tests', () => {

  it('test drawArrays with bad enum reports program and vao', () => {
    const {gl, tagObject} = createContext2();
    if (!gl) {
      throw new Error('drawArraysBE vaoBE');
    }

    const vs = `
    attribute vec4 position;

    void main() {
      gl_Position = position;
    }
    `;

    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0);
    }
    `;

    const vao = gl.createVertexArray();
    //      tagObject(vao, 'vaoBE');
    gl.bindVertexArray(vao);
    const prg = twgl.createProgram(gl, [vs, fs]);
    tagObject(prg, 'drawArraysBE');

    gl.useProgram(prg);
    assertThrowsWith(() => {
      gl.drawArrays(gl.TRAINGLES, 0, 1); // error, TRIANGLES misspelled.
    }, [/drawArraysBE/, /WebGLVertexArrayObject\("\*unnamed\*"\)/]);
  });

});