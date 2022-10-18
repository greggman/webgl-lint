import * as twgl from '../js/twgl-full.module.js';
import {assertDoesNotThrow, assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext, checkDest} from '../webgl.js';

describe('buffer overflow tests', () => {

  it('test buffer overflow with drawArrays', () => {
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

    uniform sampler2D u_diffuse;

    void main() {
      gl_FragColor = texture2D(u_diffuse, v_texcoord) * v_color;
    }
    `;

    const prg = twgl.createProgram(gl, [vs, fs]);
    tagObject(prg, 'drawArraysPrg');

    const tex = gl.createTexture();
    tagObject(tex, 'drawArraysTex');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    function makeBuffer(gl, prg, name, size, data) {
      const buf = gl.createBuffer();
      tagObject(buf, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prg, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }

    const positions = new Float32Array([0, 0, 1, 0, 0, 1]);
    const texcoords = new Float32Array([0, 0, 1, 0, 0]);  // 1 short
    const colors = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]);

    makeBuffer(gl, prg, 'position', 2, positions);
    makeBuffer(gl, prg, 'texcoord', 2, texcoords);
    makeBuffer(gl, prg, 'color', 4, colors);

    gl.useProgram(prg);
    // an implementation is allowed to not generate an error
    // for out of bounds access if the guarantees that out of bounds
    // access is safe. In other words if the out of bound access is
    // either limited internally (eg. `ndx = clamp(ndx, 0, maxIndex)`)
    // or if the out of bounds access only accesses data provided by
    // the page itself. (eg. `ndx = ndx % bufferLength`)
    assertThrowsWith(() => {
      gl.drawArrays(gl.TRIANGLES, 0, 3); // buffer overflow
    }, [/drawArraysPrg/, /"texcoord"/, /attribute 'texcoord'/]);
  });

  it('test buffer overflow with drawElements', () => {
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

    assertThrowsWith(() => {
      gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0); // buffer overflow
    }, [/drawElementsPrg/, /"texcoord"/, /attribute 'texcoord'/]);
  });

  it('test buffer overflow with drawElements offset TypedArrays', () => {
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
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `;
    const prg = twgl.createProgram(gl, [vs, fs]);
    gl.useProgram(prg);

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

    const arrayBuffer = new ArrayBuffer(12 * 4 + 6 * 2);
    const positions = new Float32Array(arrayBuffer, 0, 12);
    const indices = new Uint16Array(arrayBuffer, 12 * 4, 6);
    positions.set([-1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0]);
    indices.set([0, 1, 2, 0, 2, 3]);

    makeBufferAndSetAttrib(gl, prg, 'position', 3, positions);
    makeBuffer(gl, 'indices', indices, gl.ELEMENT_ARRAY_BUFFER);

    gl.useProgram(prg);

    // there was an internal bug not handling offset TypedArrays
    assertDoesNotThrow(() => {
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    });
  });

  it('test buffer overflow with drawElements offset TypedArrays using bufferSubData', () => {
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
      gl_FragColor = vec4(0, 1, 0, 1);
    }
    `;
    const prg = twgl.createProgram(gl, [vs, fs]);
    gl.useProgram(prg);

    function makeBuffer(gl, name, data, target = gl.ARRAY_BUFFER) {
      const buf = gl.createBuffer();
      tagObject(buf, name);
      gl.bindBuffer(target, buf);
      gl.bufferData(target, data.byteLength, gl.STATIC_DRAW);
      gl.bufferSubData(target, 0, data);
    }

    function makeBufferAndSetAttrib(gl, prg, name, size, data) {
      makeBuffer(gl, name, data);
      const loc = gl.getAttribLocation(prg, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }

    const arrayBuffer = new ArrayBuffer(12 * 4 + 6 * 2);
    const positions = new Float32Array(arrayBuffer, 0, 12);
    const indices = new Uint16Array(arrayBuffer, 12 * 4, 6);
    positions.set([
      -1,  1, 0,
       1,  1, 0,
       1, -1, 0,
      -1, -1, 0,
    ]);
    indices.set([0, 1, 2, 0, 2, 3]);

    makeBufferAndSetAttrib(gl, prg, 'position', 3, positions);
    makeBuffer(gl, 'indices', indices, gl.ELEMENT_ARRAY_BUFFER);

    gl.useProgram(prg);
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    checkDest(gl, [0, 255, 0, 255]);
  });

  it('test buffer overflow with drawArraysInstanced', () => {
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
    // an implementation is allowed to not generate an error
    // for out of bounds access if the guarantees that out of bounds
    // access is safe. In other words if the out of bound access is
    // either limited internally (eg. `ndx = clamp(ndx, 0, maxIndex)`)
    // or if the out of bounds access only accesses data provided by
    // the page itself. (eg. `ndx = ndx % bufferLength`)
    assertThrowsWith(() => {
      ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 3, 4); // 1 too many instances
    }, [/drawArraysInstancedPrg/, /"color"/, /attribute 'color'/]);
  });

});