/* global document */

export const gl = document.createElement('canvas').getContext('webgl');
export const gl2 = document.createElement('canvas').getContext('webgl2');
document.body.appendChild(gl.canvas);
const ext = gl.getExtension('GMAN_debug_helper');
const ext2 = gl2 ? gl2.getExtension('GMAN_debug_helper') : null;
const vaoExt = gl.getExtension('OES_vertex_array_object');
export const tagObject = ext ? ext.tagObject.bind(ext) : () => {};
export const tagObject2 = ext2 ? ext2.tagObject.bind(ext2) : () => {};

export function resetContexts() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (vaoExt) {
    vaoExt.bindVertexArrayOES(null);
  }

  if (gl2) {
    gl2.bindFramebuffer(gl2.FRAMEBUFFER, null);
    gl2.bindVertexArray(null);
  }
}

export function escapeRE(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function not(str) {
  return new RegExp(`^((?!${escapeRE(str)}).)*$`);
}

