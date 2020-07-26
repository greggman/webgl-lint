import assert from '../assert.js';
import * as twgl from '../js/twgl-full.module.js';
import {gl, gl2, tagObject, tagObject2} from '../shared.js';

export default [
  {
    desc: 'test no texture, incomplete texture, non-power-of-2-texture',
    test() {
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
      tagObject(prg, 'noTexPrg');
      gl.useProgram(prg);

      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/no texture/]);

      const tex = gl.createTexture();
      tagObject(tex, 'testTex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 3, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/not CLAMP_TO_EDGE/]);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);

      gl.generateMipmap(gl.TEXTURE_2D);
      gl.drawArrays(gl.POINTS, 0, 1);
    },
  },
  {
    desc: 'test cubemaps',
    test() {
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

      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/no texture/]);

      const tex = gl.createTexture();
      tagObject(tex, 'testTex');
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/POSITIVE_X face does not exist/]);

      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/MAP_POSITIVE_Y\) does not exist/]);

      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);

      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.deleteTexture(tex);
    },
  },
  {
    desc: 'test texture samplers',
    test() {
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
      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);

      const s = gl.createSampler();
      tagObject(s, 'linearSampler');
      gl.samplerParameteri(s, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.bindSampler(0, s);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.deleteSampler(s);

      assert.throwsWith(() => {
        gl.drawArrays(gl.POINTS, 0, 1);
      }, [/mip level 1 does not exist/]);
    },
  },
];