import * as twgl from '../js/twgl-full.module.js';
import {
  assertEqual,
  assertThrowsWith,
  assertWarnsWith,
} from '../assert.js';
import {before, describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';

describe('undefined uniform tests', () => {

  it('warns when querying the location of an undefined uniform', () => {
    const {gl, tagObject} = createContext();
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0, 0, 0, 1);
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
    let loc = 0;
    assertWarnsWith(() => {
      loc = gl.getUniformLocation(prg, 'badColor');
    }, [
      /'badColor' does not exist in/,
      /point program/,
    ]);
    assertEqual(loc, null);
  });

  it('warns when setting an undefined uniform', () => {
    const {gl, tagObject} = createContext();
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0, 0, 0, 1);
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
    const loc = gl.getUniformLocation(prg, 'badColor');
    assertEqual(loc, null);
    assertWarnsWith(() => {
      gl.uniform4fv(loc, [1, 2, 3, 4]);
    }, [
      /attempt to set non-existent uniform/,
      /point program/,
    ]);
  });

  it('warns when setting an undefined uniform integer', () => {
    // needed because integer uniform could be a sample
    const {gl, tagObject} = createContext();
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0, 0, 0, 1);
        }
      `,
      `
        precision mediump float;
        uniform int foo;
        void main() {
          gl_FragColor = vec4(float(foo));
        }
      `,
    ]);
    tagObject(prg, 'point program');
    gl.useProgram(prg);
    const loc = gl.getUniformLocation(prg, 'bar');
    assertEqual(loc, null);
    assertWarnsWith(() => {
      gl.uniform1i(loc, 1);
    }, [
      /attempt to set non-existent uniform/,
      /point program/,
    ]);
  });

  it('does not warn when querying the location of an ignored undefined uniform', () => {
    const {gl, ext, tagObject} = createContext();
    if (ext) {
      ext.setConfiguration({
        ignoreUniforms: ['badColor'],
      });
    }
    const prg = twgl.createProgram(gl, [
      `
        void main() {
           gl_Position = vec4(0, 0, 0, 1);
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
    let loc = 0;
    assertWarnsWith(() => {
      loc = gl.getUniformLocation(prg, 'badColor');
    }, [/^$/]);
    assertEqual(loc, null);
  });

  describe('undefined uniform warnings disabled', () => {

    let gl;
    let tagObject;

    before(() => {
      const {gl: _gl, ext, tagObject: _tagObject} = createContext();
      if (ext) {
        ext.setConfiguration({
          warnUndefinedUniforms: false,
        });
      }
      gl = _gl;
      tagObject = _tagObject;
    });

    it('does not warn when querying the location of an undefined uniform', () => {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0, 0, 0, 1);
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
      let loc = 1;
      assertWarnsWith(() => {
        loc = gl.getUniformLocation(prg, 'badColor');
      }, [/^$/]);
      assertEqual(loc, null);
    });

    it('does not warn when setting an undefined uniform', () => {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0, 0, 0, 1);
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
      const loc = gl.getUniformLocation(prg, 'badColor');
      assertEqual(loc, null);
      assertWarnsWith(() => {
        gl.uniform4fv(loc, [1, 2, 3, 4]);
      }, [/^$/]);
    });

  });

  describe('undefined uniform throws', () => {

    let gl;
    let tagObject;

    before(() => {
      const {gl: _gl, ext, tagObject: _tagObject} = createContext();
      if (ext) {
        ext.setConfiguration({
          failUndefinedUniforms: true,
        });
      }
      gl = _gl;
      tagObject = _tagObject;
    });

    it('throws querying the location of an undefined uniform', () => {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0, 0, 0, 1);
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
      assertThrowsWith(() => {
        gl.getUniformLocation(prg, 'badColor');
      }, [
        /'badColor' does not exist in/,
        /point program/,
      ]);
    });

    it('throws when setting an undefined uniform', () => {
      const prg = twgl.createProgram(gl, [
        `
          void main() {
             gl_Position = vec4(0, 0, 0, 1);
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
      const loc = null;
      assertThrowsWith(() => {
        gl.uniform4fv(loc, [1, 2, 3, 4]);
      }, [
        /attempt to set non-existent uniform/,
        /point program/,
      ]);
    });

  });

});