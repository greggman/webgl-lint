import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('unnamed objects test', () => {

  it('test unnamed buffer is called unnamed', () => {
    const {gl} = createContext();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    assertThrowsWith(() => {
      gl.bufferData(gl.ARRAY_BUFFER, 3, gl.BLEND);
    }, [/\*unnamed\*/]);
  });

});