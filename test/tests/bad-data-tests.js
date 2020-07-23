import {gl, tagObject} from '../shared.js';

export default [
  { desc: 'test bad vertex data',
    expect: [/positions-buffer.*?NaN/, /Float32Array/],
    func() {
      const buf = gl.createBuffer();
      tagObject(buf, 'positions-buffer')
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, 12, gl.STATIC_DRAW);
      gl.bufferData(gl.ARRAY_BUFFER, new ArrayBuffer(13), gl.STATIC_DRAW);
      const data = new Float32Array(40000);
      data[34567] = 3 / 'foo';
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);  // error
    },
  },
  { desc: 'test bad texture data',
    expect: [/texImage2D.*?float-texture.*?NaN/],
    func() {
      const ext = gl.getExtension('OES_texture_float');
      if (!ext) {
        return;
      }
      const tex = gl.createTexture();
      tagObject(tex, 'float-texture')
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array([1, 2, 3/'foo', 4]));  // error
    },
  },
];