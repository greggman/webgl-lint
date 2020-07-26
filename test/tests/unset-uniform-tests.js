/* global document */

import * as twgl from '../js/twgl-full.module.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {gl, tagObject, not} from '../shared.js';

describe('unset uniform tests', () => {

  it('test unset uniforms base', () => {
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0);
           gl_PointSize = 1.0;
        }
      `,
      `
        precision mediump float;
        uniform vec4 diffuseColor;
        uniform vec4 ambient;
        uniform sampler2D diffuseTex;
        void main() {
          gl_FragColor = diffuseColor + ambient + texture2D(diffuseTex, vec2(0));
        }
      `,
    ]);
    tagObject(prg, 'uniforms-program');

    // bind a texture so we don't get an error about the texture missing
    const tex = gl.createTexture();
    tagObject(tex, 'onePixelTexture');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.useProgram(prg);
    assertThrowsWith(() => {
      gl.drawArrays(gl.POINTS, 0, 1);  // error, unset uniforms
    }, [
      /ambient/,
      /diffuseColor/,
      not('diffuseTex'),
    ]);
  });

  it('test unset uniforms array', () => {
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0);
           gl_PointSize = 1.0;
        }
      `,
      `
        precision mediump float;
        uniform vec4 diffuseColor[3];
        uniform vec4 ambient[4];
        uniform vec4 emissive[4];
        void main() {
          gl_FragColor = diffuseColor[2] + ambient[3] + emissive[3];
        }
      `,
    ]);
    tagObject(prg, 'uniforms-program');
    gl.useProgram(prg);
    gl.uniform4fv(gl.getUniformLocation(prg, 'diffuseColor'), new Float32Array(16));
    gl.uniform4fv(gl.getUniformLocation(prg, 'ambient[0]'), new Float32Array(4));
    gl.uniform4fv(gl.getUniformLocation(prg, 'ambient[1]'), new Float32Array(4));
    gl.uniform4fv(gl.getUniformLocation(prg, 'ambient[2]'), new Float32Array(4));
    gl.uniform4f(gl.getUniformLocation(prg, 'ambient[3]'), 2, 3, 4, 5);
    gl.uniform4fv(gl.getUniformLocation(prg, 'emissive[3]'), [1, 2, 3, 4]);
    gl.uniform4fv(gl.getUniformLocation(prg, 'emissive[0]'), [1, 2, 3, 4]);
    assertThrowsWith(() => {
      gl.drawArrays(gl.POINTS, 0, 1);  // error, unset uniforms
    }, [
      /emissive\[1\]/,
      /emissive\[2\]/,
      not('emissive"'),
      not('emissive[0]'),
      not('emissive[3]'),
      not('diffuseColor'),
      not('ambient'),
    ]);
  });

  it('test unset uniform sampler', () => {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl.getExtension('GMAN_debug_helper');
    if (ext) {
      ext.setConfiguration({failUnsetSamplerUniforms: true});
    }
    const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0);
           gl_PointSize = 1.0;
        }
      `,
      `
        precision mediump float;
        uniform vec4 diffuseColor;
        uniform vec4 ambient;
        uniform sampler2D diffuseTex;
        void main() {
          gl_FragColor = diffuseColor + ambient + texture2D(diffuseTex, vec2(0));
        }
      `,
    ]);
    tagObject(prg, 'uniforms-program-with-samplers');
    gl.useProgram(prg);

    // bind a texture so we don't get an error about the texture missing
    const tex = gl.createTexture();
    tagObject(tex, 'onePixelTexture');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    assertThrowsWith(() => {
      gl.drawArrays(gl.POINTS, 0, 1);  // error, unset uniforms
    }, [/ambient/, /diffuseColor/, /diffuseTex/]);
  });

});