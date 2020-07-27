/* global document */

import * as twgl from '../js/twgl-full.module.js';
import {assertThrowsWith} from '../assert.js';
import {before, afterEach, describe, it} from '../mocha-support.js';
import {createContexts, resetContexts, contexts as globalContexts} from '../shared.js';

describe('unrenderable texture tests', () => {

  function addTests(contexts) {

    it('test no texture, incomplete texture, non-power-of-2-texture', () => {
      const {gl, tagObject} = contexts;
      const vs = `
      void main() {
        gl_Position = vec4(0);
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
      tagObject(prg, 'texPrg');
      gl.useProgram(prg);

      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/no texture/]);

      const tex = gl.createTexture();
      tagObject(tex, 'testTex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 3, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/not CLAMP_TO_EDGE/]);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);

      gl.generateMipmap(gl.TEXTURE_2D);
      gl.drawArrays(gl.POINTS, 0, 1);
    });

    it('test int textures', () => {
      const {gl2: gl, tagObject2: tagObject} = contexts;
      if (!gl) {
        return;
      }

      const vs = `#version 300 es
      void main() {
        gl_Position = vec4(0);
      }
      `;

      const fs = `#version 300 es
      precision mediump float;
      uniform highp isampler2D u_data;
      out vec4 outColor;
      void main() {
        outColor = vec4(texture(u_data, vec2(0)));
      }
      `;

      const prg = twgl.createProgram(gl, [vs, fs]);
      tagObject(prg, 'intPrg');
      gl.useProgram(prg);

      const tex = gl.createTexture();
      tagObject(tex, 'intTex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32I, 2, 2, 0, gl.RGBA_INTEGER, gl.INT, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/texture of type \(RGBA32I\) is not filterable/]);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, 2, 2, 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/uniform isampler2D needs a int texture but WebGLTexture\(.*?\) on texture unit 0 is unsigned int texture/]);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/isampler2D needs a int texture but WebGLTexture\("intTex"\) on texture unit 0 is float\/normalized texture \(RGBA8\)/]);
    });

    it('test float texture filtering webgl1', () => {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl.getExtension('GMAN_debug_helper');
      const tagObject = ext ? ext.tagObject.bind(ext) : () => {};

      const tex = gl.createTexture();
      tagObject(tex, 'floatTex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      assertThrowsWith(() => {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, null);  // error, float not support
      }, [/INVALID_ENUM/]);

      const oesTextureFloat = gl.getExtension('OES_texture_float');
      if (oesTextureFloat) {
        return;
      }

      // should be ok
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, null);

      const vs = `
      void main() {
        gl_Position = vec4(0);
      }
      `;

      const fs = `
      precision mediump float;
      uniform sampler2D u_data;
      void main() {
        gl_FragColor = texture2D(u_data, vec2(0));
      }
      `;

      const prg = twgl.createProgram(gl, [vs, fs]);
      tagObject(prg, 'floatPrg');
      gl.useProgram(prg);

      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);  // fails because float is not filterable
      }, [/foo/]);

      const extTextureFloatLinear = gl.getExtension('OES_texture_float_linear');
      if (!extTextureFloatLinear) {
        return;
      }

      gl.drawArrays(gl.POINTS, 0, 1);  // should succeed
    });

    it('test float texture filtering webgl2', () => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        return;
      }
      const ext = gl.getExtension('GMAN_debug_helper');
      const tagObject = ext ? ext.tagObject.bind(ext) : () => {};

      const tex = gl.createTexture();
      tagObject(tex, 'floatTex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 2, 2, 0, gl.RGBA, gl.FLOAT, null);

      const vs = `
      void main() {
        gl_Position = vec4(0);
      }
      `;

      const fs = `
      precision mediump float;
      uniform sampler2D u_data;
      void main() {
        gl_FragColor = texture2D(u_data, vec2(0));
      }
      `;

      const prg = twgl.createProgram(gl, [vs, fs]);
      tagObject(prg, 'floatPrg');
      gl.useProgram(prg);

      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);  // fails because float is not filterable
      }, [/texture of type \(RGBA32F\) is not filterable but TEXTURE_MIN_FILTER is set to LINEAR/]);

      const extTextureFloatLinear = gl.getExtension('OES_texture_float_linear');
      if (!extTextureFloatLinear) {
        return;
      }

      gl.drawArrays(gl.POINTS, 0, 1);  // should succeed
    });

    it('test cubemaps', () => {
      const {gl, tagObject} = contexts;
      const vs = `
      void main() {
        gl_Position = vec4(0);
      }
      `;

      const fs = `
      precision mediump float;
      uniform samplerCube u_diffuse;
      void main() {
        gl_FragColor = textureCube(u_diffuse, vec3(0));
      }
      `;

      const prg = twgl.createProgram(gl, [vs, fs]);
      tagObject(prg, 'noTexPrg');
      gl.useProgram(prg);

      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/no texture/]);

      const tex = gl.createTexture();
      tagObject(tex, 'testTex');
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/POSITIVE_X face does not exist/]);

      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/MAP_POSITIVE_Y\) does not exist/]);

      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);

      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.deleteTexture(tex);
    });

    it('test texture samplers', () => {
      const {gl2, tagObject2} = contexts;
      const vs = `
      void main() {
        gl_Position = vec4(0);
      }
      `;

      const fs = `
      precision mediump float;
      uniform sampler2D u_diffuse;
      void main() {
        gl_FragColor = texture2D(u_diffuse, vec2(0));
      }
      `;

      const gl = gl2;
      const tagObject = tagObject2;
      const prg = twgl.createProgram(gl, [vs, fs]);
      tagObject(prg, 'noTexPrg');
      gl.useProgram(prg);

      const tex = gl.createTexture();
      tagObject(tex, 'testTex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);

      const s = gl.createSampler();
      tagObject(s, 'linearSampler');
      gl.samplerParameteri(s, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.bindSampler(0, s);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.deleteSampler(s);

      assertThrowsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);
    });
  }

  describe('unrenderable tests', () => {
    addTests(globalContexts);
  });

  describe('unrenderable tests disabled', () => {
    const contexts = {};

    function disableFailOnUnrenderableTexture(gl) {
      const ext = gl.getExtension('GMAN_webgl_helper');
      if (ext) {
        ext.setConfiguration({failUnrenderableTextures: false});
      }
    }

    before(() => {
      Object.assign(contexts, createContexts());
      const {gl, gl2} = contexts;
      disableFailOnUnrenderableTexture(gl);
      if (gl2) {
        disableFailOnUnrenderableTexture(gl2);
      }
    });

    afterEach(() => {
      resetContexts(contexts);
    });

    addTests(contexts);
  });

});