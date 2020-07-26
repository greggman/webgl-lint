import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {gl} from '../shared.js';

describe('unnamed objects test', () => {

  it('test unnamed buffer is called unnamed', () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      assertThrowsWith(() => {
        gl.bufferData(gl.ARRAY_BUFFER, 3, gl.BLEND);
      }, [/\*unnamed\*/]);
  });

});