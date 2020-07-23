import {gl} from '../shared.js';

export default [
  {
    desc: 'test unnamed buffer is called unnamed',
    expect: [/\*unnamed\*/],
    func() {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, 3, gl.BLEND);
    },
  },
];