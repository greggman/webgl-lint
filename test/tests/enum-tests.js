import {gl, tagObject} from '../shared.js';

export default [
  { desc: 'test bad enum 1',
    expect: [/argument.*?is undefined/],
    func() {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(0, 1, gl.BYE, false, 0, 0);  // error
    },
  },
  {
    desc: 'test bad enum 2',
    expect: [/argument.*?is undefined/],
    func() {
      gl.enable(gl.BLEND);
      gl.enable(gl.CULL_FADE);  // error
      gl.enable(gl.DEPTH_TEST);
    },
  },
  { desc: 'test bad enum 3',
    expect: [/depth-tex.*?INVALID_VALUE/],
    func() {
      const tex = gl.createTexture();
      tagObject(tex, 'depth-tex');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, 512, 256, 0, gl.DEPTH_COMPONENT16, gl.INT, null);  // error
    },
  },
];