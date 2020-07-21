import * as twgl from './js/twgl-full.module.js';

const gl = document.createElement('canvas').getContext('webgl');
document.body.appendChild(gl.canvas);
const ext = gl.getExtension('GMAN_debug_helper');
const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
const settings = Object.fromEntries(new URLSearchParams(window.location.search).entries());
const testGrepRE = new RegExp(escapeRE(settings.grep || ''));

const tests = [
  { desc: "test drawing",
    expect: [/^undefined$/],
    func() {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0, 0, 0, 1);
             gl_PointSize = 128.0;
          }
        `,
        `
          precision mediump float;
          uniform vec4 pointColor;
          void main() {
            gl_FragColor = pointColor;
          }
        `,
      ]);
      tagObject(prg, 'point program');
      gl.useProgram(prg);
      const loc = gl.getUniformLocation(prg, 'pointColor');
      gl.uniform4fv(loc, [1, 0.7, .5, 1]);
      gl.drawArrays(gl.POINTS, 0, 1);

    },
  },
  { desc: "test naming objects",
    expect: [/my-test-prg/],
    func() {
      console.assert(gl.getExtension('OES_vertex_array_objects') === gl.getExtension('OES_vertex_array_objects'));
      console.assert(gl.getSupportedExtensions().includes('GMAN_debug_helper'));
      const p = gl.createProgram();
      tagObject(p, 'my-test-prg');
      gl.useProgram(p);
    },
  },
  { desc: "test getting names of uniforms",
    expect: [/diffuseColor.*?NaN/],
    func() {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0);
          }
        `,
        `
          precision mediump float;
          uniform vec4 diffuseColor;
          void main() {
            gl_FragColor = diffuseColor;
          }
        `,
      ]);
      tagObject(prg, 'simple program');
      gl.useProgram(prg);
      const loc = gl.getUniformLocation(prg, 'diffuseColor');
      gl.uniform4fv(loc, [1, 2, 3, 4]);
      gl.uniform4fv(loc, [1, 2, 3/'foo', 4]);
    },
  },
  { desc: "test bad ENUM 1",
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
  { desc: 'test bad vertex data',
    expect: [/positions-buffer.*?NaN/],
    func() {
      const buf = gl.createBuffer();
      tagObject(buf, 'positions-buffer')
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, 12, gl.STATIC_DRAW);
      gl.bufferData(gl.ARRAY_BUFFER, new ArrayBuffer(13), gl.STATIC_DRAW);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 2, 3/'foo', 4]), gl.STATIC_DRAW);  // error
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
  {
    desc: 'test unset uniforms',
    expect: [
      /ambient/,
      /diffuseColor/,
      not('diffuseTex'),
    ],
    func() {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0);
             gl_PointSize = 1.0;
          }
        `,
        `
          precision mediump float;
          uniform vec4 diffuseColor;
          uniform vec4 ambient;
          uniform sampler2D diffuseTex;
          void main() {
            gl_FragColor = diffuseColor + ambient + texture2D(diffuseTex, vec2(0));
          }
        `,
      ]);
      tagObject(prg, 'uniforms-program');
      gl.useProgram(prg);
      gl.drawArrays(gl.POINTS, 0, 1);  // error, unset uniforms
    },
  },
  {
    desc: 'test unset uniforms array',
    expect: [
      /emissive\[1\]/,
      /emissive\[2\]/,
      not('emissive"'),
      not('emissive[0]'),
      not('emissive[3]'),
      not('diffuseColor'),
      not('ambient'),
    ],
    func() {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0);
             gl_PointSize = 1.0;
          }
        `,
        `
          precision mediump float;
          uniform vec4 diffuseColor[3];
          uniform vec4 ambient[4];
          uniform vec4 emissive[4];
          void main() {
            gl_FragColor = diffuseColor[2] + ambient[3] + emissive[3];
          }
        `,
      ]);
      tagObject(prg, 'uniforms-program');
      gl.useProgram(prg);
      gl.uniform4fv(gl.getUniformLocation(prg, 'diffuseColor'), new Float32Array(16));
      gl.uniform4fv(gl.getUniformLocation(prg, 'ambient[0]'), new Float32Array(4));
      gl.uniform4fv(gl.getUniformLocation(prg, 'ambient[1]'), new Float32Array(4));
      gl.uniform4fv(gl.getUniformLocation(prg, 'ambient[2]'), new Float32Array(4));
      gl.uniform4f(gl.getUniformLocation(prg, 'ambient[3]'), 2, 3, 4, 5);
      gl.uniform4fv(gl.getUniformLocation(prg, 'emissive[3]'), [1, 2, 3, 4]);
      gl.uniform4fv(gl.getUniformLocation(prg, 'emissive[0]'), [1, 2, 3, 4]);
      gl.drawArrays(gl.POINTS, 0, 1);  // error, unset uniforms
    },
  },
  {
    desc: 'test unset uniform sampler',
    expect: [/ambient/, /diffuseColor/, /diffuseTex/],
    func() {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl.getExtension('GMAN_debug_helper');
      if (ext) {
        ext.setConfiguration({failUnsetUniformSamplers: true});
      }
      const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0);
             gl_PointSize = 1.0;
          }
        `,
        `
          precision mediump float;
          uniform vec4 diffuseColor;
          uniform vec4 ambient;
          uniform sampler2D diffuseTex;
          void main() {
            gl_FragColor = diffuseColor + ambient + texture2D(diffuseTex, vec2(0));
          }
        `,
      ]);
      tagObject(prg, 'uniforms-program-with-samplers');
      gl.useProgram(prg);
      gl.drawArrays(gl.POINTS, 0, 1);  // error, unset uniforms
    },
  },
  {
    desc: 'test zero matrix',
    expect: [/perspective/, not('view'), not('model')],
    func() {
      const prg = twgl.createProgram(gl, [
        `
          attribute vec4 position;
          uniform mat4 perspective;
          uniform mat4 view;
          uniform mat4 model;
          void main() {
             gl_Position = perspective * view * model * position;
          }
        `,
        `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(0);
          }
        `,
      ]);
      tagObject(prg, 'uniforms-with-matrices');
      gl.useProgram(prg);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'model'), false, [
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'view'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'perspective'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
    },
  },
  {
    desc: 'test zero matrix disabled',
    expect: [/undefined/],
    func() {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl.getExtension('GMAN_debug_helper');
      if (ext) {
        ext.setConfiguration({failZeroMatrixUniforms: false});
      }
      const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
      const prg = twgl.createProgram(gl, [
        `
          attribute vec4 position;
          uniform mat4 perspective;
          uniform mat4 view;
          uniform mat4 model;
          void main() {
             gl_Position = perspective * view * model * position;
          }
        `,
        `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(0);
          }
        `,
      ]);
      tagObject(prg, 'uniforms-with-matrices');
      gl.useProgram(prg);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'model'), false, [
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'view'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'perspective'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
    },
  },
  {
    desc: 'test ignore uniforms',
    expect: [/undefined/],
    func() {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl.getExtension('GMAN_debug_helper');
      if (ext) {
        ext.setConfiguration({ignoreUniforms: ['perspective']});
      }
      const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
      const prg = twgl.createProgram(gl, [
        `
          attribute vec4 position;
          uniform mat4 perspective;
          uniform mat4 view;
          uniform mat4 model;
          void main() {
             gl_Position = perspective * view * model * position;
          }
        `,
        `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(0);
          }
        `,
      ]);
      tagObject(prg, 'uniforms-with-matrices');
      gl.useProgram(prg);
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'view'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0.00000001,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
      gl.uniformMatrix4fv(gl.getUniformLocation(prg, 'perspective'), false, new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]));
    },
  },
  {
    desc: 'test vertex func reports vao',
    expect: [/sphere-data/],
    func() {
      const ext = gl.getExtension('OES_vertex_array_object');
      if (!ext) {
        throw new Error ('sphere-data'); // something to satisfy test.
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
        throw new Error ('sphere-data'); // something to satisfy test.
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
  {
    desc: 'test extension enums',
    expect: [/FRAGMENT_SHADER_DERIVATIVE_HINT_OES/],
    func() {
      const ext = gl.getExtension('OES_standard_derivatives');
      if (!ext) {
        throw new Error('FRAGMENT_SHADER_DERIVATIVE_HINT_OES');
      }
      gl.enable(ext.FRAGMENT_SHADER_DERIVATIVE_HINT_OES);
    },
  }
];

function escapeRE(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function not(str) {
  return new RegExp(`^((?!${escapeRE(str)}).)*$`);
}

function fail(...args) {
  logImpl('red', 'FAIL:', ...args);
}

function pass(...args) {
  logImpl('green', 'PASS:', ...args);
}

function log(...args) {
  logImpl('inherit', ...args);
}

function logImpl(color, ...args) {
  const elem = document.createElement('pre');
  elem.style.color = color;
  elem.textContent = args.join(' ');
  document.body.appendChild(elem);
}

function check(expect, actual, desc) {
  const actualNoBreaks = actual.replace(/\n/g, ' ');
  for (const expected of expect) {
    if (!expected.test(actualNoBreaks)) {
      fail(desc, ': expected:', expected, 'actual:', actual);
      return false;
    }
  }
  return true;
}

for (const {desc, expect, func} of tests) {
  if (!testGrepRE.test(desc)) {
    continue;
  }
  let actual = 'undefined';
  try {
    console.log(`\n\n--------------[ ${desc} ]---------------`);
    func();
  } catch(e) {
    console.error(e);
    actual = e.toString();
  }
  
  if (check(expect, actual, desc)) {
    pass(desc);
  }
}
