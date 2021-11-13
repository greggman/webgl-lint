import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';

describe('untagged objects test', () => {

  it('test untagged buffer is called UNTAGGED:BufferX', () => {
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

  it('test untagged buffer is uses *unnamed* if default names are off', () => {
    const {gl, ext} = createContext();
    ext.setConfiguration({makeDefaultTags: false});
    const buf1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    assertThrowsWith(() => {
      gl.bufferData(gl.ARRAY_BUFFER, 3, gl.BLEND);
    }, [/\*unnamed\*/]);
  });

  it('test untagged sync', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    assertThrowsWith(() => {
      gl.clientWaitSync(sync, 0xFF, 0);
    }, [/\*UNTAGGED:Sync1\*/]);
  });

});