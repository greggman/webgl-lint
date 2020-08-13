import {createContext} from '../webgl.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';

describe('enum tests', () => {

  it('test bad enum 1', () => {
    const {gl} = createContext();
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    assertThrowsWith(() => {
      gl.vertexAttribPointer(0, 1, gl.BYE, false, 0, 0);  // error
    }, [/argument.*?is undefined/]);
  });

  it('test bad enum 2', () => {
    const {gl} = createContext();
    gl.enable(gl.BLEND);
    assertThrowsWith(() => {
      gl.enable(gl.CULL_FADE);  // error
    }, [/argument.*?is undefined/]);
    gl.enable(gl.DEPTH_TEST);
  });

  it('test bad enum 3', () => {
    const {gl, tagObject} = createContext();
    const tex = gl.createTexture();
    tagObject(tex, 'depth-tex');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    assertThrowsWith(() => {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, 512, 256, 0, gl.DEPTH_COMPONENT16, gl.INT, null);  // error
    }, [/depth-tex.*?INVALID_VALUE/]);
  });

});