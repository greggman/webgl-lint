import * as twgl from '../js/twgl-full.module.js';
import {assertEqual} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext2} from '../webgl.js';

describe('uniform buffer tests', () => {

  it('test it does not warn about uniforms in UBOs when linking', () => {
    const {gl, ext, tagObject} = createContext2();
    ext.setConfiguration({failUndefinedUniforms: true});
    const prg = twgl.createProgram(gl, [
      `#version 300 es
        uniform Foo {
          vec4 bar;
          vec4 moo;
        };
       
        void main() {
           gl_Position = bar + moo;
        }
      `,
      `#version 300 es
        precision mediump float;
        uniform vec4 pointColor;
        out vec4 fragColor;
        void main() {
          fragColor = pointColor;
        }
      `,
    ]);
    tagObject(prg, 'ubo program');
    gl.useProgram(prg);
    assertEqual(gl.getError(), gl.NO_ERROR);
  });


});