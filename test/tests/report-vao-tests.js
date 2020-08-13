import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('report vao tests', () => {

  it('test vertex func reports vao', () => {
    const {gl, tagObject} = createContext();
    const ext = gl.getExtension('OES_vertex_array_object');
    if (!ext) {
      throw new Error('sphere-data'); // something to satisfy test.
    }
    const vao = ext.createVertexArrayOES();
    tagObject(vao, 'sphere-data');
    const buf = gl.createBuffer();
    tagObject(buf, 'normals');
    ext.bindVertexArrayOES(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    assertThrowsWith(() => {
      gl.vertexAttribPointer(3, 5, gl.FLOAT, false, 0, 0);  // error, size too large, INVALID_VALUE
    }, [/sphere-data/]);
  });

  it('test vertex func reports vao 2', () => {
    const {gl, tagObject} = createContext();
    const ext = gl.getExtension('OES_vertex_array_object');
    if (!ext) {
      throw new Error('sphere-data'); // something to satisfy test.
    }
    const vao = ext.createVertexArrayOES();
    tagObject(vao, 'sphere-data');
    const buf = gl.createBuffer();
    tagObject(buf, 'normals');
    ext.bindVertexArrayOES(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    assertThrowsWith(() => {
      gl.vertexAttribPointer(3, 4, gl.FLOATs, false, 0, 0);  // error, undefined
    }, [/sphere-data/]);
  });

});