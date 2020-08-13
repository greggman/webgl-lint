/* global document */

import {afterEach} from './mocha-support.js';

export function createContext() {
  const gl = document.createElement('canvas').getContext('webgl');
  const ext = gl.getExtension('GMAN_debug_helper');
  const vaoExt = gl.getExtension('OES_vertex_array_object');
  const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
  return { gl, ext, vaoExt, tagObject };
}

export function createContext2() {
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl ? gl.getExtension('GMAN_debug_helper') : null;
  const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
  return { gl, ext, tagObject };
}

export function createContexts() {
  const {gl, ext, vaoExt, tagObject} = createContext();
  const {gl: gl2, ext: ext2, tagObject: tagObject2} = createContext2();
  return { gl, gl2, ext, ext2, vaoExt, tagObject, tagObject2 };
}

export const contexts = createContexts();

const {
  gl, gl2, ext, ext2, vaoExt, tagObject, tagObject2,
} = contexts;
export {
  gl, gl2, ext, ext2, vaoExt, tagObject, tagObject2,
};

function resetContext(gl) {
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.useProgram(null);
}

export function resetContexts(context) {
  const { gl, gl2, vaoExt } = context;
  if (vaoExt) {
    vaoExt.bindVertexArrayOES(null);
  }
  resetContext(gl);

  if (gl2) {
    gl2.bindVertexArray(null);
    resetContext(gl2);
  }
}

afterEach(() => {
  resetContexts(contexts);
});


export function escapeRE(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function not(str) {
  return new RegExp(`^((?!${escapeRE(str)}).)*$`);
}

