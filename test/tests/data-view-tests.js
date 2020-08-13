import {createContext} from '../webgl.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';

describe('DataView tests', () => {

  it('test good data with DataView', () => {
    const {gl, tagObject} = createContext();
    const buf = gl.createBuffer();
    tagObject(buf, 'positions-buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new DataView(new ArrayBuffer(13)), gl.STATIC_DRAW);
  });

  it('test bad enum with DataView', () => {
    const {gl, tagObject} = createContext();
    const buf = gl.createBuffer();
    tagObject(buf, 'positions-buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    assertThrowsWith(() => {
      gl.bufferData(gl.ARRAY_BUFFER, new DataView(new ArrayBuffer(13)), gl.BLEND);
    }, [/positions-buffer/, /INVALID_ENUM/, /DataView/]);
  });
});