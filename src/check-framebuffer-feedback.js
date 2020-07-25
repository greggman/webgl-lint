/* global WebGLTexture */

import {glEnumToString, isWebGL2, isBuiltIn} from './utils.js';
import {uniformTypeIsSampler, getTextureForUnit} from './samplers.js';

const MAX_COLOR_ATTACHMENTS = 0x8CDF;

function getMaxColorAttachments(gl) {
  if (!isWebGL2(gl)) {
    const ext = gl.getExtension('WEBGL_draw_buffers');
    if (!ext) {
      return 1;
    }
  }
  return gl.getParameter(MAX_COLOR_ATTACHMENTS);
}

/**
 * slow non-cached version
 * @param {WebGLRenderingContext} gl
 * @param {number} attachment
 * @param {Map<WebGLTexture, [number]>} textureAttachments
 */
function addTextureAttachment(gl, attachment, textureAttachments) {
  const type = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, attachment, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE);
  if (type === gl.NONE) {
    return;
  }
  const obj = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, attachment, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
  if (obj instanceof WebGLTexture) {
    if (!textureAttachments.has(obj)) {
      textureAttachments.set(obj, []);
    }
    textureAttachments.get(obj).push(attachment);
  }
}

/**
 * slow non-cached version
 * @param {WebGLRenderingContext} gl
 */
export function checkFramebufferFeedback(gl, getWebGLObjectString) {
  const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
  if (!framebuffer) {
    // drawing to canvas
    return [];
  }

  // get framebuffer texture attachments
  const maxColorAttachments = getMaxColorAttachments(gl);
  const textureAttachments = new Map();
  for (let i = 0; i < maxColorAttachments; ++i) {
    addTextureAttachment(gl, gl.COLOR_ATTACHMENT0 + i, textureAttachments);
  }
  addTextureAttachment(gl, gl.DEPTH_ATTACHMENT, textureAttachments);
  addTextureAttachment(gl, gl.STENCIL_ATTACHMENT, textureAttachments);

  if (!isWebGL2(gl)) {
    addTextureAttachment(gl, gl.DEPTH_STENCIL_ATTACHMENT, textureAttachments);
  }

  const oldActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
  const program = gl.getParameter(gl.CURRENT_PROGRAM);
  // get the texture units used by the current program
  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  const errors = [];
  for (let ii = 0; ii < numUniforms; ++ii) {
    const {name, type, size} = gl.getActiveUniform(program, ii);
    if (isBuiltIn(name) || !uniformTypeIsSampler(type)) {
      continue;
    }

    if (size > 1) {
      const baseName = (name.substr(-3) === '[0]')
          ? name.substr(0, name.length - 3)
          : name;
      for (let t = 0; t < size; ++t) {
        errors.push(...checkTextureUsage(gl, framebuffer, textureAttachments, program, `${baseName}[${t}]`, type, getWebGLObjectString));
      }
    } else {
      errors.push(...checkTextureUsage(gl, framebuffer, textureAttachments, program, name, type, getWebGLObjectString));
    }
  }
  gl.activeTexture(oldActiveTexture);

  return errors;
}

function checkTextureUsage(gl, framebuffer, textureAttachments, program, uniformName, uniformType, getWebGLObjectString) {
  const location = gl.getUniformLocation(program, uniformName);
  const textureUnit = gl.getUniform(program, location);
  const texture = getTextureForUnit(gl, textureUnit, uniformType);
  const attachments = textureAttachments.get(texture);
  return attachments
     ? [`${getWebGLObjectString(texture)} on uniform: ${uniformName} bound to texture unit ${textureUnit} is also attached to ${getWebGLObjectString(framebuffer)} on attachment: ${attachments.map(a => glEnumToString(gl, a)).join(', ')}`]
     : [];
}
