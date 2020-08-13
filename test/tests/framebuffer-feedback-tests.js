import * as twgl from '../js/twgl-full.module.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('framebuffer feedback tests', () => {

  it('test feedback check', () => {
    const {gl, tagObject} = createContext();
    const vs = `
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 100.0;
    }
    `;

    const fs = `
    precision mediump float;
    uniform sampler2D u_diffuse;
    void main() {
      gl_FragColor = texture2D(u_diffuse, vec2(0));
    }
    `;

    const prg = twgl.createProgram(gl, [vs, fs]);
    tagObject(prg, 'fbPrg');

    const tex = gl.createTexture();
    tagObject(tex, 'fbTex');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const fb = gl.createFramebuffer();
    tagObject(fb, 'fbTest');
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    gl.useProgram(prg);
    assertThrowsWith(() => {
      gl.drawArrays(gl.POINTS, 0, 1);  // feedback
    }, [/fbPrg/, /fbTex/, /fbTest/, /u_diffuse/, /COLOR_ATTACHMENT0/]);
  });

});