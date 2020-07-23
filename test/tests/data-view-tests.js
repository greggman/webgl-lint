import {gl, tagObject} from '../shared.js';

export default [
  { desc: 'test good data with DataView',
    expect: [/undefined/],
    func() {
      const buf = gl.createBuffer();
      tagObject(buf, 'positions-buffer')
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new DataView(new ArrayBuffer(13)), gl.STATIC_DRAW);
    },
  },
  { desc: 'test bad enum with DataView',
    expect: [/positions-buffer/, /INVALID_ENUM/, /DataView/],
    func() {
      const buf = gl.createBuffer();
      tagObject(buf, 'positions-buffer')
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new DataView(new ArrayBuffer(13)), gl.BLEND);
    },
  },
];