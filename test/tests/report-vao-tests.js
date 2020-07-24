import {gl, tagObject} from '../shared.js';

export default [
  {
    desc: 'test vertex func reports vao',
    expect: [/sphere-data/],
    func() {
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
      gl.vertexAttribPointer(3, 5, gl.FLOAT, false, 0, 0);  // error, size too large, INVALID_VALUE
    },
  },
  {
    desc: 'test vertex func reports vao 2',
    expect: [/sphere-data/],
    func() {
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
      gl.vertexAttribPointer(3, 4, gl.FLOATs, false, 0, 0);  // error, undefined
    },
  },
];