/* global document */

export const gl = document.createElement('canvas').getContext('webgl');
export const gl2 = document.createElement('canvas').getContext('webgl2');
document.body.appendChild(gl.canvas);
const ext = gl.getExtension('GMAN_debug_helper');
const ext2 = gl2 ? gl2.getExtension('GMAN_debug_helper') : null;
const vaoExt = gl.getExtension('OES_vertex_array_object');
export const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
export const tagObject2 = ext2 ? ext2.tagObject.bind(ext2) : () => {};

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

export function resetContexts() {
  if (vaoExt) {
    vaoExt.bindVertexArrayOES(null);
  }
  resetContext(gl);

  if (gl2) {
    gl2.bindVertexArray(null);
    resetContext(gl2);
  }
}

export function escapeRE(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function not(str) {
  return new RegExp(`^((?!${escapeRE(str)}).)*$`);
}

