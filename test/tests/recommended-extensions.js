import * as twgl from '../js/twgl-full.module.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../shared.js';

describe('unrenderable texture tests', () => {

  it('test OES_texture_float', () => {
    const {gl, tagObject} = createContext();

    const tex = gl.createTexture();
    tagObject(tex, 'floatTex');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    assertThrowsWith(() => {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
    }, [/OES_texture_float/]);

  });

  it('test oes_texture_float_linear', () => {
    const {gl, tagObject} = createContext();
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
      return;
    }

    const vs = `
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 10.0;
    }
    `;
    const fs = `
    precision mediump float;
    uniform sampler2D u_tex;
    void main() {
      gl_FragColor = texture2D(u_tex, vec2(0));
    }
    `;
    const prg = twgl.createProgram(gl, [vs, fs]);
    tagObject(prg, 'dummyPrg');

    const tex = gl.createTexture();
    tagObject(tex, 'floatTex');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, null);


    assertThrowsWith(() => {
      gl.drawArrays(gl.POINTS, 0, 1);
    }, [/OES_texture_float_linear/]);

  });

  it('test webgl_color_buffer_float', () => {
    const {gl, tagObject} = createContext();
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
      return;
    }

    const tex = gl.createTexture();
    tagObject(tex, 'floatTex');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    assertThrowsWith(() => {
      gl.clear(gl.COLOR_BUFFER_BIT);  // float is not renderable
    }, [/WEBGL_color_buffer_float/]);
  });

  it('test oes_element_index_uint', () => {
    const {gl, tagObject} = createContext();

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
    const prg = twgl.createProgram(gl, [vs, fs]);
    tagObject(prg, 'dummyPrg');

    function makeBuffer(gl, name, data, target = gl.ARRAY_BUFFER) {
      const buf = gl.createBuffer();
      tagObject(buf, name);
      gl.bindBuffer(target, buf);
      gl.bufferData(target, data, gl.STATIC_DRAW);
    }

    function makeBufferAndSetAttrib(gl, prg, name, size, data) {
      makeBuffer(gl, name, data);
      const loc = gl.getAttribLocation(prg, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }

    const positions = new Float32Array([0, 0, 1, 0, 0, 1]);
    makeBufferAndSetAttrib(gl, prg, 'position', 1, positions);
    makeBuffer(gl, 'indices', new Uint8Array([0]), gl.ELEMENT_ARRAY_BUFFER);

    assertThrowsWith(() => {
      gl.drawElements(gl.TRIANGLES, 1, gl.UNSIGNED_INT, 0);
    }, [/OES_element_index_uint/]);


  });

  it('test ext_color_buffer_float', () => {
    const {gl, tagObject} = createContext2();
    if (!gl) {
      return;
    }

    const fb = gl.createFramebuffer();
    tagObject(fb, 'floatFB');
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    tagObject(tex, 'floatTex');
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);

    assertThrowsWith(() => {
      gl.clear(gl.COLOR_BUFFER_BIT);  // float is not renderable
    }, [/EXT_color_buffer_float/]);
  });

});