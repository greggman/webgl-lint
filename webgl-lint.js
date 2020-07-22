/*
The MIT License (MIT)

Copyright (c) 2019 Gregg Tavares

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function() {
  'use strict';  // eslint-disable-line

  // get errors if these are accessed
  const gl = undefined;
  const ctx = undefined;  // eslint-disable-line
  const ext = undefined;  // eslint-disable-line

  function isBuiltIn(name) {
    return name.startsWith("gl_") || name.startsWith("webgl_");
  }

  function isWebGL2(gl) {
    // a proxy for if this is webgl
    return !!gl.texImage3D;
  }

  // ---------------------------------
  const FLOAT                         = 0x1406;
  const FLOAT_VEC2                    = 0x8B50;
  const FLOAT_VEC3                    = 0x8B51;
  const FLOAT_VEC4                    = 0x8B52;
  const INT                           = 0x1404;
  const INT_VEC2                      = 0x8B53;
  const INT_VEC3                      = 0x8B54;
  const INT_VEC4                      = 0x8B55;
  const BOOL                          = 0x8B56;
  const BOOL_VEC2                     = 0x8B57;
  const BOOL_VEC3                     = 0x8B58;
  const BOOL_VEC4                     = 0x8B59;
  const FLOAT_MAT2                    = 0x8B5A;
  const FLOAT_MAT3                    = 0x8B5B;
  const FLOAT_MAT4                    = 0x8B5C;
  const UNSIGNED_INT                  = 0x1405;
  const UNSIGNED_INT_VEC2             = 0x8DC6;
  const UNSIGNED_INT_VEC3             = 0x8DC7;
  const UNSIGNED_INT_VEC4             = 0x8DC8;

  const attrTypeMap = {};
  attrTypeMap[FLOAT]             = { size:  4, };
  attrTypeMap[FLOAT_VEC2]        = { size:  8, };
  attrTypeMap[FLOAT_VEC3]        = { size: 12, };
  attrTypeMap[FLOAT_VEC4]        = { size: 16, };
  attrTypeMap[INT]               = { size:  4, };
  attrTypeMap[INT_VEC2]          = { size:  8, };
  attrTypeMap[INT_VEC3]          = { size: 12, };
  attrTypeMap[INT_VEC4]          = { size: 16, };
  attrTypeMap[UNSIGNED_INT]      = { size:  4, };
  attrTypeMap[UNSIGNED_INT_VEC2] = { size:  8, };
  attrTypeMap[UNSIGNED_INT_VEC3] = { size: 12, };
  attrTypeMap[UNSIGNED_INT_VEC4] = { size: 16, };
  attrTypeMap[BOOL]              = { size:  4, };
  attrTypeMap[BOOL_VEC2]         = { size:  8, };
  attrTypeMap[BOOL_VEC3]         = { size: 12, };
  attrTypeMap[BOOL_VEC4]         = { size: 16, };
  attrTypeMap[FLOAT_MAT2]        = { size:  4, count: 2, };
  attrTypeMap[FLOAT_MAT3]        = { size:  9, count: 3, };
  attrTypeMap[FLOAT_MAT4]        = { size: 16, count: 4, };

  const BYTE                         = 0x1400;
  const UNSIGNED_BYTE                = 0x1401;
  const SHORT                        = 0x1402;
  const UNSIGNED_SHORT               = 0x1403;

  function getBytesPerValueForGLType(type) {
    if (type === BYTE)           return 1;  // eslint-disable-line
    if (type === UNSIGNED_BYTE)  return 1;  // eslint-disable-line
    if (type === SHORT)          return 2;  // eslint-disable-line
    if (type === UNSIGNED_SHORT) return 2;  // eslint-disable-line
    if (type === INT)            return 4;  // eslint-disable-line
    if (type === UNSIGNED_INT)   return 4;  // eslint-disable-line
    if (type === FLOAT)          return 4;  // eslint-disable-line
    return 0;
  }

  const funcsToArgs = {
    drawArrays(primType, startOffset, vertCount) { return {startOffset, vertCount, instances: 1}; },
    drawElements(primType, vertCount, indexType, startOffset) { return {startOffset, vertCount, instances: 1, indexType}; },
    drawArraysInstanced(primType, startOffset, vertCount, instances) { return {startOffset, vertCount, instances}; },
    drawElementsInstanced(primType, vertCount, indexType, startOffset, instances) { return {startOffset, vertCount, instances, indexType}; },
    drawArraysInstancedANGLE(primType, startOffset, vertCount, instances) { return {startOffset, vertCount, instances}; },
    drawElementsInstancedANGLE(primType, vertCount, indexType, startOffset, instances) { return {startOffset, vertCount, instances, indexType}; },
    drawRangeElements(primType, start, end, vertCount, indexType, startOffset) { return {startOffset, vertCount, instances: 1, indexType}; },
  };

  const glTypeToTypedArray = {}
  glTypeToTypedArray[UNSIGNED_BYTE] = Uint8Array;
  glTypeToTypedArray[UNSIGNED_SHORT] = Uint16Array;
  glTypeToTypedArray[UNSIGNED_INT] = Uint32Array;

  const bufferToIndices = new Map();

  function computeLastUseIndexForDrawArrays(startOffset, vertCount, instances, errors) {
    return startOffset + vertCount - 1;
  }

  function getLastUsedIndexForDrawElements(gl, funcName, startOffset, vertCount, instances, indexType, getWebGLObjectString, errors) {
    const elementBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
    if (!elementBuffer) {
      errors.push('No ELEMENT_ARRAY_BUFFER bound');
      return;
    }
    const bytesPerIndex = getBytesPerValueForGLType(indexType);
    const bufferSize = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE);
    const sizeNeeded = startOffset + vertCount * bytesPerIndex;
    if (sizeNeeded > bufferSize) {
      errors.push(`offset: ${startOffset} and count: ${vertCount} with index type: ${glEnumToString(gl, indexType)} passed to ${funcName} are out of range for current ELEMENT_ARRAY_BUFFER.
Those parameters require ${sizeNeeded} bytes but the current ELEMENT_ARRAY_BUFFER ${getWebGLObjectString(elementBuffer)} only has ${bufferSize} bytes`);
      return;
    }
    const buffer = bufferToIndices.get(elementBuffer);
    const Type = glTypeToTypedArray[indexType];
    const view = new Type(buffer, startOffset);
    let maxIndex = view[0];
    for (let i = 1; i < vertCount; ++i) {
      maxIndex = Math.max(maxIndex, view[i]);
    }
    return maxIndex;
  }

  const VERTEX_ATTRIB_ARRAY_DIVISOR = 0x88FE;

  function checkAttributes(gl, funcName, args, getWebGLObjectString) {
    const {vertCount, startOffset, indexType, instances} = funcsToArgs[funcName](...args);
    if (vertCount <=0 || instances <= 0) {
      return [];
    }
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    const errors = [];
    const nonInstancedLastIndex = indexType
        ? getLastUsedIndexForDrawElements(gl, funcName, startOffset, vertCount, instances, indexType, getWebGLObjectString, errors) 
        : computeLastUseIndexForDrawArrays(startOffset, vertCount, instances, errors);
    if (errors.length) {
      return errors;
    }

    const hasDivisor = isWebGL2(gl) || gl.getExtension('ANGLE_instanced_arrays');

    // get the attributes used by the current program
    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    const oldArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    for (let ii = 0; ii < numAttributes; ++ii) {
      const {name, type} = gl.getActiveAttrib(program, ii);
      if (isBuiltIn(name)) {
        continue;
      }
      const index = gl.getAttribLocation(program, name);
      const {size, count} = {count: 1, ...attrTypeMap[type]};
      for (let jj = 0; jj < count; ++jj) {
        const ndx = index + jj;
        const enabled = gl.getVertexAttrib(ndx, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        if (!enabled) {
          continue;
        }
        const buffer = gl.getVertexAttrib(ndx, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
        if (!buffer) {
          errors.push(`no buffer bound to attribute (${name}) location: ${index}`);
          continue;
        }
        const numComponents = gl.getVertexAttrib(ndx, gl.VERTEX_ATTRIB_ARRAY_SIZE);
        const type = gl.getVertexAttrib(ndx, gl.VERTEX_ATTRIB_ARRAY_TYPE);
        const bytesPerElement = getBytesPerValueForGLType(type) * numComponents;
        const offset = gl.getVertexAttribOffset(ndx, gl.VERTEX_ATTRIB_ARRAY_POINTER);
        const specifiedStride = gl.getVertexAttrib(ndx, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
        const stride = specifiedStride ? specifiedStride : bytesPerElement;
        const divisor = hasDivisor
            ? gl.getVertexAttrib(ndx, VERTEX_ATTRIB_ARRAY_DIVISOR)
            : 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        const bufferSize = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE);
        const effectiveLastIndex = divisor > 0
            ? ((instances + divisor - 1) / divisor | 0) - 1
            : nonInstancedLastIndex;
        const sizeNeeded = offset + effectiveLastIndex * stride + bytesPerElement;
        if (sizeNeeded > bufferSize) {
          errors.push(`${getWebGLObjectString(buffer)} assigned to attribute ${ndx} used as attribute '${name}' in current program is too small for draw parameters.
index of highest vertex accessed: ${effectiveLastIndex}
attribute size: ${numComponents}, type: ${glEnumToString(gl, type)}, stride: ${specifiedStride}, offset: ${offset}, divisor: ${divisor}
needs ${sizeNeeded} bytes for draw but buffer is only ${bufferSize} bytes`);
        }
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, oldArrayBuffer);
    return errors;
  }

  // ---------------------------------

  const SAMPLER_2D                    = 0x8B5E;
  const SAMPLER_CUBE                  = 0x8B60;
  const SAMPLER_3D                    = 0x8B5F;
  const SAMPLER_2D_SHADOW             = 0x8B62;
  const SAMPLER_2D_ARRAY              = 0x8DC1;
  const SAMPLER_2D_ARRAY_SHADOW       = 0x8DC4;
  const SAMPLER_CUBE_SHADOW           = 0x8DC5;
  const samplers = new Set([
    SAMPLER_2D,
    SAMPLER_CUBE,
    SAMPLER_3D,
    SAMPLER_2D_SHADOW,
    SAMPLER_2D_ARRAY,
    SAMPLER_2D_ARRAY_SHADOW,
    SAMPLER_CUBE_SHADOW,
 ]);

  function isSampler(type) {
    return samplers.has(type);
  }

  const TEXTURE_BINDING_2D            = 0x8069;
  const TEXTURE_BINDING_CUBE_MAP      = 0x8514;
  const TEXTURE_BINDING_3D            = 0x806A;
  const TEXTURE_BINDING_2D_ARRAY      = 0x8C1D;

  const samplerTypeToBinding = new Map();
  samplerTypeToBinding.set(SAMPLER_2D, TEXTURE_BINDING_2D);
  samplerTypeToBinding.set(SAMPLER_2D_SHADOW, TEXTURE_BINDING_2D);
  samplerTypeToBinding.set(SAMPLER_3D, TEXTURE_BINDING_3D);
  samplerTypeToBinding.set(SAMPLER_2D_ARRAY, TEXTURE_BINDING_2D_ARRAY);
  samplerTypeToBinding.set(SAMPLER_2D_ARRAY_SHADOW, TEXTURE_BINDING_2D_ARRAY);
  samplerTypeToBinding.set(SAMPLER_CUBE, TEXTURE_BINDING_CUBE_MAP);
  samplerTypeToBinding.set(SAMPLER_CUBE_SHADOW, TEXTURE_BINDING_CUBE_MAP);

  function getTextureForUnit(gl, unit, type) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    const binding = samplerTypeToBinding.get(type);
    return gl.getParameter(binding);
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
   */
  function checkFramebufferFeedback(gl, getWebGLObjectString) {
    const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    if (!framebuffer) {
      // drawing to canvas
      return [];
    }

    // get framebuffer texture attachments
    const maxColorAttachments = getMaxColorAttachments(gl)
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
      if (isBuiltIn(name) || !isSampler(type)) {
        continue;
      }

      if (size > 1) {
        let baseName = (name.substr(-3) === "[0]")
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

  const ARRAY_BUFFER                   = 0x8892;
  const ELEMENT_ARRAY_BUFFER           = 0x8893;
  const ARRAY_BUFFER_BINDING           = 0x8894;
  const ELEMENT_ARRAY_BUFFER_BINDING   = 0x8895;
  const TEXTURE_2D                     = 0x0DE1;
  const TEXTURE_3D                     = 0x806F;
  const TEXTURE_2D_ARRAY               = 0x8C1A;
  const TEXTURE_CUBE_MAP               = 0x8513;
  const FRAMEBUFFER                    = 0x8D40;
  const RENDERBUFFER                   = 0x8D41;
  const FRAMEBUFFER_BINDING            = 0x8CA6;
  const RENDERBUFFER_BINDING           = 0x8CA7;
  const TRANSFORM_FEEDBACK_BUFFER      = 0x8C8E;
  const TRANSFORM_FEEDBACK_BUFFER_BINDING = 0x8C8F;
  const DRAW_FRAMEBUFFER               = 0x8CA9;  
  const READ_FRAMEBUFFER               = 0x8CA8;
  const READ_FRAMEBUFFER_BINDING       = 0x8CAA;
  const UNIFORM_BUFFER                 = 0x8A11;
  const UNIFORM_BUFFER_BINDING         = 0x8A28;
  const TRANSFORM_FEEDBACK             = 0x8E22;
  const TRANSFORM_FEEDBACK_BINDING     = 0x8E25;

  const bindPointMap = new Map();
  bindPointMap.set(ARRAY_BUFFER, ARRAY_BUFFER_BINDING);
  bindPointMap.set(ELEMENT_ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER_BINDING);
  bindPointMap.set(TEXTURE_2D, TEXTURE_BINDING_2D);
  bindPointMap.set(TEXTURE_CUBE_MAP, TEXTURE_BINDING_CUBE_MAP);
  bindPointMap.set(TEXTURE_3D, TEXTURE_BINDING_3D);
  bindPointMap.set(TEXTURE_2D_ARRAY, TEXTURE_BINDING_2D_ARRAY);
  bindPointMap.set(RENDERBUFFER, RENDERBUFFER_BINDING);
  bindPointMap.set(FRAMEBUFFER, FRAMEBUFFER_BINDING);
  bindPointMap.set(DRAW_FRAMEBUFFER, FRAMEBUFFER_BINDING);
  bindPointMap.set(READ_FRAMEBUFFER, READ_FRAMEBUFFER_BINDING);
  bindPointMap.set(UNIFORM_BUFFER, UNIFORM_BUFFER_BINDING);
  bindPointMap.set(TRANSFORM_FEEDBACK_BUFFER, TRANSFORM_FEEDBACK_BUFFER_BINDING);
  bindPointMap.set(TRANSFORM_FEEDBACK, TRANSFORM_FEEDBACK_BINDING);

  //------------ [ from https://github.com/KhronosGroup/WebGLDeveloperTools ]

  /*
  ** Copyright (c) 2012 The Khronos Group Inc.
  **
  ** Permission is hereby granted, free of charge, to any person obtaining a
  ** copy of this software and/or associated documentation files (the
  ** "Materials"), to deal in the Materials without restriction, including
  ** without limitation the rights to use, copy, modify, merge, publish,
  ** distribute, sublicense, and/or sell copies of the Materials, and to
  ** permit persons to whom the Materials are furnished to do so, subject to
  ** the following conditions:
  **
  ** The above copyright notice and this permission notice shall be included
  ** in all copies or substantial portions of the Materials.
  **
  ** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  ** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  ** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  ** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
  ** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  ** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  ** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
  */

  /**
   * Types of contexts we have added to map
   */
  const mappedContextTypes = {};

  /**
   * Map of numbers to names.
   * @type {Object}
   */
  const glEnums = {};

  /**
   * Map of names to numbers.
   * @type {Object}
   */
  const enumStringToValue = {};

  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  function addEnumsForContext(ctx, type) {
    if (!mappedContextTypes[type]) {
      mappedContextTypes[type] = true;
      for (const propertyName in ctx) {
        if (typeof ctx[propertyName] === 'number') {
          glEnums[ctx[propertyName]] = propertyName;
          enumStringToValue[propertyName] = ctx[propertyName];
        }
      }
    }
  }

  function enumArrayToString(gl, enums) {
    const enumStrings = [];
    if (enums.length) {
      for (let i = 0; i < enums.length; ++i) {
        enums.push(glEnumToString(gl, enums[i]));  // eslint-disable-line
      }
      return '[' + enumStrings.join(', ') + ']';
    }
    return enumStrings.toString();
  }

  function makeBitFieldToStringFunc(enums) {
    return function(gl, value) {
      let orResult = 0;
      const orEnums = [];
      for (let i = 0; i < enums.length; ++i) {
        const enumValue = enumStringToValue[enums[i]];
        if ((value & enumValue) !== 0) {
          orResult |= enumValue;
          orEnums.push(glEnumToString(gl, enumValue));  // eslint-disable-line
        }
      }
      if (orResult === value) {
        return orEnums.join(' | ');
      } else {
        return glEnumToString(gl, value);  // eslint-disable-line
      }
    };
  }

  const destBufferBitFieldToString = makeBitFieldToStringFunc([
    'COLOR_BUFFER_BIT',
    'DEPTH_BUFFER_BIT',
    'STENCIL_BUFFER_BIT',
 ]);

  /**
   * Info about functions based on the number of arguments to the function.
   * 
   * enums specifies which arguments are enums
   * 
   *    'texImage2D': {
   *       9: { enums: [0, 2, 6, 7 ] },
   *       6: { enums: [0, 2, 3, 4 ] },
   *    },
   *
   * means if there are 9 arguments then 6 and 7 are enums, if there are 6
   * arguments 3 and 4 are enums. You can provide a function instead in
   * which case you should use object format. For example
   * 
   *     `clear`: {
   *       1: { enums: { 0: convertClearBitsToString }},
   *     },
   *
   * numbers specifies which arguments are numbers, if an argument is negative that
   * argument might not be a number so we can check only check for NaN 
   * arrays specifies which arguments are arrays
   * 
   * @type {!Object.<number, (!Object.<number, string>|function)}
   */
  const glFunctionInfos = {
    // Generic setters and getters

    'enable': {1: { enums: [0] }},
    'disable': {1: { enums: [0] }},
    'getParameter': {1: { enums: [0] }},

    // Rendering

    'drawArrays': {3:{ enums: [0], numbers: [1, 2] }},
    'drawElements': {4:{ enums: [0, 2], numbers: [1, 3] }},
    'drawArraysInstanced': {4: { enums: [0], numbers: [1, 2, 3] }},
    'drawElementsInstanced': {5: { enums: [0, 2], numbers: [1, 3, 4] }},
    'drawRangeElements': {6: { enums: [0, 4], numbers: [1, 2, 3, 5] }},

    // Shaders

    'createShader': {1: { enums: [0] }},
    'getActiveAttrib': {2: { numbers: [1] }},
    'getActiveUniform': {2: { numbers: [1] }},
    'getShaderParameter': {2: { enums: [1] }},
    'getProgramParameter': {2: { enums: [1] }},
    'getShaderPrecisionFormat': {2: { enums: [0, 1] }},
    'bindAttribLocation': {3: {numbers: [1]}},

    // Vertex attributes

    'getVertexAttrib': {2: { enums: [1], numbers: [0] }},
    'vertexAttribPointer': {6: { enums: [2], numbers: [0, 1, 4, 5] }},
    'vertexAttribIPointer': {5: { enums: [2], numbers: [0, 1, 3, 4] }},  // WebGL2
    'vertexAttribDivisor': {2: { numbers: [0, 1] }}, // WebGL2
    'disableVertexAttribArray': {1: {numbers: [0] }},
    'enableVertexAttribArray': {1: {numbers: [0] }},

    // Textures

    'bindTexture': {2: { enums: [0] }},
    'activeTexture': {1: { enums: [0, 1] }},
    'getTexParameter': {2: { enums: [0, 1] }},
    'texParameterf': {3: { enums: [0, 1] }},
    'texParameteri': {3: { enums: [0, 1, 2] }},
    'texImage2D': {
      9: { enums: [0, 2, 6, 7], numbers: [1, 3, 4, 5], arrays: [-8] },
      6: { enums: [0, 2, 3, 4] },
      10: { enums: [0, 2, 6, 7], numbers: [1, 3, 4, 5, 9], arrays: [-8] }, // WebGL2
    },
    'texImage3D': {
      10: { enums: [0, 2, 7, 8], numbers: [1, 3, 4, 5] },  // WebGL2
      11: { enums: [0, 2, 7, 8], numbers: [1, 3, 4, 5, 10] },  // WebGL2
    },
    'texSubImage2D': {
      9: { enums: [0, 6, 7], numbers: [1, 2, 3, 4, 5] },
      7: { enums: [0, 4, 5], numbers: [1, 2, 3] },
      10: { enums: [0, 6, 7], numbers: [1, 2, 3, 4, 5, 9] },  // WebGL2
    },
    'texSubImage3D': {
      11: { enums: [0, 8, 9], numbers: [1, 2, 3, 4, 5, 6, 7] },  // WebGL2
      12: { enums: [0, 8, 9], numbers: [1, 2, 3, 4, 5, 6, 7, 11] },  // WebGL2
    },
    'texStorage2D': { 5: { enums: [0, 2], numbers: [1, 3, 4] }},  // WebGL2
    'texStorage3D': { 6: { enums: [0, 2], numbers: [1, 3, 4, 6] }},  // WebGL2
    'copyTexImage2D': {8: { enums: [0, 2], numbers: [1, 3, 4, 5, 6, 7] }},
    'copyTexSubImage2D': {8: { enums: [0], numbers: [1, 2, 3, 4, 5, 6, 7]}},
    'copyTexSubImage3D': {9: { enums: [0], numbers: [1, 2, 3, 4, 5, 6, 7, 8] }},  // WebGL2
    'generateMipmap': {1: { enums: [0] }},
    'compressedTexImage2D': {
      7: { enums: [0, 2], numbers: [1, 3, 4, 5] },
      8: { enums: [0, 2], numbers: [1, 3, 4, 5, 7] },  // WebGL2
    },
    'compressedTexSubImage2D': {
      8: { enums: [0, 6], numbers: [1, 2, 3, 4, 5] },
      9: { enums: [0, 6], numbers: [1, 2, 3, 4, 5, 8] },  // WebGL2
    },
    'compressedTexImage3D': {
      8: { enums: [0, 2], numbers: [1, 3, 4, 5, 6] },  // WebGL2
      9: { enums: [0, 2], numbers: [1, 3, 4, 5, 6, -7, 8] },  // WebGL2
      10: { enums: [0, 2], numbers: [1, 3, 4, 5, 6, 8, 9] },  // WebGL2
    },
    'compressedTexSubImage3D': {
      12: { enums: [0, 8], numbers: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11] },  // WebGL2
      11: { enums: [0, 8], numbers: [1, 2, 3, 4, 5, 6, 7, 8, -9, 10] },  // WebGL2
      10: { enums: [0, 8], numbers: [1, 2, 3, 4, 5, 6, 7, 8] },  // WebGL2
    },

    // Buffer objects

    'bindBuffer': {2: { enums: [0] }},
    'bufferData': {
      3: { enums: [0, 2], numbers: [-1], arrays: [-1] },
      4: { enums: [0, 2], numbers: [-1, 3], arrays: [-1] },  // WebGL2
      5: { enums: [0, 2], numbers: [-1, 3, 4], arrays: [-1] },  // WebGL2
    },
    'bufferSubData': {
      3: { enums: [0], numbers: [1], arrays: [2] },
      4: { enums: [0], numbers: [1, 3], arrays: [2] },  // WebGL2
      5: { enums: [0], numbers: [1, 3, 4], arrays: [2] },  // WebGL2
    },
    'copyBufferSubData': {
      5: { enums: [0], numbers: [2, 3, 4] },  // WeBGL2
    },
    'getBufferParameter': {2: { enums: [0, 1] }},
    'getBufferSubData': {
      3: { enums: [0], numbers: [1] },  // WebGL2
      4: { enums: [0], numbers: [1, 3] },  // WebGL2
      5: { enums: [0], numbers: [1, 3, 4] },  // WebGL2
    },

    // Renderbuffers and framebuffers

    'pixelStorei': {2: { enums: [0, 1], numbers: [1] }},
    'readPixels': {
      7: { enums: [4, 5], numbers: [0, 1, 2, 3, -6] },
      8: { enums: [4, 5], numbers: [0, 1, 2, 3, 7] },  // WebGL2
    },
    'bindRenderbuffer': {2: { enums: [0] }},
    'bindFramebuffer': {2: { enums: [0] }},
    'blitFramebuffer': {10: { enums: { 8: destBufferBitFieldToString, 9:true }, numbers: [0, 1, 2, 3, 4, 5, 6, 7]}},  // WebGL2
    'checkFramebufferStatus': {1: { enums: [0] }},
    'framebufferRenderbuffer': {4: { enums: [0, 1, 2], }},
    'framebufferTexture2D': {5: { enums: [0, 1, 2], numbers: [4] }},
    'framebufferTextureLayer': {5: { enums: [0, 1], numbers: [3, 4] }},  // WebGL2
    'getFramebufferAttachmentParameter': {3: { enums: [0, 1, 2] }},
    'getInternalformatParameter': {3: { enums: [0, 1, 2] }},  // WebGL2
    'getRenderbufferParameter': {2: { enums: [0, 1] }},
    'invalidateFramebuffer': {2: { enums: { 0: true, 1: enumArrayToString, } }},  // WebGL2
    'invalidateSubFramebuffer': {6: { enums: { 0: true, 1: enumArrayToString, }, numbers: [2, 3, 4, 5] }},  // WebGL2
    'readBuffer': {1: { enums: [0] }},  // WebGL2
    'renderbufferStorage': {4: { enums: [0, 1], numbers: [2, 3] }},
    'renderbufferStorageMultisample': {5: { enums: [0, 2], numbers: [1, 3, 4] }},  // WebGL2

    // Frame buffer operations (clear, blend, depth test, stencil)

    'lineWidth': {1: {numbers: [0]}},
    'polygonOffset': {2: {numbers: [0, 1]}},
    'scissor': {4: { numbers: [0, 1, 2, 3]}},
    'viewport': {4: { numbers: [0, 1, 2, 3]}},
    'clear': {1: { enums: { 0: destBufferBitFieldToString } }},
    'clearColor': {4: { numbers: [0, 1, 2, 3]}},
    'clearDepth': {1: { numbers: [0]}},
    'clearStencil': {1: { numbers: [0]}},
    'depthFunc': {1: { enums: [0] }},
    'depthRange': {2: { numbers: [0, 1]}},
    'blendColor': {4: { numbers: [0, 1, 2, 3]}},
    'blendFunc': {2: { enums: [0, 1] }},
    'blendFuncSeparate': {4: { enums: [0, 1, 2, 3] }},
    'blendEquation': {1: { enums: [0] }},
    'blendEquationSeparate': {2: { enums: [0, 1] }},
    'stencilFunc': {3: { enums: [0], numbers: [1, 2] }},
    'stencilFuncSeparate': {4: { enums: [0, 1], numberS: [2, 3] }},
    'stencilMask': {1: { numbers: [0] }},
    'stencilMaskSeparate': {2: { enums: [0], numbers: [1] }},
    'stencilOp': {3: { enums: [0, 1, 2] }},
    'stencilOpSeparate': {4: { enums: [0, 1, 2, 3] }},

    // Culling

    'cullFace': {1: { enums: [0] }},
    'frontFace': {1: { enums: [0] }},

    // ANGLE_instanced_arrays extension

    'drawArraysInstancedANGLE': {4: { enums: [0], numbers: [1, 2, 3] }},
    'drawElementsInstancedANGLE': {5: { enums: [0, 2], numbers: [1, 3, 4] }},

    // EXT_blend_minmax extension

    'blendEquationEXT': {1: { enums: [0] }},

    // Multiple Render Targets

    'drawBuffersWebGL': {1: { enums: { 0: enumArrayToString, }, arrays: [0] }},  // WEBGL_draw_buffers
    'drawBuffers': {1: { enums: { 0: enumArrayToString, }, arrays: [0] }},  // WebGL2
    'clearBufferfv': {
      3: { enums: [0], numbers: [1], arrays: [2] },  // WebGL2
      4: { enums: [0], numbers: [1, 2], arrays: [2] },  // WebGL2
    },
    'clearBufferiv': {
      3: { enums: [0], numbers: [1], arrays: [2] },  // WebGL2
      4: { enums: [0], numbers: [1, 2], arrays: [2] },  // WebGL2
    },
    'clearBufferuiv': {
      3: { enums: [0], numbers: [1], arrays: [2] },  // WebGL2
      4: { enums: [0], numbers: [1, 2], arrays: [2] },  // WebGL2
    },
    'clearBufferfi': { 4: { enums: [0], numbers: [1, 2, 3] }},  // WebGL2

    // uniform value setters
    'uniform1f': { 2: {numbers: [1]} },
    'uniform2f': { 3: {numbers: [1, 2]} },
    'uniform3f': { 4: {numbers: [1, 2, 3]} },
    'uniform4f': { 5: {numbers: [1, 2, 3, 4]} },

    'uniform1i': { 2: {numbers: [1]} },
    'uniform2i': { 3: {numbers: [1, 2]} },
    'uniform3i': { 4: {numbers: [1, 2, 3]} },
    'uniform4i': { 5: {numbers: [1, 2, 3, 4]} },

    'uniform1fv': {
      2: {arrays: [1]},
      3: {arrays: [1], numbers: [2]},
      4: {arrays: [1], numbers: [2, 3]},
    },
    'uniform2fv': {
      2: {arrays: [1]},
      3: {arrays: [1], numbers: [2]},
      4: {arrays: [1], numbers: [2, 3]},
    },
    'uniform3fv': {
      2: {arrays: [1]},
      3: {arrays: [1], numbers: [2]},
      4: {arrays: [1], numbers: [2, 3]},
    },
    'uniform4fv': {
      2: {arrays: [1]},
      3: {arrays: [1], numbers: [2]},
      4: {arrays: [1], numbers: [2, 3]},
    },

    'uniform1iv': {
      2: {arrays: [1]},
      3: {arrays: [1], numbers: [2]},
      4: {arrays: [1], numbers: [2, 3]},
    },
    'uniform2iv': {
      2: {arrays: [1]},
      3: {arrays: [1], numbers: [2]},
      4: {arrays: [1], numbers: [2, 3]},
    },
    'uniform3iv': {
      2: {arrays: [1]},
      3: {arrays: [1], numbers: [2]},
      4: {arrays: [1], numbers: [2, 3]},
    },
    'uniform4iv': {
      2: {arrays: [1]},
      3: {arrays: [1], numbers: [2]},
      4: {arrays: [1], numbers: [2, 3]},
    },

    'uniformMatrix2fv': {
      3: {arrays: [2]},
      4: {arrays: [2], numbers: [3]},
      5: {arrays: [2], numbers: [3, 4]},
    },
    'uniformMatrix3fv': {
      3: {arrays: [2]},
      4: {arrays: [2], numbers: [3]},
      5: {arrays: [2], numbers: [3, 4]},
    },
    'uniformMatrix4fv': {
      3: {arrays: [2]},
      4: {arrays: [2], numbers: [3]},
      5: {arrays: [2], numbers: [3, 4]},
    },

    'uniform1ui': { 2: {numbers: [1]} },  // WebGL2
    'uniform2ui': { 3: {numbers: [1, 2]} },  // WebGL2
    'uniform3ui': { 4: {numbers: [1, 2, 3]} },  // WebGL2
    'uniform4ui': { 5: {numbers: [1, 2, 3, 4]} },  // WebGL2

    'uniform1uiv': {  // WebGL2
      2: { arrays: [1], },
      3: { arrays: [1], numbers: [2] },
      4: { arrays: [1], numbers: [2, 3] },
    },
    'uniform2uiv': {  // WebGL2
      2: { arrays: [1], },
      3: { arrays: [1], numbers: [2] },
      4: { arrays: [1], numbers: [2, 3] },
    },
    'uniform3uiv': {  // WebGL2
      2: { arrays: [1], },
      3: { arrays: [1], numbers: [2] },
      4: { arrays: [1], numbers: [2, 3] },
    },
    'uniform4uiv': {  // WebGL2
      2: { arrays: [1], },
      3: { arrays: [1], numbers: [2] },
      4: { arrays: [1], numbers: [2, 3] },
    },
    'uniformMatrix3x2fv': {  // WebGL2
      3: { arrays: [2], },
      4: { arrays: [3], numbers: [3] },
      5: { arrays: [4], numbers: [3, 4] },
    },
    'uniformMatrix4x2fv': {  // WebGL2
      3: { arrays: [2], },
      4: { arrays: [3], numbers: [3] },
      5: { arrays: [4], numbers: [3, 4] },
    },

    'uniformMatrix2x3fv': {  // WebGL2
      3: { arrays: [2], },
      4: { arrays: [3], numbers: [3] },
      5: { arrays: [4], numbers: [3, 4] },
    },
    'uniformMatrix4x3fv': {  // WebGL2
      3: { arrays: [2], },
      4: { arrays: [3], numbers: [3] },
      5: { arrays: [4], numbers: [3, 4] },
    },

    'uniformMatrix2x4fv': {  // WebGL2
      3: { arrays: [2], },
      4: { arrays: [3], numbers: [3] },
      5: { arrays: [4], numbers: [3, 4] },
    },
    'uniformMatrix3x4fv': {  // WebGL2
      3: { arrays: [2], },
      4: { arrays: [3], numbers: [3] },
      5: { arrays: [4], numbers: [3, 4] },
    },

    // attribute value setters
    'vertexAttrib1f': { 2: {numbers: [0, 1]}},
    'vertexAttrib2f': { 3: {numbers: [0, 1, 2]}},
    'vertexAttrib3f': { 4: {numbers: [0, 1, 2, 3]}},
    'vertexAttrib4f': { 5: {numbers: [0, 1, 2, 3, 4]}},

    'vertexAttrib1fv': { 2: {numbers: [0], arrays: [1]}},
    'vertexAttrib2fv': { 2: {numbers: [0], arrays: [1]}},
    'vertexAttrib3fv': { 2: {numbers: [0], arrays: [1]}},
    'vertexAttrib4fv': { 2: {numbers: [0], arrays: [1]}},

    'vertexAttribI4i': { 5: {numbers: [0, 1, 2, 3, 4]}},  // WebGL2
    'vertexAttribI4iv': {2: {numbers: [0], arrays: [1]}},  // WebGL2
    'vertexAttribI4ui': {5: {numbers: [0, 1, 2, 3, 4]}},  // WebGL2
    'vertexAttribI4uiv': {2: {numbers: [0], arrays: [1]}},  // WebGL2

    // QueryObjects

    'beginQuery': { 2: { enums: [0] }},  // WebGL2
    'endQuery': { 1: { enums: [0] }},  // WebGL2
    'getQuery': { 2: { enums: [0, 1] }},  // WebGL2
    'getQueryParameter': { 2: { enums: [1] }},  // WebGL2

    //  Sampler Objects

    'samplerParameteri': { 3: { enums: [1] }},  // WebGL2
    'samplerParameterf': { 3: { enums: [1] }},  // WebGL2
    'getSamplerParameter': { 2: { enums: [1] }},  // WebGL2

    //  Sync objects

    'clientWaitSync': { 3: { enums: { 1: makeBitFieldToStringFunc(['SYNC_FLUSH_COMMANDS_BIT']) }, numbers: [2] }},  // WebGL2
    'fenceSync': { 2: { enums: [0] }},  // WebGL2
    'getSyncParameter': { 2: { enums: [1] }},  // WebGL2

    //  Transform Feedback

    'bindTransformFeedback': { 2: { enums: [0] }},  // WebGL2
    'beginTransformFeedback': { 1: { enums: [0] }},  // WebGL2

    // Uniform Buffer Objects and Transform Feedback Buffers
    'bindBufferBase': { 3: { enums: [0], numbers: [1]}},  // WebGL2
    'bindBufferRange': { 5: { enums: [0], numbers: [1, 3, 4]}},  // WebGL2
    'getIndexedParameter': { 2: { enums: [0], numbers: [1] }},  // WebGL2
    'getActiveUniforms': { 3: { enums: [2] }, arrays: [1]},  // WebGL2
    'getActiveUniformBlockParameter': { 3: { enums: [2], numbers: [1] }},  // WebGL2
    'getActiveUniformBlockName': { 2: {numbers: [1]}}, // WebGL2
    'uniformBlockBinding': { 3: { numbers: [1, 2]}}, // WebGL2
  };
  for (const [name, fnInfos] of Object.entries(glFunctionInfos)) {
    for (const fnInfo of Object.values(fnInfos)) {
      convertToObjectIfArray(fnInfo, 'enums');
      convertToObjectIfArray(fnInfo, 'numbers');
      convertToObjectIfArray(fnInfo, 'arrays');
    }
    if (/uniform(\d|Matrix)/.test(name)) {
      fnInfos.errorHelper = getUniformNameErrorMsg;
    }
  }

  function convertToObjectIfArray(obj, key) {
    if (Array.isArray(obj[key])) {
      obj[key] = Object.fromEntries(obj[key].map(ndx => [Math.abs(ndx), ndx]));
    }
  }

  /*
  function indexedBindHelper(gl, funcName, args, value) {
    const [target, index] = args;
    switch (target) {
      case gl.TRANSFORM_FEEDBACK_BUFFER:
        return gl.getIndexedBinding(gl.TRANSFORM_FEEDBACK_BUFFER_BINDING, index);
        break;
      case gl.UNIFORM_BUFFER:
        return gl.getIndexedBinding(gl.UNIFORM_BUFFER_BINDING, index);
        break;
    }
  }
  */

  function isTypedArray(v) {
    return v && v.buffer && v.buffer instanceof ArrayBuffer;
  }

  function isArrayThatCanHaveBadValues(v) {
    return Array.isArray(v) ||
           v instanceof Float32Array ||
           v instanceof Float64Array;
  }

  /** @type Map<int, Set<string>> */
  const enumToStringsMap = new Map();
  function addEnumsFromAPI(api) {
    for (let key in api) {
      const value = api[key];
      if (typeof value === 'number') {
        if (!enumToStringsMap.has(value)) {
          enumToStringsMap.set(value, new Set());
        }
        enumToStringsMap.get(value).add(key);
      }
    }
  }

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  function glEnumToString(gl, value) {
    const matches = enumToStringsMap.get(value);
    return matches
        ? [...matches.keys()].map(v => `${v}`).join(' | ')
        : `/*UNKNOWN WebGL ENUM*/ ${typeof value === 'number' ? `0x${value.toString(16)}` : value}`;
  }

  function quoteStringOrEmpty(s) {
    return s ? `"${s}"` : '';
  }

  function getUniformNameErrorMsg(ctx, funcName, args, sharedState) {
    const location = args[0];
    const name = sharedState.locationsToNamesMap.get(location);
    const prg = ctx.getParameter(ctx.CURRENT_PROGRAM);
    const msgs = [];
    if (name) {
      msgs.push(`trying to set uniform '${name}'`);
    } 
    if (prg) {
      const name = sharedState.webglObjectToNamesMap.get(prg);
      if (name) {
        msgs.push(`on WebGLProgram(${quoteStringOrEmpty(name)})`);
      }
    } else {
      msgs.push('on ** no current program **');
    }
    return msgs.length ? `: ${msgs.join(' ')}` : '';
  }

  /**
   * Given a WebGL context replaces all the functions with wrapped functions
   * that call gl.getError after every command 
   *
   * @param {WebGLRenderingContext|Extension} ctx The webgl context to wrap.
   * @param {string} nameOfClass (eg, webgl, webgl2, OES_texture_float)
   */
  function augmentWebGLContext(ctx, nameOfClass, options = {}) {
    const origGLErrorFn = options.origGLErrorFn || ctx.getError;
    const sharedState = options.sharedState || {
      baseContext: ctx,
      config: options,
      wrappers: {
        // custom extension
        gman_debug_helper: {
          ctx: {
            tagObject(webglObject, name) {
              // There's no easy way to check if it's a WebGLObject
              // and I guess we mostly don't care but a minor check is probably
              // okay
              if (Array.isArray(webglObject) || isTypedArray(webglObject) || typeof webglObject !== 'object') {
                throw new Error('not a WebGLObject');
              }
              sharedState.webglObjectToNamesMap.set(webglObject, name);
            },
            getTagForObject(webglObject) {
              return sharedState.webglObjectToNamesMap.get(webglObject);
            },
            setConfiguration(config) {
              for (const [key, value] of Object.entries(config)) {
                if (!key in sharedState.config) {
                  throw new Error(`unknown configuration option: ${key}`);
                }
                sharedState.config[key] = value;
              }
              for (const name of sharedState.config.ignoreUniforms) {
                sharedState.ignoredUniforms.add(name);
              }
            },
          },
        },
      },
      ignoredUniforms: new Set(),
      locationsToNamesMap: new Map(),
      webglObjectToNamesMap: new Map(),
      // class UnusedUniformRef {
      //   index: the index of this name. for foo[3] it's 3
      //   altNames: Map<string, number>  // example <foo,0>, <foo[0],0>, <foo[1],1>, <foo[2],2>, <foo[3],3>  for `uniform vec4 foo[3]`
      //   unused: Set<number>    // this is size so for the example above it's `Set<[0, 1, 2, 3]`
      // }
      // Both the altName array and the unused Set are shared with an entry in `programToUniformsMap`
      // by each name (foo, foo[0], foo[1], foo[2]). That we we can unused.delete each element of set
      // and if set is empty then delete all altNames entries from programToUniformsMap.
      // When programsToUniformsMap is empty all uniforms have been set.
      // Map<WebGLProgram, Map<string, UnusedUniformRef>
      programToUniformsMap: new Map(),
    };
    options.sharedState = sharedState;
    addEnumsFromAPI(ctx);

    // Holds booleans for each GL error so after we get the error ourselves
    // we can still return it to the client app.
    const glErrorShadow = { };
    const origFuncs = {};

    function removeChecks() {
      for (const {ctx, origFuncs} of Object.values(sharedState.wrappers)) {
        Object.assign(ctx, origFuncs);
      }
      sharedState.locationsToNamesMap = new Map();
    }

    function checkMaxDrawCallsAndZeroCount(gl, funcName, args) {
      const {vertCount, instances} = funcsToArgs[funcName](...args);
      if (vertCount === 0) {
        console.warn(`count for ${funcName} is 0!`);
      }

      if (instances === 0) {
        console.warn(`instanceCount for ${funcName} is 0!`);
      }

      if (sharedState.maxDrawCalls === 0) {
        removeChecks();
      }
      --sharedState.maxDrawCalls;
    }

    function noop() {
    }

    function reportError(errorMsg) {
      const errorInfo = parseStack((new Error()).stack);
      const msg = errorInfo
          ? `${errorInfo.url}:${errorInfo.lineNo}: ${errorMsg}`
          : errorMsg;
      if (sharedState.config.throwOnError) {
        throw new Error(msg);
      } else {
        console.error(msg);
      }
    }

    // I know ths is not a full check
    function isNumber(v) {
      return typeof v === 'number';
    }

    const VERTEX_ARRAY_BINDING = 0x85B5;

    function getCurrentVertexArray(ctx) {
      const gl = sharedState.baseContext;
      return (gl instanceof WebGL2RenderingContext || sharedState.wrappers.oes_vertex_array_object)
         ? gl.getParameter(VERTEX_ARRAY_BINDING)
         : null;
    }

    function checkUnsetUniforms(ctx, funcName, args) {
      const unsetUniforms = sharedState.programToUniformsMap.get(sharedState.currentProgram);
      if (unsetUniforms) {
        const uniformNames = [];
        for (const [name, {index, unset}] of unsetUniforms) {
          if (unset.has(index)) {
            uniformNames.push(name);
          }
        }
        reportFunctionError(ctx, funcName, args, `uniforms "${uniformNames.join('", "')}" have not been set\nSee docs at https://github.com/greggman/webgl-helpers/ for how to turn off this check`);
      }
    }

    const preChecks = {
      drawArrays: checkUnsetUniforms,
      drawElements: checkUnsetUniforms,
      drawArraysInstanced: checkUnsetUniforms,
      drawElementsInstanced: checkUnsetUniforms,
      drawArraysInstancedANGLE: checkUnsetUniforms,
      drawElementsInstancedANGLE: checkUnsetUniforms,
      drawRangeElements: checkUnsetUniforms,
    };

    function markUniformRangeAsSet(webGLUniformLocation, count) {
      const unsetUniforms = sharedState.programToUniformsMap.get(sharedState.currentProgram);
      if (!unsetUniforms) {
        // no unset uniforms
        return;
      }
      const uniformName = sharedState.locationsToNamesMap.get(webGLUniformLocation);
      const info = unsetUniforms.get(uniformName);
      if (!info) {
        // this uniform already set
        return;
      }
      // remove unset
      for (let i = 0; i < count; ++i) {
        info.unset.delete(info.index + i);
      }
      // have all values for this uniform been set?
      if (!info.unset.size) {
        // yes, so no checking for this uniform needed anymore
        for (const [name] of info.altNames) {
          unsetUniforms.delete(name);
        }
        // have all uniforms in this program been set?
        if (!unsetUniforms.size) {
          // yes, so no checking needed for this program anymore
          sharedState.programToUniformsMap.delete(sharedState.currentProgram);
        }
      }
    }

    function markUniformSetV(numValuesPer) {
      return function(gl, funcName, args) {
        let [webGLUniformLocation, data, srcOffset = 0, srcLength = 0] = args;
        if (srcLength === 0) {
          srcLength = data.length - srcOffset;
        }
        markUniformRangeAsSet(webGLUniformLocation, srcLength / numValuesPer | 0);
      };
    }

    function isUniformIgnored(webglUniformLocation) {
      return sharedState.ignoredUniforms.has(sharedState.locationsToNamesMap.get(webglUniformLocation));
    }

    function markUniformSetMatrixV(numValuesPer) {
      return function(gl, funcName, args) {
        let [webGLUniformLocation, transpose, data, srcOffset = 0, srcLength = 0] = args;
        if (srcLength === 0) {
          srcLength = data.length - srcOffset;
        }
        const count = srcLength / numValuesPer | 0;
        if (sharedState.config.failZeroMatrixUniforms && !isUniformIgnored(webGLUniformLocation)) {
          for (let c = 0; c < count; ++c) {
            let allZero = true;
            const baseOffset = srcOffset + numValuesPer * c;
            for (let i = 0; i < numValuesPer; ++i) {
              if (data[baseOffset + i]) {
                allZero = false;
                break;
              }
            }
            if (allZero) {
              reportFunctionError(gl, funcName, [webGLUniformLocation, transpose, ...args], `matrix is all zeros\nSee docs at https://github.com/greggman/webgl-helpers/ for how to turn off this check`);
            }
          }
        }
        markUniformRangeAsSet(webGLUniformLocation, count);
      };
    }

    function markUniformSet(gl, funcName, args) {
      const [webGLUniformLocation] = args;
      markUniformRangeAsSet(webGLUniformLocation, 1);
    }

    const postChecks = {
      // WebGL1
      //   void bufferData(GLenum target, GLsizeiptr size, GLenum usage);
      //   void bufferData(GLenum target, [AllowShared] BufferSource? srcData, GLenum usage);
      // WebGL2:
      //   void bufferData(GLenum target, [AllowShared] ArrayBufferView srcData, GLenum usage, GLuint srcOffset,
      //                   optional GLuint length = 0);
      bufferData(gl, funcName, args) {
        const [target, src, usage, srcOffset = 0, length = 0] = args;
        if (target !== gl.ELEMENT_ARRAY_BUFFER) {
          return;
        }
        const buffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        if (isNumber(src)) {
          bufferToIndices.set(buffer, new ArrayBuffer(src));
        } else {
          const isDataView = src instanceof DataView;
          const copyLength = length ? length : isDataView
             ? src.byteLength - srcOffset
             : src.length - srcOffset;
          const elemSize = isDataView ? 1 : src.BYTES_PER_ELEMENT;
          const bufSize = copyLength * elemSize;
          const arrayBuffer = src.buffer ? src.buffer : src;
          bufferToIndices.set(buffer, arrayBuffer.slice(srcOffset * elemSize, bufSize));
        }
      },
      // WebGL1
      //   void bufferSubData(GLenum target, GLintptr dstByteOffset, [AllowShared] BufferSource srcData);
      // WebGL2
      //   void bufferSubData(GLenum target, GLintptr dstByteOffset, [AllowShared] ArrayBufferView srcData,
      //                      GLuint srcOffset, optional GLuint length = 0);
      bufferSubData(gl, funcName, args) {
        const [target, dstByteOffset, src, srcOffset, length = 0] = args;
        if (target !== gl.ELEMENT_ARRAY_BUFFER) {
          return;
        }
        const buffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        const data = bufferToIndices.get(buffer);
        const view = new Uint8Array(data);
        const isDataView = src instanceof DataView;
        const copyLength = length ? length : isDataView
           ? src.byteLength - srcOffset
           : src.length - srcOffset;
        const elemSize = isDataView ? 1 : src.BYTES_PER_ELEMENT;
        const copySize = copyLength * elemSize;
        const arrayBuffer = src.buffer ? src.buffer : src;
        const newView = new Uint8Array(arrayBuffer, srcOffset * elemSize, copySize);
        view.set(newView, dstByteOffset);
      },

      drawArrays: checkMaxDrawCallsAndZeroCount,
      drawElements: checkMaxDrawCallsAndZeroCount,
      drawArraysInstanced: checkMaxDrawCallsAndZeroCount,
      drawElementsInstanced: checkMaxDrawCallsAndZeroCount,
      drawArraysInstancedANGLE: checkMaxDrawCallsAndZeroCount,
      drawElementsInstancedANGLE: checkMaxDrawCallsAndZeroCount,
      drawRangeElements: checkMaxDrawCallsAndZeroCount,

      uniform1f: markUniformSet,
      uniform2f: markUniformSet,
      uniform3f: markUniformSet,
      uniform4f: markUniformSet,

      uniform1i: markUniformSet,
      uniform2i: markUniformSet,
      uniform3i: markUniformSet,
      uniform4i: markUniformSet,

      uniform1fv: markUniformSetV(1),
      uniform2fv: markUniformSetV(2),
      uniform3fv: markUniformSetV(3),
      uniform4fv: markUniformSetV(4),

      uniform1iv: markUniformSetV(1),
      uniform2iv: markUniformSetV(2),
      uniform3iv: markUniformSetV(3),
      uniform4iv: markUniformSetV(4),

      uniformMatrix2fv: markUniformSetMatrixV(4),
      uniformMatrix3fv: markUniformSetMatrixV(9),
      uniformMatrix4fv: markUniformSetMatrixV(16),

      uniform1ui: markUniformSet,
      uniform2ui: markUniformSet,
      uniform3ui: markUniformSet,
      uniform4ui: markUniformSet,

      uniform1uiv: markUniformSetV(1),
      uniform2uiv: markUniformSetV(2),
      uniform3uiv: markUniformSetV(3),
      uniform4uiv: markUniformSetV(4),

      uniformMatrix3x2fv: markUniformSetMatrixV(6),
      uniformMatrix4x2fv: markUniformSetMatrixV(8),

      uniformMatrix2x3fv: markUniformSetMatrixV(6),
      uniformMatrix4x3fv: markUniformSetMatrixV(12),

      uniformMatrix2x4fv: markUniformSetMatrixV(8),
      uniformMatrix3x4fv: markUniformSetMatrixV(12),
    }

    /*
    function getWebGLObject(gl, funcName, args, value) {
      const funcInfos = glFunctionInfos[funcName];
      if (funcInfos && funcInfos.bindHelper) {
        return funcInfos.bindHelper(gl, value);
      }
      const binding = bindPointMap.get(value);
      return binding ? gl.getParameter(binding) : null;
    }
    */

    function getWebGLObjectString(webglObject) {
      const name = sharedState.webglObjectToNamesMap.get(webglObject) || '*unnamed*';
      return `${webglObject.constructor.name}(${quoteStringOrEmpty(name)})`;
    }

    /**
     * Returns the string version of a WebGL argument.
     * Attempts to convert enum arguments to strings.
     * @param {string} funcName the name of the WebGL function.
     * @param {number} numArgs the number of arguments passed to the function.
     * @param {number} argumentIndx the index of the argument.
     * @param {*} value The value of the argument.
     * @return {string} The value as a string.
     */
    function glFunctionArgToString(gl, funcName, numArgs, argumentIndex, value) {
      // there's apparently no easy to find out if something is a WebGLObject
      // as `WebGLObject` has been hidden. We could check all the types but lets
      // just check if the user mapped something
      const name = sharedState.webglObjectToNamesMap.get(value);
      if (name) {
        return `${value.constructor.name}("${name}")`;
      }
      if (value instanceof WebGLUniformLocation) {
        const name = sharedState.locationsToNamesMap.get(value);
        return `WebGLUniformLocation("${name}")`;
      }
      const funcInfos = glFunctionInfos[funcName];
      if (funcInfos !== undefined) {
        const funcInfo = funcInfos[numArgs];
        if (funcInfo !== undefined) {
          const argTypes = funcInfo.enums;
          if (argTypes) {
            const argType = argTypes[argumentIndex];
            if (argType !== undefined) {
              if (typeof argType === 'function') {
                return argType(gl, value);
              } else {
                // is it a bind point
                //
                // I'm not sure what cases there are. At first I thought I'd
                // translate every enum representing a bind point into its corresponding
                // WebGLObject but that fails for `bindXXX` and for `framebufferTexture2D`'s
                // 3rd argument.
                //
                // Maybe it only works if it's not `bindXXX` and if its the first argument?
                //
                // issues:
                //   * bindBufferBase, bindBufferRange, indexed
                //
                // should we do something about these?
                //   O vertexAttrib, enable, vertex arrays implicit, buffer is implicit
                //       Example: could print
                //            'Error setting attrib 4 of WebGLVAO("sphere") to WebGLBuffer("sphere positions")
                //   O drawBuffers implicit
                //       Example: 'Error trying to set drawBuffers on WebGLFrameBuffer('post-processing-fb)
                if (!funcName.startsWith('bind') && argumentIndex === 0) {
                  const binding = bindPointMap.get(value);
                  if (binding) {
                    const webglObject = gl.getParameter(binding);
                    if (webglObject) {
                      return getWebGLObjectString(webglObject);
                    }
                  }
                }
                return glEnumToString(gl, value);
              }
            }
          }
        }
      }
      if (value === null) {
        return 'null';
      } else if (value === undefined) {
        return 'undefined';
      } else if (Array.isArray(value) || isTypedArray(value)) {
        if (value.length <= 32) {
          return `[${Array.from(value.slice(0, 32)).join(', ')}]`;
        } else {
          return `${value.constructor.name}(${value.length !== undefined ? value.length : value.byteLength})`;
        }
      } else {
        return value.toString();
      }
    }

    /**
     * Converts the arguments of a WebGL function to a string.
     * Attempts to convert enum arguments to strings.
     *
     * @param {string} funcName the name of the WebGL function.
     * @param {number} args The arguments.
     * @return {string} The arguments as a string.
     */
    function glFunctionArgsToString(ctx, funcName, args) {
      const numArgs = args.length;
      const stringifiedArgs = args.map(function(arg, ndx) {
        let str = glFunctionArgToString(ctx, funcName, numArgs, ndx, arg);
        // shorten because of long arrays
        if (str.length > 200) {
          str = str.substring(0, 200) + '...';
        }
        return str;
      });
      return stringifiedArgs.join(', ');
    }

    function reportFunctionError(ctx, funcName, args, msg) {
      const msgs = [msg];
      const funcInfos = glFunctionInfos[funcName];
      if (funcInfos && funcInfos.errorHelper) {
        msgs.push(funcInfos.errorHelper(ctx, funcName, args, sharedState));
      }
      if (funcName.includes('vertexAttrib') || funcName.startsWith('draw')) {
        const vao = getCurrentVertexArray(ctx);
        const name = sharedState.webglObjectToNamesMap.get(vao);
        const vaoName = `WebGLVertexArrayObject(${quoteStringOrEmpty(name)})`;
        msgs.push(`with ${vao ? vaoName : 'the default vertex array'} bound`);
      }
      const stringifiedArgs = glFunctionArgsToString(ctx, funcName, args);
      const errorMsg = `error in ${funcName}(${stringifiedArgs}): ${msgs.join('\n')}`;
      reportError(errorMsg);
    }

    // Makes a function that calls a WebGL function and then calls getError.
    function makeErrorWrapper(ctx, funcName) {
      const origFn = ctx[funcName];
      const preCheck = preChecks[funcName] || noop;
      const postCheck = postChecks[funcName] || noop;
      ctx[funcName] = function(...args) {
        preCheck(ctx, funcName, args);
        const funcInfos = glFunctionInfos[funcName];
        if (funcInfos) {
          const {numbers = {}, arrays = {}} = funcInfos[args.length];
          for (let ndx = 0; ndx < args.length; ++ndx) {
            const arg = args[ndx];
            // check the no arguments are undefined
            if (arg === undefined) {
              reportFunctionError(ctx, funcName, args, `argument ${ndx} is undefined`);
            }
            if (numbers[ndx] !== undefined) {
              if (numbers[ndx] >= 0)  {
                // check that argument that is number (positive) is a number
                if ((typeof arg !== 'number' && !(arg instanceof Number) && arg !== false && arg !== true) || isNaN(arg)) {
                  reportFunctionError(ctx, funcName, args, `argument ${ndx} is not a number`);
                }
              } else {
                // check that argument that maybe is a number (negative) is not NaN
                if (!arg instanceof Object && isNaN(arg)) {
                  reportFunctionError(ctx, funcName, args, `argument ${ndx} is NaN`);
                }
              }
            }
            // check that an argument that is supposed to be an array of numbers is an array and has no NaNs in the array and no undefined
            if (arrays[ndx] !== undefined) {
              const isArrayLike = Array.isArray(arg) || isTypedArray(arg);
              if (arrays[ndx] >= 0) {
                if (!isArrayLike) {
                  reportFunctionError(ctx, funcName, args, `argument ${ndx} is not a array or typedarray`);
                }
              }
              if (isArrayLike && isArrayThatCanHaveBadValues(arg)) {
                for (let i = 0; i < arg.length; ++i) {
                  if (arg[i] === undefined) {
                    reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is undefined`);
                  }
                  if (isNaN(arg[i])) {
                    reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is NaN`);
                  }
                }
              }
            }
          }
        }

        const result = origFn.call(ctx, ...args);
        const gl = sharedState.baseContext;
        const err = origGLErrorFn.call(gl);
        if (err !== 0) {
          glErrorShadow[err] = true;
          const msgs = [glEnumToString(ctx, err)];
          // this is draw. drawBuffers starts with draw
          if (funcName.startsWith('draw')) {
            const program = gl.getParameter(gl.CURRENT_PROGRAM);
            if (!program) {
              msgs.push('no shader program in use!');
            } else {
              msgs.push(`with ${getWebGLObjectString(program)}`);
              msgs.push(...checkFramebufferFeedback(gl, getWebGLObjectString));
              msgs.push(...checkAttributes(gl, funcName, args, getWebGLObjectString));
            }
          }
          reportFunctionError(ctx, funcName, args, msgs.join('\n'));
        }
        postCheck(ctx, funcName, args);
        return result;
      };
    }

    function range(start, end) {
      const array = [];
      for (let i = start; i < end; ++i) {
        array.push(i);
      }
      return array;
    }

    function makeDeleteWrapper(ctx, funcName) {
      const origFn = ctx[funcName];
      ctx[funcName] = function(obj) {
        sharedState.webglObjectToNamesMap.delete(obj);
        origFn.call(this, obj);
      };
    }

    const postHandlers = {
      getExtension(ctx, propertyName, origGLErrorFn) {
        const origFn = ctx[propertyName];
        ctx[propertyName] = function(...args) {
          const extensionName = args[0].toLowerCase();
          const wrapper = sharedState.wrappers[extensionName];
          if (wrapper) {
            return wrapper.ctx;
          }
          const ext = origFn.call(ctx, ...args);
          if (ext) {
            augmentWebGLContext(ext, extensionName, {...options, origGLErrorFn});
            addEnumsForContext(ext, extensionName);
          }
          return ext;
        };
      },

      getSupportedExtensions(ctx) {
        const origFn = ctx.getSupportedExtensions;
        ctx.getSupportedExtensions = function() {
          return origFn.call(this).concat('GMAN_debug_helper');
        };
      },

      getUniformLocation(ctx) {
        const origFn = ctx.getUniformLocation;
        ctx.getUniformLocation = function(program, name) {
          const location = origFn.call(this, program, name);
          if (location) {
            sharedState.locationsToNamesMap.set(location, name);
          }
          return location;
        };
      },

      linkProgram(ctx) {
        const origFn = ctx.linkProgram;
        ctx.linkProgram = function(program) {
          const gl = this;
          origFn.call(this, program);
          const success = this.getProgramParameter(program, gl.LINK_STATUS);
          if (success) {
            sharedState.programToUniformsMap.delete(program);
            if (!sharedState.config.failUnsetUniforms) {
              return;
            }
            const unsetUniforms = new Map();
            const numUniforms = this.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            for (let ii = 0; ii < numUniforms; ++ii) {
              const {name, type, size} = gl.getActiveUniform(program, ii);
              if (isBuiltIn(name)
                  || (isSampler(type) && !sharedState.config.failUnsetUniformSamplers)
                  || sharedState.ignoredUniforms.has(name)) {
                continue;
              }
              // skip uniform block uniforms
              const location = gl.getUniformLocation(program, name);
              if (!location) {
                continue;
              }
              const altNames = new Map([[name, 0]]);
              let baseName = name;
              if (name.endsWith('[0]')) {
                baseName = name.substr(0, name.length - 3);
                altNames.set(baseName, 0);
              }
              if (size > 1) {
                for (let s = 0; s < size; ++s) {
                  altNames.set(`${baseName}[${s}]`, s);
                }
              }
              const unset = new Set(range(0, size));
              for (const [name, index] of altNames) {
                unsetUniforms.set(name, {
                  index,
                  unset,
                  altNames,
              });
              }
            }
            if (unsetUniforms.size) {
              sharedState.programToUniformsMap.set(program, unsetUniforms);
            }
          }
        }
      },

      useProgram(ctx) {
        const origFn = ctx.useProgram;
        ctx.useProgram = function(program) {
          origFn.call(this, program);
          sharedState.currentProgram = program;
        };
      },

      deleteProgram(ctx, funcName) {
        makeDeleteWrapper(ctx, funcName);
        const origFn = ctx.deleteProgram;
        ctx.deleteProgram = function(program) {
          if (sharedState.currentProgram === program) {
            sharedState.currentProgram = undefined;
          }
          origFn.call(this, program);
          sharedState.programToUniformsMap.delete(program);
        };
      },

      deleteBuffer: makeDeleteWrapper,
      deleteFramebuffer: makeDeleteWrapper,
      deleteRenderbuffer: makeDeleteWrapper,
      deleteTexture: makeDeleteWrapper,
      deleteShader: makeDeleteWrapper,
      deleteQuery: makeDeleteWrapper,
      deleteSampler: makeDeleteWrapper,
      deleteSync: makeDeleteWrapper,
      deleteTransformFeedback: makeDeleteWrapper,
      deleteVertexArray: makeDeleteWrapper,
      deleteVertexArrayOES: makeDeleteWrapper,
    }

    // Wrap each function
    for (const propertyName in ctx) {
      if (typeof ctx[propertyName] === 'function') {
        origFuncs[propertyName] = ctx[propertyName];
        makeErrorWrapper(ctx, propertyName);
        const postHandler = postHandlers[propertyName];
        if (postHandler) {
          postHandler(ctx, propertyName, origGLErrorFn);
        }
      }
    }

    // Override the getError function with one that returns our saved results.
    if (ctx.getError) {
      ctx.getError = function() {
        for (const err of Object.keys(glErrorShadow)) {
          if (glErrorShadow[err]) {
            glErrorShadow[err] = false;
            return err;
          }
        }
        return ctx.NO_ERROR;
      };
    }

    sharedState.wrappers[nameOfClass.toLowerCase()] = { ctx, origFuncs };
    if (ctx.bindBuffer) {
      addEnumsForContext(ctx, ctx.bindBufferBase ? 'WebGL2' : 'WebGL');
    }
  }

  // adapted from http://stackoverflow.com/a/2401861/128511
  function getBrowser() {
    const userAgent = navigator.userAgent;
    let m = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(m[1])) {
      m = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
      return {
        name: 'IE',
        version: m[1],
      };
    }
    if (m[1] === 'Chrome') {
      const temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
      if (temp) {
        return {
          name: temp[1].replace('OPR', 'Opera'),
          version: temp[2],
        };
      }
    }
    m = m[2] ? [m[1], m[2]] : [navigator.appName, navigator.appVersion, '-?'];
    const version = userAgent.match(/version\/(\d+)/i);
    if (version) {
      m.splice(1, 1, version[1]);
    }
    return {
      name: m[0],
      version: m[1],
    };
  }

  /**
   * @typedef {Object} StackInfo
   * @property {string} url Url of line
   * @property {number} lineNo line number of error
   * @property {number} colNo column number of error
   * @property {string} [funcName] name of function
   */

  /**
   * @parameter {string} stack A stack string as in `(new Error()).stack`
   * @returns {StackInfo}
   */
  const parseStack = function() {
    const browser = getBrowser();
    let lineNdx;
    let matcher;
    if ((/chrome|opera/i).test(browser.name)) {
      lineNdx = 3;
      matcher = function(line) {
        const m = /at ([^(]+)*\(*(.*?):(\d+):(\d+)/.exec(line);
        if (m) {
          let userFnName = m[1];
          let url = m[2];
          const lineNo = parseInt(m[3]);
          const colNo = parseInt(m[4]);
          if (url === '') {
            url = userFnName;
            userFnName = '';
          }
          return {
            url: url,
            lineNo: lineNo,
            colNo: colNo,
            funcName: userFnName,
          };
        }
        return undefined;
      };
    } else if ((/firefox|safari/i).test(browser.name)) {
      lineNdx = 2;
      matcher = function(line) {
        const m = /@(.*?):(\d+):(\d+)/.exec(line);
        if (m) {
          const url = m[1];
          const lineNo = parseInt(m[2]);
          const colNo = parseInt(m[3]);
          return {
            url: url,
            lineNo: lineNo,
            colNo: colNo,
          };
        }
        return undefined;
      };
    }

    return function stackParser(stack) {
      if (matcher) {
        try {
          const lines = stack.split('\n');
          // window.fooLines = lines;
          // lines.forEach(function(line, ndx) {
          //   origConsole.log("#", ndx, line);
          // });
          return matcher(lines[lineNdx]);
        } catch (e) {
          // do nothing
        }
      }
      return undefined;
    };
  }();

  function wrapGetContext(Ctor) {
    const oldFn = Ctor.prototype.getContext;
    Ctor.prototype.getContext = function(type, ...args) {
      let ctx = oldFn.call(this, type, ...args);
      // Using bindTexture to see if it's WebGL. Could check for instanceof WebGLRenderingContext
      // but that might fail if wrapped by debugging extension
      if (ctx && ctx.bindTexture) {
        const config = {
          maxDrawCalls: 1000,
          throwOnError: true,
          failUnsetUniforms: true,
          failUnsetSamplerUniforms: false,
          failZeroMatrixUniforms: true,
          ignoreUniforms: [],
        };
        augmentWebGLContext(ctx, type, config);
        const ext = ctx.getExtension('GMAN_debug_helper');
        document.querySelectorAll('[data-gman-debug-helper]').forEach(elem => {
          const str = elem.dataset.gmanDebugHelper;
          let config;
          try {
            config = JSON.parse();
          } catch (e) {
            e.message += `\n${str}\nfailed to parse data-gman-debug-helper as JSON in: ${elem.outerHTML}`;
            throw e;
          }
          if (config) {
            ext.setConfiguration(config);
          }
        });
      }
      return ctx;
    };
  };

  if (typeof HTMLCanvasElement !== "undefined") {
    wrapGetContext(HTMLCanvasElement);
  }
  if (typeof OffscreenCanvas !== "undefined") {
    wrapGetContext(OffscreenCanvas);
  }

})();

