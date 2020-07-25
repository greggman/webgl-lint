import * as twgl from '../js/twgl-full.module.js';
import {gl, tagObject} from '../shared.js';

export default [
  {
    desc: 'test program re-link/delete',
    test() {
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
    },
  },
  {
    desc: 'test buffer overflow with drawElements',
    expect: [/drawElementsPrg/, /"texcoord"/, /attribute 'texcoord'/],
    func() {
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

      uniform sampler2D u_diffuse;

      void main() {
        gl_FragColor = texture2D(u_diffuse, v_texcoord) * v_color;
      }
      `;

      const prg = twgl.createProgram(gl, [vs, fs]);
      tagObject(prg, 'drawElementsPrg');

      const tex = gl.createTexture();
      tagObject(tex, 'drawElementsTex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

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

      const positions = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0]);  // 4 entries
      const texcoords = new Float32Array([0, 0, 1, 0, 0, 1]);  // 3 entries
      const colors = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1]);  // 4 entries
      const indices = new Uint16Array([0, 1, 3]);  // 3 is out of bounds for texcoord

      makeBufferAndSetAttrib(gl, prg, 'position', 2, positions);
      makeBufferAndSetAttrib(gl, prg, 'texcoord', 2, texcoords);
      makeBufferAndSetAttrib(gl, prg, 'color', 4, colors);
      makeBuffer(gl, 'indices', indices, gl.ELEMENT_ARRAY_BUFFER);

      gl.useProgram(prg);
      gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0); // buffer overflow
    },
  },
  {
    desc: 'test buffer overflow with drawArraysInstanced',
    expect: [/drawArraysInstancedPrg/, /"color"/, /attribute 'color'/],
    func() {
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

      uniform sampler2D u_diffuse;

      void main() {
        gl_FragColor = texture2D(u_diffuse, v_texcoord) * v_color;
      }
      `;

      const ext = gl.getExtension('ANGLE_instanced_arrays');
      if (!ext) {
        throw new Error('drawArraysInstancedProg "color", attribute \'color\'');
      }

      const prg = twgl.createProgram(gl, [vs, fs]);
      tagObject(prg, 'drawArraysInstancedPrg');

      const tex = gl.createTexture();
      tagObject(tex, 'drawArraysInstancedTex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      function makeBuffer(gl, name, data, target = gl.ARRAY_BUFFER) {
        const buf = gl.createBuffer();
        tagObject(buf, name);
        gl.bindBuffer(target, buf);
        gl.bufferData(target, data, gl.STATIC_DRAW);
      }

      function makeBufferAndSetAttrib(gl, prg, name, size, data, divisor = 0) {
        makeBuffer(gl, name, data);
        const loc = gl.getAttribLocation(prg, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        ext.vertexAttribDivisorANGLE(loc, divisor);
      }

      const positions = new Float32Array([0, 0, 1, 0, 0, 1]);
      const texcoords = new Float32Array([0, 0, 1, 0, 0, 1]);
      const colors = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]);  // 1 short

      makeBufferAndSetAttrib(gl, prg, 'position', 2, positions);
      makeBufferAndSetAttrib(gl, prg, 'texcoord', 2, texcoords);
      makeBufferAndSetAttrib(gl, prg, 'color', 4, colors, 1);

      gl.useProgram(prg);
      ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 3, 4); // 1 too many instances
    },
  },
];