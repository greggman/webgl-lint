import {assertEqual} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('buffer tests', () => {

  it('test bufferData with different BufferSource', () => {
    const {gl} = createContext();

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    gl.bufferData(gl.ARRAY_BUFFER, 10, gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Int8Array(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Int16Array(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float64Array(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new ArrayBuffer(10), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new DataView(new ArrayBuffer(200)), gl.STATIC_DRAW);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test bufferSubData with different BufferSource', () => {
    const {gl} = createContext();

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    gl.bufferData(gl.ARRAY_BUFFER, 200, gl.STATIC_DRAW);

    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Int8Array(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Uint8Array(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Int16Array(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Uint16Array(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Int32Array(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Uint32Array(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Float32Array(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new Float64Array(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new ArrayBuffer(10));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4, new DataView(new ArrayBuffer(10)));

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

});