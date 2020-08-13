import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext2} from '../webgl.js';

describe('arrays with offsets', () => {
  it('test bufferData with offset and length', () => {
    const {gl, tagObject} = createContext2();
    if (!gl) {
      return;
    }
    const buf = gl.createBuffer();
    tagObject(buf, 'test-buf');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, 5, gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new ArrayBuffer(5), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 2, 3 / 'foo', 4, 5]), gl.STATIC_DRAW, 3);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 2, 3 / 'foo', 4, 5]), gl.STATIC_DRAW, 0, 2);
    assertThrowsWith(() => {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 2, 3 / 'foo', 4, 5]), gl.STATIC_DRAW, 2);
      },
      [/element 2 of argument 1 is NaN/],
    );
    assertThrowsWith(() => {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 2, 3 / 'foo', 4, 5]), gl.STATIC_DRAW, 2, 2);
      },
      [/element 2 of argument 1 is NaN/],
    );
  });

  it('test bufferSubData with offset and length', () => {
    const {gl, tagObject} = createContext2();
    if (!gl) {
      return;
    }
    const buf = gl.createBuffer();
    tagObject(buf, 'test-buf');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, 50, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 1, new Float32Array(5));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Float32Array([1, 2, 3 / 'foo', 4, 5]), 3);
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Float32Array([1, 2, 3 / 'foo', 4, 5]), 0, 2);
    assertThrowsWith(() => {
        gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Float32Array([1, 2, 3 / 'foo', 4, 5]), 2);
      },
      [/element 2 of argument 2 is NaN/],
    );
    assertThrowsWith(() => {
        gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Float32Array([1, 2, 3 / 'foo', 4, 5]), 2, 2);
      },
      [/element 2 of argument 2 is NaN/],
    );
  });

});