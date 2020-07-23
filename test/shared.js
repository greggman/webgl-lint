export const gl = document.createElement('canvas').getContext('webgl');
document.body.appendChild(gl.canvas);
const ext = gl.getExtension('GMAN_debug_helper');
const vaoExt = gl.getExtension('OES_vertex_array_object');
export const clearVertexArray = vaoExt ? () => { vaoExt.bindVertexArrayOES(null); } : () => {};
export const tagObject = ext ? ext.tagObject.bind(ext) : () => {};

export function escapeRE(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function not(str) {
  return new RegExp(`^((?!${escapeRE(str)}).)*$`);
}

