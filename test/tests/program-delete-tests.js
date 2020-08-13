import * as twgl from '../js/twgl-full.module.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('program re-link/delete tests', () => {

  it('test program re-link/delete', () => {
    const {gl, tagObject} = createContext();
    const vs = `
    attribute vec4 position;
    attribute vec2 texcoord;
    attribute vec4 color;

    varying vec4 v_color;
    varying vec2 v_texcoord;

    void main() {
      gl_Position = position;
      v_color = color;
      v_texcoord = texcoord;
    }
    `;

    const fs = `
    precision mediump float;

    varying vec4 v_color;
    varying vec2 v_texcoord;
    uniform float u_mult;

    uniform sampler2D u_diffuse;

    void main() {
      gl_FragColor = texture2D(u_diffuse, v_texcoord) * v_color * u_mult;
    }
    `;

    const prg = twgl.createProgram(gl, [vs, fs]);
    tagObject(prg, 'prgToDelete');
    gl.linkProgram(prg);
    gl.deleteProgram(prg);

    const prg2 = twgl.createProgram(gl, [vs, fs]);
    tagObject(prg2, 'prgToDelete2');
    gl.getUniformLocation(prg2, 'u_mult');
    gl.getUniformLocation(prg2, 'u_mult');  // double lookup is intentional
    gl.getUniformLocation(prg2, 'u_diffuse');
    gl.getUniformLocation(prg2, 'u_notExist');
    gl.linkProgram(prg2);
    gl.getUniformLocation(prg2, 'u_mult');
    gl.getUniformLocation(prg2, 'u_mult');  // double lookup is intentional
    gl.getUniformLocation(prg2, 'u_diffuse');
    gl.getUniformLocation(prg2, 'u_notExist');
    gl.deleteProgram(prg2);
  });

});