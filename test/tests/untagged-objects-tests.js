import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('untagged objects test', () => {

  it('test untagged buffer is called unnamed', () => {
    const {gl} = createContext();
    const buf1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    assertThrowsWith(() => {
      gl.bufferData(gl.ARRAY_BUFFER, 3, gl.BLEND);
    }, [/\*UNTAGGED:Buffer1\*/]);
    const buf2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    assertThrowsWith(() => {
      gl.bufferData(gl.ARRAY_BUFFER, 3, gl.BLEND);
    }, [/\*UNTAGGED:Buffer2\*/]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    assertThrowsWith(() => {
      gl.bufferData(gl.ARRAY_BUFFER, 3, gl.BLEND);
    }, [/\*UNTAGGED:Buffer1\*/]);
  });

});