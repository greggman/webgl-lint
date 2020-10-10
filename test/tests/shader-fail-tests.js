import { assertEqual, assertThrowsWith } from '../assert.js';
import * as twgl from '../js/twgl-full.module.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('shader fail tests', () => {

  it('fails on bad shader', () => {
    const {gl, tagObject} = createContext();
    const vs = `
    void main() {
      gl_Position = vec4(1) * 1; // BAD: vec4 * int
    }
    `;

    const sh = gl.createShader(gl.VERTEX_SHADER);
    tagObject(sh, 'myBadShader');
    gl.shaderSource(sh, vs);
    assertThrowsWith(() => {
      gl.compileShader(sh);
    }, [/myBadShader/]);
  });

  it('fails on bad program', () => {
    const {gl, tagObject} = createContext();
    const vs = `
    attribute vec4 position;
    void main() {
      gl_Position = vec4(1);
    }
    `;
    const fs = `
    precision mediump float;
    varying vec3 foo;  // BAD: no foo in vertex shader
    void main() {
      gl_FragColor = vec4(foo, 0);
    }
    `;

    const vShader = gl.createShader(gl.VERTEX_SHADER);
    tagObject(vShader, 'myGoodVertexShader');
    gl.shaderSource(vShader, vs);
    gl.compileShader(vShader);

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    tagObject(fShader, 'myGoodFragmentShader');
    gl.shaderSource(fShader, fs);
    gl.compileShader(fShader);

    const prg = gl.createProgram();
    tagObject(prg, 'myBadProgram');
    gl.attachShader(prg, vShader);
    gl.attachShader(prg, fShader);
    assertThrowsWith(() => {
      gl.linkProgram(prg);
    }, [
      /myBadProgram/,
      /myGoodVertexShader/,
      /myGoodFragmentShader/,
    ]);
  });

  it('does not fail if disabled', () => {
    const {gl, ext, tagObject} = createContext();
    if (!ext) {
      return;
    }
    ext.setConfiguration({
      failBadShadersAndPrograms: false,
    });

    {
      const vs = `
      void main() {
        gl_Position = vec4(1) * 1; // BAD: vec4 * int
      }
      `;

      const sh = gl.createShader(gl.VERTEX_SHADER);
      tagObject(sh, 'myBadShader');
      gl.shaderSource(sh, vs);
      gl.compileShader(sh);
      assertEqual(gl.getShaderParameter(sh, gl.COMPILE_STATUS), false);
    }
    {
      const vs = `
      attribute vec4 position;
      void main() {
        gl_Position = vec4(1);
      }
      `;
      const fs = `
      precision mediump float;
      varying vec3 foo;  // BAD: no foo in vertex shader
      void main() {
        gl_FragColor = vec4(foo, 0);
      }
      `;

      const vShader = gl.createShader(gl.VERTEX_SHADER);
      tagObject(vShader, 'myGoodVertexShader');
      gl.shaderSource(vShader, vs);
      gl.compileShader(vShader);

      const fShader = gl.createShader(gl.FRAGMENT_SHADER);
      tagObject(fShader, 'myGoodFragmentShader');
      gl.shaderSource(fShader, fs);
      gl.compileShader(fShader);

      const prg = gl.createProgram();
      tagObject(prg, 'myBadProgram');
      gl.attachShader(prg, vShader);
      gl.attachShader(prg, fShader);
      gl.linkProgram(prg);
      assertEqual(gl.getProgramParameter(prg, gl.LINK_STATUS), false);
    }
  });

});