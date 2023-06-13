import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';

describe('bad data tests', () => {

  it('test bad vertex data', () => {
    const {gl, tagObject} = createContext();
    const buf = gl.createBuffer();
    tagObject(buf, 'positions-buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, 12, gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new ArrayBuffer(13), gl.STATIC_DRAW);
    const data = new Float32Array(40000);
    data[34567] = 3 / 'foo';
    assertThrowsWith(() => {
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);  // error
    }, [/positions-buffer.*?NaN/, /Float32Array/]);
  });

  it('test bad texture data', () => {
    const {gl, tagObject} = createContext();
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
      return;
    }
    const tex = gl.createTexture();
    tagObject(tex, 'float-texture');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
    assertThrowsWith(() => {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array([1, 2, 3 / 'foo', 4]));  // error
    }, [/texImage2D.*?float-texture.*?NaN/]);
  });

  it('test bad argument', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]), 0);
    assertThrowsWith(() => {
      gl.clearBufferfv(gl.COLOR, 'foo', [0, 0, 0, 0]);
    }, [/not a number/]);
    assertThrowsWith(() => {
      gl.clearBufferfv(gl.COLOR, 0, 0);
    }, [/not an array or typedarray/]);
  });

});