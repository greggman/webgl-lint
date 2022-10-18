/* global document */

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

export function escapeRE(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function not(str) {
  return new RegExp(`^((?!${escapeRE(str)}).)*$`);
}

export function checkDest(gl, color) {
  const {width, height} = gl.canvas;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 0] !== color[0] ||
        pixels[i + 1] !== color[1] ||
        pixels[i + 2] !== color[2] ||
        pixels[i + 3] !== color[3]) {
          const x = (i / 4) % width;
          const y = (i / 4) / width | 0;
          throw new Error(`pixel at ${x},${y} expected: ${color}, was ${pixels.slice(i, i + 4)}`);
    }
  }
}
