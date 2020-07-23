import * as twgl from '../js/twgl-full.module.js';

export default [
  {
    desc: 'test drawArrays with bad enum reports program and vao',
    expect: [/drawArraysBE/, /WebGLVertexArrayObject\("\*unnamed\*"\)/],
    func() {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        throw new Error('drawArraysBE vaoBE');
      }
      const ext = gl.getExtension('GMAN_debug_helper');
      const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
      
      const vs = `
      attribute vec4 position;

      void main() {
        gl_Position = position;
      }
      `;

      const fs = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(0);
      }
      `;

      const vao = gl.createVertexArray();
//      tagObject(vao, 'vaoBE');
      gl.bindVertexArray(vao);
      const prg = twgl.createProgram(gl, [vs, fs]);
      tagObject(prg, 'drawArraysBE');

      gl.useProgram(prg);
      gl.drawArrays(gl.TRAINGLES, 0, 1); // error, TRIANGLES misspelled.
    },
  }, 
];