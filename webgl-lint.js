/* webgl-lint@1.2.1, license MIT */
(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  function isBuiltIn(name) {
    return name.startsWith('gl_') || name.startsWith('webgl_');
  }

  function isWebGL2(gl) {
    // a proxy for if this is webgl
    return !!gl.texImage3D;
  }

  function isTypedArray(v) {
    return v && v.buffer && v.buffer instanceof ArrayBuffer;
  }

  function isArrayThatCanHaveBadValues(v) {
    return Array.isArray(v) ||
           v instanceof Float32Array ||
           v instanceof Float64Array;
  }

  function quotedStringOrEmpty(s) {
    return s ? `"${s}"` : '';
  }

  /**
   * Map of names to numbers.
   * @type {Object}
   */
  const enumStringToValue = {};

  function enumArrayToString(gl, enums) {
    const enumStrings = [];
    if (enums.length) {
      for (let i = 0; i < enums.length; ++i) {
        enums.push(glEnumToString(enums[i]));  // eslint-disable-line
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
          orEnums.push(glEnumToString(enumValue));  // eslint-disable-line
        }
      }
      if (orResult === value) {
        return orEnums.join(' | ');
      } else {
        return glEnumToString(value);  // eslint-disable-line
      }
    };
  }

  /** @type Map<int, Set<string>> */
  const enumToStringsMap = new Map();
  function addEnumsFromAPI(api) {
    for (const key in api) {
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
  function glEnumToString(value) {
    const matches = enumToStringsMap.get(value);
    return matches
        ? [...matches.keys()].map(v => `${v}`).join(' | ')
        : `/*UNKNOWN WebGL ENUM*/ ${typeof value === 'number' ? `0x${value.toString(16)}` : value}`;
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
  const SAMPLER_2D                    = 0x8B5E;
  const SAMPLER_CUBE                  = 0x8B60;
  const SAMPLER_3D                    = 0x8B5F;
  const SAMPLER_2D_SHADOW             = 0x8B62;
  const FLOAT_MAT2x3                  = 0x8B65;
  const FLOAT_MAT2x4                  = 0x8B66;
  const FLOAT_MAT3x2                  = 0x8B67;
  const FLOAT_MAT3x4                  = 0x8B68;
  const FLOAT_MAT4x2                  = 0x8B69;
  const FLOAT_MAT4x3                  = 0x8B6A;
  const SAMPLER_2D_ARRAY              = 0x8DC1;
  const SAMPLER_2D_ARRAY_SHADOW       = 0x8DC4;
  const SAMPLER_CUBE_SHADOW           = 0x8DC5;
  const UNSIGNED_INT                  = 0x1405;
  const UNSIGNED_INT_VEC2             = 0x8DC6;
  const UNSIGNED_INT_VEC3             = 0x8DC7;
  const UNSIGNED_INT_VEC4             = 0x8DC8;
  const INT_SAMPLER_2D                = 0x8DCA;
  const INT_SAMPLER_3D                = 0x8DCB;
  const INT_SAMPLER_CUBE              = 0x8DCC;
  const INT_SAMPLER_2D_ARRAY          = 0x8DCF;
  const UNSIGNED_INT_SAMPLER_2D       = 0x8DD2;
  const UNSIGNED_INT_SAMPLER_3D       = 0x8DD3;
  const UNSIGNED_INT_SAMPLER_CUBE     = 0x8DD4;
  const UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

  const uniformTypeMap = new Map([
    [FLOAT,                          { size:  1, name: 'float', }],
    [FLOAT_VEC2,                     { size:  2, name: 'vec2', }],
    [FLOAT_VEC3,                     { size:  3, name: 'vec3', }],
    [FLOAT_VEC4,                     { size:  4, name: 'vec4', }],
    [INT,                            { size:  1, name: 'int', }],
    [INT_VEC2,                       { size:  2, name: 'ivec2', }],
    [INT_VEC3,                       { size:  3, name: 'ivec3', }],
    [INT_VEC4,                       { size:  4, name: 'ivec4', }],
    [UNSIGNED_INT,                   { size:  1, name: 'uint', }],
    [UNSIGNED_INT_VEC2,              { size:  2, name: 'uvec2', }],
    [UNSIGNED_INT_VEC3,              { size:  3, name: 'uvec3', }],
    [UNSIGNED_INT_VEC4,              { size:  4, name: 'uvec4', }],
    [BOOL,                           { size:  1, name: 'bool', }],
    [BOOL_VEC2,                      { size:  2, name: 'bvec2', }],
    [BOOL_VEC3,                      { size:  3, name: 'bvec3', }],
    [BOOL_VEC4,                      { size:  4, name: 'bvec4', }],
    [FLOAT_MAT2,                     { size:  4, name: 'mat2', }],
    [FLOAT_MAT3,                     { size:  9, name: 'mat3', }],
    [FLOAT_MAT4,                     { size: 16, name: 'mat4', }],
    [FLOAT_MAT2x3,                   { size:  6, name: 'mat2x3', }],
    [FLOAT_MAT2x4,                   { size:  8, name: 'mat2x4', }],
    [FLOAT_MAT3x2,                   { size:  6, name: 'mat3x2', }],
    [FLOAT_MAT3x4,                   { size: 12, name: 'mat3x4', }],
    [FLOAT_MAT4x2,                   { size:  8, name: 'mat4x2', }],
    [FLOAT_MAT4x3,                   { size: 12, name: 'mat4x3', }],
    [SAMPLER_2D,                     { size:  1, name: 'sampler2D', }],
    [SAMPLER_CUBE,                   { size:  1, name: 'samplerCube', }],
    [SAMPLER_3D,                     { size:  1, name: 'sampler3D', }],
    [SAMPLER_2D_SHADOW,              { size:  1, name: 'sampler2DShadow', }],
    [SAMPLER_2D_ARRAY,               { size:  1, name: 'sampler2DArray', }],
    [SAMPLER_2D_ARRAY_SHADOW,        { size:  1, name: 'sampler2DArrayShadow', }],
    [SAMPLER_CUBE_SHADOW,            { size:  1, name: 'samplerCubeShadow', }],
    [INT_SAMPLER_2D,                 { size:  1, name: 'isampler2D', }],
    [INT_SAMPLER_3D,                 { size:  1, name: 'isampler3D', }],
    [INT_SAMPLER_CUBE,               { size:  1, name: 'isamplerCube', }],
    [INT_SAMPLER_2D_ARRAY,           { size:  1, name: 'isampler2DArray', }],
    [UNSIGNED_INT_SAMPLER_2D,        { size:  1, name: 'usampler2D', }],
    [UNSIGNED_INT_SAMPLER_3D,        { size:  1, name: 'usampler3D', }],
    [UNSIGNED_INT_SAMPLER_CUBE,      { size:  1, name: 'usamplerCube', }],
    [UNSIGNED_INT_SAMPLER_2D_ARRAY,  { size:  1, name: 'usampler2DArray', }],
  ]);

  function getUniformTypeInfo(type) {
    return uniformTypeMap.get(type);
  }

  // ---------------------------------


  const TEXTURE_BINDING_2D            = 0x8069;
  const TEXTURE_BINDING_CUBE_MAP      = 0x8514;
  const TEXTURE_BINDING_3D            = 0x806A;
  const TEXTURE_BINDING_2D_ARRAY      = 0x8C1D;


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

  const bindPointMap = new Map([
    [ARRAY_BUFFER, ARRAY_BUFFER_BINDING],
    [ELEMENT_ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER_BINDING],
    [TEXTURE_2D, TEXTURE_BINDING_2D],
    [TEXTURE_CUBE_MAP, TEXTURE_BINDING_CUBE_MAP],
    [TEXTURE_3D, TEXTURE_BINDING_3D],
    [TEXTURE_2D_ARRAY, TEXTURE_BINDING_2D_ARRAY],
    [RENDERBUFFER, RENDERBUFFER_BINDING],
    [FRAMEBUFFER, FRAMEBUFFER_BINDING],
    [DRAW_FRAMEBUFFER, FRAMEBUFFER_BINDING],
    [READ_FRAMEBUFFER, READ_FRAMEBUFFER_BINDING],
    [UNIFORM_BUFFER, UNIFORM_BUFFER_BINDING],
    [TRANSFORM_FEEDBACK_BUFFER, TRANSFORM_FEEDBACK_BUFFER_BINDING],
    [TRANSFORM_FEEDBACK, TRANSFORM_FEEDBACK_BINDING],
  ]);

  function getBindingQueryEnumForBindPoint(bindPoint) {
    return bindPointMap.get(bindPoint);
  }

  const BYTE                         = 0x1400;
  const SHORT                        = 0x1402;
  const UNSIGNED_BYTE                = 0x1401;
  const UNSIGNED_SHORT               = 0x1403;

  const glTypeToSizeMap = new Map([
    [BOOL           , 1],
    [BYTE           , 1],
    [UNSIGNED_BYTE  , 1],
    [SHORT          , 2],
    [UNSIGNED_SHORT , 2],
    [INT            , 4],
    [UNSIGNED_INT   , 4],
    [FLOAT          , 4],
  ]);

  function getBytesPerValueForGLType(type) {
    return glTypeToSizeMap.get(type) || 0;
  }

  const glTypeToTypedArrayMap = new Map([
    [UNSIGNED_BYTE,  Uint8Array],
    [UNSIGNED_SHORT, Uint16Array],
    [UNSIGNED_INT,   Uint32Array],
  ]);

  function glTypeToTypedArray(type) {
    return glTypeToTypedArrayMap.get(type);
  }

  const drawFuncsToArgs = {
    drawArrays(primType, startOffset, vertCount) {
      return {startOffset, vertCount, instances: 1};
    },
    drawElements(primType, vertCount, indexType, startOffset) {
      return {startOffset, vertCount, instances: 1, indexType};
    },
    drawArraysInstanced(primType, startOffset, vertCount, instances) {
      return {startOffset, vertCount, instances};
      },
    drawElementsInstanced(primType, vertCount, indexType, startOffset, instances) {
      return {startOffset, vertCount, instances, indexType};
      },
    drawArraysInstancedANGLE(primType, startOffset, vertCount, instances) {
      return {startOffset, vertCount, instances};
      },
    drawElementsInstancedANGLE(primType, vertCount, indexType, startOffset, instances) {
      return {startOffset, vertCount, instances, indexType};
      },
    drawRangeElements(primType, start, end, vertCount, indexType, startOffset) {
      return {startOffset, vertCount, instances: 1, indexType};
      },
  };

  function getDrawFunctionArgs(funcName, args) {
    return drawFuncsToArgs[funcName](...args);
  }

  function isDrawFunction(funcName) {
    return !!drawFuncsToArgs[funcName];
  }

  const attrTypeMap = new Map([
    [FLOAT,              { size:  4, }],
    [FLOAT_VEC2,         { size:  8, }],
    [FLOAT_VEC3,         { size: 12, }],
    [FLOAT_VEC4,         { size: 16, }],
    [INT,                { size:  4, }],
    [INT_VEC2,           { size:  8, }],
    [INT_VEC3,           { size: 12, }],
    [INT_VEC4,           { size: 16, }],
    [UNSIGNED_INT,       { size:  4, }],
    [UNSIGNED_INT_VEC2,  { size:  8, }],
    [UNSIGNED_INT_VEC3,  { size: 12, }],
    [UNSIGNED_INT_VEC4,  { size: 16, }],
    [BOOL,               { size:  4, }],
    [BOOL_VEC2,          { size:  8, }],
    [BOOL_VEC3,          { size: 12, }],
    [BOOL_VEC4,          { size: 16, }],
    [FLOAT_MAT2,         { size:  4, count: 2, }],
    [FLOAT_MAT3,         { size:  9, count: 3, }],
    [FLOAT_MAT4,         { size: 16, count: 4, }],
  ]);

  function getAttributeTypeInfo(type) {
    return attrTypeMap.get(type);
  }

  const VERTEX_ATTRIB_ARRAY_DIVISOR = 0x88FE;

  function computeLastUseIndexForDrawArrays(startOffset, vertCount/*, instances, errors*/) {
    return startOffset + vertCount - 1;
  }

  function getLastUsedIndexForDrawElements(gl, funcName, startOffset, vertCount, instances, indexType, getWebGLObjectString, getIndicesForBuffer, errors) {
    const elementBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
    if (!elementBuffer) {
      errors.push('No ELEMENT_ARRAY_BUFFER bound');
      return undefined;
    }
    const bytesPerIndex = getBytesPerValueForGLType(indexType);
    const bufferSize = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE);
    const sizeNeeded = startOffset + vertCount * bytesPerIndex;
    if (sizeNeeded > bufferSize) {
      errors.push(`offset: ${startOffset} and count: ${vertCount} with index type: ${glEnumToString(indexType)} passed to ${funcName} are out of range for current ELEMENT_ARRAY_BUFFER.
Those parameters require ${sizeNeeded} bytes but the current ELEMENT_ARRAY_BUFFER ${getWebGLObjectString(elementBuffer)} only has ${bufferSize} bytes`);
      return undefined;
    }
    const buffer = getIndicesForBuffer(elementBuffer);
    const Type = glTypeToTypedArray(indexType);
    const view = new Type(buffer, startOffset);
    let maxIndex = view[0];
    for (let i = 1; i < vertCount; ++i) {
      maxIndex = Math.max(maxIndex, view[i]);
    }
    return maxIndex;
  }


  function checkAttributesForBufferOverflow(gl, funcName, args, getWebGLObjectString, getIndicesForBuffer) {
    const {vertCount, startOffset, indexType, instances} = getDrawFunctionArgs(funcName, args);
    if (vertCount <= 0 || instances <= 0) {
      return [];
    }
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    const errors = [];
    const nonInstancedLastIndex = indexType
        ? getLastUsedIndexForDrawElements(gl, funcName, startOffset, vertCount, instances, indexType, getWebGLObjectString, getIndicesForBuffer, errors)
        : computeLastUseIndexForDrawArrays(startOffset, vertCount);
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
      const {count} = {count: 1, ...getAttributeTypeInfo(type)};
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
attribute size: ${numComponents}, type: ${glEnumToString(type)}, stride: ${specifiedStride}, offset: ${offset}, divisor: ${divisor}
needs ${sizeNeeded} bytes for draw but buffer is only ${bufferSize} bytes`);
        }
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, oldArrayBuffer);
    return errors;
  }

  const SAMPLER_2D$1                    = 0x8B5E;
  const SAMPLER_CUBE$1                  = 0x8B60;
  const SAMPLER_3D$1                    = 0x8B5F;
  const SAMPLER_2D_SHADOW$1             = 0x8B62;
  const SAMPLER_2D_ARRAY$1              = 0x8DC1;
  const SAMPLER_2D_ARRAY_SHADOW$1       = 0x8DC4;
  const SAMPLER_CUBE_SHADOW$1           = 0x8DC5;
  const INT_SAMPLER_2D$1                = 0x8DCA;
  const INT_SAMPLER_3D$1                = 0x8DCB;
  const INT_SAMPLER_CUBE$1              = 0x8DCC;
  const INT_SAMPLER_2D_ARRAY$1          = 0x8DCF;
  const UNSIGNED_INT_SAMPLER_2D$1       = 0x8DD2;
  const UNSIGNED_INT_SAMPLER_3D$1       = 0x8DD3;
  const UNSIGNED_INT_SAMPLER_CUBE$1     = 0x8DD4;
  const UNSIGNED_INT_SAMPLER_2D_ARRAY$1 = 0x8DD7;

  const samplerTypes = new Map([
    [SAMPLER_2D$1,                    {bindPoint: '2D'}],
    [SAMPLER_CUBE$1,                  {bindPoint: 'CUBE'}],
    [SAMPLER_3D$1,                    {bindPoint: '3D'}],
    [SAMPLER_2D_SHADOW$1,             {bindPoint: '2D'}],
    [SAMPLER_2D_ARRAY$1,              {bindPoint: '2D_ARRAY'}],
    [SAMPLER_2D_ARRAY_SHADOW$1,       {bindPoint: '2D_ARRAY'}],
    [SAMPLER_CUBE_SHADOW$1,           {bindPoint: 'CUBE'}],
    [INT_SAMPLER_2D$1,                {bindPoint: '2D'}],
    [INT_SAMPLER_3D$1,                {bindPoint: '3D'}],
    [INT_SAMPLER_CUBE$1,              {bindPoint: 'CUBE'}],
    [INT_SAMPLER_2D_ARRAY$1,          {bindPoint: '2D_ARRAY'}],
    [UNSIGNED_INT_SAMPLER_2D$1,       {bindPoint: '2D'}],
    [UNSIGNED_INT_SAMPLER_3D$1,       {bindPoint: '3D'}],
    [UNSIGNED_INT_SAMPLER_CUBE$1,     {bindPoint: 'CUBE'}],
    [UNSIGNED_INT_SAMPLER_2D_ARRAY$1, {bindPoint: '2D_ARRAY'}],
  ]);

  function getBindPointForSampler(type) {
    return samplerTypes.get(type);
  }

  function uniformTypeIsSampler(type) {
    return samplerTypes.has(type);
  }

  const TEXTURE_2D$1                     = 0x0DE1;
  const TEXTURE_3D$1                     = 0x806F;
  const TEXTURE_2D_ARRAY$1               = 0x8C1A;
  const TEXTURE_CUBE_MAP$1               = 0x8513;
  const TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
  const TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
  const TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
  const TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
  const TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
  const TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;

  const targetToBindPointMap = new Map([
    [TEXTURE_2D$1, '2D'],
    [TEXTURE_3D$1, '3D'],
    [TEXTURE_CUBE_MAP$1, 'CUBE'],
    [TEXTURE_CUBE_MAP_POSITIVE_X, 'CUBE'],
    [TEXTURE_CUBE_MAP_NEGATIVE_X, 'CUBE'],
    [TEXTURE_CUBE_MAP_POSITIVE_Y, 'CUBE'],
    [TEXTURE_CUBE_MAP_NEGATIVE_Y, 'CUBE'],
    [TEXTURE_CUBE_MAP_POSITIVE_Z, 'CUBE'],
    [TEXTURE_CUBE_MAP_NEGATIVE_Z, 'CUBE'],
    [TEXTURE_2D_ARRAY$1, '2D_ARRAY'],
  ]);

  function getBindPointForTarget(target) {
    return targetToBindPointMap.get(target);
  }

  const TEXTURE_BINDING_2D$1            = 0x8069;
  const TEXTURE_BINDING_CUBE_MAP$1      = 0x8514;
  const TEXTURE_BINDING_3D$1            = 0x806A;
  const TEXTURE_BINDING_2D_ARRAY$1      = 0x8C1D;

  const samplerTypeToBinding = new Map([
    [SAMPLER_2D$1, TEXTURE_BINDING_2D$1],
    [SAMPLER_2D_SHADOW$1, TEXTURE_BINDING_2D$1],
    [SAMPLER_3D$1, TEXTURE_BINDING_3D$1],
    [SAMPLER_2D_ARRAY$1, TEXTURE_BINDING_2D_ARRAY$1],
    [SAMPLER_2D_ARRAY_SHADOW$1, TEXTURE_BINDING_2D_ARRAY$1],
    [SAMPLER_CUBE$1, TEXTURE_BINDING_CUBE_MAP$1],
    [SAMPLER_CUBE_SHADOW$1, TEXTURE_BINDING_CUBE_MAP$1],
  ]);

  function getTextureForUnit(gl, unit, type) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    const binding = samplerTypeToBinding.get(type);
    return gl.getParameter(binding);
  }

  /* global WebGLTexture */

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
  function checkFramebufferFeedback(gl, getWebGLObjectString) {
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
       ? [`${getWebGLObjectString(texture)} on uniform: ${uniformName} bound to texture unit ${textureUnit} is also attached to ${getWebGLObjectString(framebuffer)} on attachment: ${attachments.map(a => glEnumToString(a)).join(', ')}`]
       : [];
  }

  /* global navigator */

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

  function createTextureUnits(gl) {
    const textureUnits = [];
    const numUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    for (let i = 0; i < numUnits; ++i) {
      textureUnits.push(new Map());
    }
    return textureUnits;
  }

  const TEXTURE0                       = 0x84C0;
  const TEXTURE_2D$2                     = 0x0DE1;
  const TEXTURE_3D$2                     = 0x806F;
  const TEXTURE_CUBE_MAP$2               = 0x8513;
  const TEXTURE_CUBE_MAP_POSITIVE_X$1    = 0x8515;
  const TEXTURE_CUBE_MAP_NEGATIVE_X$1    = 0x8516;
  const TEXTURE_CUBE_MAP_POSITIVE_Y$1    = 0x8517;
  const TEXTURE_CUBE_MAP_NEGATIVE_Y$1    = 0x8518;
  const TEXTURE_CUBE_MAP_POSITIVE_Z$1    = 0x8519;
  const TEXTURE_CUBE_MAP_NEGATIVE_Z$1    = 0x851A;
  const TEXTURE_MIN_FILTER             = 0x2801;
  const TEXTURE_MAG_FILTER             = 0x2800;
  const TEXTURE_WRAP_S                 = 0x2802;
  const TEXTURE_WRAP_T                 = 0x2803;
  const REPEAT                         = 0x2901;
  const TEXTURE_2D_ARRAY$2               = 0x8C1A;
  const CLAMP_TO_EDGE                  = 0x812F;
  const NEAREST                        = 0x2600;
  const LINEAR                         = 0x2601;
  const NEAREST_MIPMAP_LINEAR          = 0x2702;

  const texImage2DArgParersMap = new Map([
    [9, function([target, level, internalFormat, width, height, , format, type]) {
      return {target, level, internalFormat, width, height, format, type};
    }, ],
    [6, function([target, level, internalFormat, format, type, texImageSource]) {
      return {target, level, internalFormat, width: texImageSource.width, height: texImageSource.height, format, type};
    }, ],
    [10, function([target, level, internalFormat, width, height, , format, type]) {
      return {target, level, internalFormat, width, height, format, type};
    }, ],
  ]);

  const ALPHA                          = 0x1906;
  const RGB                            = 0x1907;
  const RGBA                           = 0x1908;
  const LUMINANCE                      = 0x1909;
  const LUMINANCE_ALPHA                = 0x190A;

  const unsizedInternalFormats = new Set([
    ALPHA,
    LUMINANCE,
    LUMINANCE_ALPHA,
    RGB,
    RGBA,
  ]);

  const targetToFaceIndex = new Map([
    [TEXTURE_2D$2, 0],
    [TEXTURE_3D$2, 0],
    [TEXTURE_2D_ARRAY$2, 0],
    [TEXTURE_CUBE_MAP$2, 0],
    [TEXTURE_CUBE_MAP_POSITIVE_X$1, 0],
    [TEXTURE_CUBE_MAP_NEGATIVE_X$1, 1],
    [TEXTURE_CUBE_MAP_POSITIVE_Y$1, 2],
    [TEXTURE_CUBE_MAP_NEGATIVE_Y$1, 3],
    [TEXTURE_CUBE_MAP_POSITIVE_Z$1, 4],
    [TEXTURE_CUBE_MAP_NEGATIVE_Z$1, 5],
  ]);

  function getFaceTarget(face, type) {
    if (type === TEXTURE_CUBE_MAP$2) {
      return `(${glEnumToString(TEXTURE_CUBE_MAP_POSITIVE_X$1 + face)})`;
    } else {
      return '';
    }
  }

  /*
  const targetToBindPointMap = new Map([
    [TEXTURE_2D, TEXTURE_2D],
    [TEXTURE_3D, TEXTURE_3D],
    [TEXTURE_2D_ARRAY, TEXTURE_2D_ARRAY],
    [TEXTURE_CUBE_MAP_POSITIVE_X, TEXTURE_CUBE_MAP],
    [TEXTURE_CUBE_MAP_NEGATIVE_X, TEXTURE_CUBE_MAP],
    [TEXTURE_CUBE_MAP_POSITIVE_Y, TEXTURE_CUBE_MAP],
    [TEXTURE_CUBE_MAP_NEGATIVE_Y, TEXTURE_CUBE_MAP],
    [TEXTURE_CUBE_MAP_POSITIVE_Z, TEXTURE_CUBE_MAP],
    [TEXTURE_CUBE_MAP_NEGATIVE_Z, TEXTURE_CUBE_MAP],
  ]);
  */

  function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

  function computeNumMipsNeeded(width, height, depth) {
    return (Math.log2(Math.max(width, height, depth)) | 0) + 1;
  }

  function insertIf(condition, ...elements) {
    return condition ? elements : [];
  }

  function getNPotIssues(width, height) {
    return [
      ...insertIf(!isPowerOf2(width), `width(${width}) is not a power of 2`),
      ...insertIf(!isPowerOf2(height), `height(${height}) is not a power of 2`),
    ].join(' and ');
  }

  function getClampToEdgeIssues(wrapS, wrapT) {
    return [
      ...insertIf(wrapS !== CLAMP_TO_EDGE, `TEXTURE_WRAP_S (${glEnumToString(wrapS)}) is not CLAMP_TO_EDGE`),
      ...insertIf(wrapT !== CLAMP_TO_EDGE, `TEXTURE_WRAP_T (${glEnumToString(wrapT)}) is not CLAMP_TO_EDGE`),
    ].join(' and ');
  }

  class TextureManager {
    constructor(gl) {
      const needPOT = !isWebGL2(gl);
      const textureToTextureInfoMap = new Map();
      const textureUnits = createTextureUnits(gl);
      let activeTextureUnitIndex = 0;
      let activeTextureUnit = textureUnits[0];
      this.numTextureUnits = textureUnits.length;

      function recomputeRenderability(textureInfo) {
        const {type, mips, parameters} = textureInfo;
        const level0Faces = mips[0];
        textureInfo.notRenderable = undefined;
        if (!level0Faces) {
          textureInfo.notRenderable = 'no mip level 0';
          return;
        }
        const mipFace0 = level0Faces[0];
        if (!mipFace0) {
          textureInfo.notRenderable = 'TEXTURE_CUBE_MAP_POSITIVE_X face does not exist';
          return;
        }
        const {width: level0Width, height: level0Height, depth: level0Depth, internalFormatString: level0InternalFormatString} = mipFace0;
        const numFaces = type === TEXTURE_CUBE_MAP$2 ? 6 : 1;
        const minFilter = parameters.get(TEXTURE_MIN_FILTER);
        const numMipsNeeded = (minFilter === LINEAR || minFilter === NEAREST)
           ? 1
           : computeNumMipsNeeded(level0Width, level0Height, level0Depth);

        {
          let mipWidth = level0Width;
          let mipHeight = level0Height;
          let mipDepth = level0Depth;
          for (let mipLevel = 0; mipLevel < numMipsNeeded; ++mipLevel) {
            const faceMips = mips[mipLevel];
            if (!faceMips) {
              textureInfo.notRenderable = `filtering is set to use mips (TEXTURE_MIN_FILTER = ${glEnumToString(minFilter)}) but mip level ${mipLevel} does not exist`;
              return;
            }
            for (let face = 0; face < numFaces; ++face) {
              const mip = faceMips[face];
              if (!mip) {
                textureInfo.notRenderable = `filtering is set to use mips (TEXTURE_MIN_FILTER = ${glEnumToString(minFilter)}) but mip level ${mipLevel}${getFaceTarget(face, type)} does not exist`;
                return;
              }
              if (mip.width !== mipWidth ||
                  mip.height !== mipHeight ||
                  mip.depth !== mipDepth) {
                textureInfo.notRenderable = `mip level ${mipLevel}${getFaceTarget(face, type)} needs to be ${mipWidth}x${mipHeight}x${mipDepth} but it is ${mip.width}x${mip.height}x${mip.depth}`;
                return;
              }
              if (mip.internalFormatString !== level0InternalFormatString) {
                textureInfo.notRenderable = `mip level ${mipLevel}${getFaceTarget(face, type)}'s internal format ${mip.internalFormatString} does not match mip level 0's internal format ${level0InternalFormatString}`;
              }
            }
            mipWidth = Math.max(1, mipWidth / 2 | 0);
            mipHeight = Math.max(1, mipHeight / 2 | 0);
            if (type !== TEXTURE_2D_ARRAY$2) {
              mipDepth = Math.max(1, mipDepth / 2 | 0);
            }
          }
        }

        if (needPOT) {
          if (!isPowerOf2(level0Width) || !isPowerOf2(level0Height)) {
            if (numMipsNeeded > 1) {
              textureInfo.notRenderable = `texture's ${getNPotIssues(level0Width, level0Height)} but TEXTURE_MIN_FILTER (${glEnumToString(minFilter)}) is set to need mips`;
              return;
            }
            const wrapS = parameters.get(TEXTURE_WRAP_S);
            const wrapT = parameters.get(TEXTURE_WRAP_T);
            if (wrapS !== CLAMP_TO_EDGE || wrapT !== CLAMP_TO_EDGE) {
              textureInfo.notRenderable = `texture's ${getNPotIssues(level0Width, level0Height)} but ${getClampToEdgeIssues(wrapS, wrapT)}.`;
              return;
            }
          }
        }

        if (type === TEXTURE_CUBE_MAP$2) {
          if (level0Width !== level0Height) {
            textureInfo.notRenderable = `texture is CUBE_MAP but dimensions ${level0Width}x${level0Height} are not square`;
            return;
          }
        }
      }

      function getTextureInfoForTarget(target) {
        const bindPoint = getBindPointForTarget(target);
        const texture = activeTextureUnit.get(bindPoint);
        return textureToTextureInfoMap.get(texture);
      }

      function getMipInfoForTarget(target, level) {
        const textureInfo = getTextureInfoForTarget(target);
        const faceIndex = targetToFaceIndex.get(target);
        return textureInfo.mips[level][faceIndex];
      }

      function setTexParameterForTarget(target, pname, value) {
        const textureInfo = getTextureInfoForTarget(target);
        textureInfo.parameters.set(pname, value);
        recomputeRenderability(textureInfo);
      }

      this.getTextureForTextureUnit = function(texUnit, target) {

        return textureUnits[texUnit].get(target);
      };

      this.getTextureUnitUnrenderableReason = function(texUnit, target) {
        const texture = textureUnits[texUnit].get(target);
        if (!texture) {
          return `no texture bound to texture unit ${texUnit} ${target}`;
        }
        const textureInfo = textureToTextureInfoMap.get(texture);
        return textureInfo.notRenderable;
      };

      function setMipFaceInfoForTarget(target, level, internalFormat, width, height, depth, type = 0) {
        const internalFormatString = unsizedInternalFormats.has(internalFormat)
           ? `${glEnumToString(internalFormat)}/${glEnumToString(type)}`
           : glEnumToString(internalFormat);
        const textureInfo = getTextureInfoForTarget(target);
        const {mips} = textureInfo;
        if (!mips[level]) {
          mips[level] = [];
        }
        const faceIndex = targetToFaceIndex.get(target);
        mips[level][faceIndex] = {width, height, depth, internalFormatString, internalFormat, type};
        recomputeRenderability(textureInfo);
      }

      this.postChecks = {
        activeTexture(ctx, funcName, args) {
          const unit = args[0] - TEXTURE0;
          activeTextureUnitIndex = unit;
          activeTextureUnit = textureUnits[activeTextureUnitIndex];
        },

        bindTexture(ctx, funcName, args) {
          const [target, texture] = args;
          activeTextureUnit.set(getBindPointForTarget(target), texture);
          if (texture) {
            const textureInfo = textureToTextureInfoMap.get(texture);
            if (textureInfo.type) {
              if (textureInfo.type !== target) {
                throw new Error('should never get here');
              }
            } else {
              textureInfo.type = target;
            }
          }
        },

        createTexture(ctx, funcName, args, result) {
          // class TextureInfo {
          //   mips: Array<Array<MipInfo>>  // indexed by face index
          //   parameters: Map<number, number>
          //   renderable: bool,
          //   target: type of texture (ie, TEXTURE_2D)
          // }
          const textureInfo = {
            mips: [],
            parameters: new Map([
              [TEXTURE_MIN_FILTER, NEAREST_MIPMAP_LINEAR],
              [TEXTURE_MAG_FILTER, LINEAR],
              [TEXTURE_WRAP_S, REPEAT],
              [TEXTURE_WRAP_T, REPEAT],
            ]),
            renderable: false,
          };
          textureToTextureInfoMap.set(result, textureInfo);
        },

        copyTexImage2D(ctx, funcName, args) {
          const [target, level, internalFormat, width, height] = args;
          // TODO: In order to know the type do we need to know the
          // format of the current framebuffer for when internalFormat is unsized?
          const type = ctx.UNSIGNED_BYTE;
          setMipFaceInfoForTarget(target, level, internalFormat, width, height, 1, type);
        },

        texImage2D(ctx, funcName, args) {
          const parseFunc = texImage2DArgParersMap.get(args.length);
          const {target, level, internalFormat, width, height, type} = parseFunc(args);
          setMipFaceInfoForTarget(target, level, internalFormat, width, height, 1, type);
        },

        texImage3D(ctx, funcName, args) {
          const [target, level, internalFormat, width, height, depth, , , type] = args;
          setMipFaceInfoForTarget(target, level, internalFormat, width, height, depth, type);
        },

        texStorage2D(ctx, funcName, args) {
          const [target, levels, internalFormat, width, height] = args;
          let w = width;
          let h = height;
          for (let level = 0; level < levels; ++level) {
            setMipFaceInfoForTarget(target, level, internalFormat, w, h, 1);
            w = Math.max(1, (w / 2) | 0);
            h = Math.max(1, (h / 2) | 0);
          }
        },

        texStorage3D(ctx, funcName, args) {
          const [target, levels, internalFormat, width, height, depth] = args;
          let w = width;
          let h = height;
          let d = depth;
          for (let level = 0; level < levels; ++level) {
            setMipFaceInfoForTarget(target, level, internalFormat, w, h, d);
            w = Math.max(1, (w / 2) | 0);
            h = Math.max(1, (h / 2) | 0);
            // If it's not TEXTURE_2D it's TEXTURE_2D_ARRAY
            if (target === TEXTURE_3D$2) {
              d = Math.max(1, (d / 2) | 0);
            }
          }
        },

        generateMipmap(ctx, funcName, args) {
          const [target] = args;
          const {width, height, depth, internalFormat, type} = getMipInfoForTarget(target, 0);
          const numMipsNeeded = computeNumMipsNeeded(width, height, depth);
          const numFaces = target === TEXTURE_CUBE_MAP$2 ? 6 : 1;
          let w = width;
          let h = height;
          let d = depth;
          for (let level = 0; level < numMipsNeeded; ++level) {
            w = Math.max(1, (w / 2) | 0);
            h = Math.max(1, (h / 2) | 0);
            // If it's not TEXTURE_2D it's TEXTURE_2D_ARRAY
            if (target === TEXTURE_3D$2) {
              d = Math.max(1, (d / 2) | 0);
            }
            for (let face = 0; face < numFaces; ++face) {
              const faceTarget =  target === TEXTURE_CUBE_MAP$2
                 ? TEXTURE_CUBE_MAP_POSITIVE_X$1 + face
                 : target;
              setMipFaceInfoForTarget(faceTarget, level, internalFormat, w, h, d, type);
            }
          }
        },

        compressedTexImage2D(ctx, funcName, args) {
          const [target, level, internalFormat, width, height] = args;
          setMipFaceInfoForTarget(target, level, internalFormat, width, height, 1);
        },

        compressedTexImage3D(ctx, funcName, args) {
          const [target, level, internalFormat, width, height, depth] = args;
          setMipFaceInfoForTarget(target, level, internalFormat, width, height, depth);
        },

        texParameteri(ctx, funcName, args) {
          const [target, pname, value] = args;
          setTexParameterForTarget(target, pname, value);
        },
      };
    }
  }

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

  /* global console */
  /* global WebGL2RenderingContext */
  /* global WebGLUniformLocation */

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


  const destBufferBitFieldToString = makeBitFieldToStringFunc([
    'COLOR_BUFFER_BIT',
    'DEPTH_BUFFER_BIT',
    'STENCIL_BUFFER_BIT',
  ]);

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
        msgs.push(`on WebGLProgram(${quotedStringOrEmpty(name)})`);
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
  function augmentAPI(ctx, nameOfClass, options = {}) {
    const origGLErrorFn = options.origGLErrorFn || ctx.getError;

    function createSharedState(ctx) {
      const sharedState = {
        baseContext: ctx,
        config: options,
        apis: {
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
              disable() {
                removeChecks();
              },
              setConfiguration(config) {
                for (const [key, value] of Object.entries(config)) {
                  if (!(key in sharedState.config)) {
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
        textureManager: new TextureManager(ctx),
        bufferToIndices: new Map(),
        ignoredUniforms: new Set(),
        // Okay or bad? This is a map of all WebGLUniformLocation object looked up
        // by the user via getUniformLocation. We use this to map a location back to
        // a name and unfortunately a WebGLUniformLocation is not unique, by which
        // I mean if you call get getUniformLocation twice for the same uniform you'll
        // get 2 different WebGLUniformLocation objects referring to the same location.
        //
        // So, that means I can't look up the locations myself and know what they are
        // unless I passed the location objects I looked up back to the user but if I
        // did that then technically I'd have changed the semantics (though I suspect
        // no one ever takes advantage of that quirk)
        //
        // In any case this is all uniforms for all programs. That means in order
        // to clean up later I have to track all the uniforms (see programToUniformMap)
        // so that makes me wonder if I should track names per program instead.
        //
        // The advantage to this global list is given a WebGLUniformLocation and
        // no other info I can lookup the name where as if I switch it to per-program
        // then I need to know the program. That's generally available but it's indirect.
        locationsToNamesMap: new Map(),
        webglObjectToNamesMap: new Map(),
        // @typedef {Object} UnusedUniformRef
        // @property {number} index the index of this name. for foo[3] it's 3
        // @property {Map<string, number>} altNames example <foo,0>, <foo[0],0>, <foo[1],1>, <foo[2],2>, <foo[3],3>  for `uniform vec4 foo[3]`
        // @property {Set<number>} unused this is size so for the example above it's `Set<[0, 1, 2, 3]`

        // Both the altName array and the unused Set are shared with an entry in `programToUnsetUniformsMap`
        // by each name (foo, foo[0], foo[1], foo[2]). That we we can unused.delete each element of set
        // and if set is empty then delete all altNames entries from programToUnsetUniformsMap.
        // When programsToUniformsMap is empty all uniforms have been set.
        // @typedef {Map<WebGLProgram, Map<string, UnusedUniformRef>}
        programToUnsetUniformsMap: new Map(),
        // class UniformInfo {
        //   index: the index of this name. for foo[3] it's 3
        //   size: this is the array size for this uniform
        //   type: the enum for the type like FLOAT_VEC4
        // }
        /** @type {WebGLProgram, Map<UniformInfo>} */
        programToUniformInfoMap: new Map(),
        /** @type {WebGLProgram, Set<WebGLUniformLocation>} */
        programToLocationsMap: new Map(),
        // class UniformSamplerInfo {
        //   type: the enum for the uniform type like SAMPLER_2D
        //   values: number[],
        //   name: string
        // }
        /** @type {WebGLProgram, UniformSamplerInfo[]} */
        programToUniformSamplerValues: new Map(),
      };
      return sharedState;
    }

    const sharedState = options.sharedState || createSharedState(ctx);
    options.sharedState = sharedState;
    addEnumsFromAPI(ctx);
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
        9: { enums: [0, 2, 6, 7], numbers: [1, 3, 4, 5], arrays: [-8], },
        6: { enums: [0, 2, 3, 4], },
        10: { enums: [0, 2, 6, 7], numbers: [1, 3, 4, 5, 9], arrays: {8: checkOptionalTypedArrayWithOffset }, }, // WebGL2
      },
      'texImage3D': {
        10: { enums: [0, 2, 7, 8], numbers: [1, 3, 4, 5] },  // WebGL2
        11: { enums: [0, 2, 7, 8], numbers: [1, 3, 4, 5, 10], arrays: {9: checkTypedArrayWithOffset}},  // WebGL2
      },
      'texSubImage2D': {
        9: { enums: [0, 6, 7], numbers: [1, 2, 3, 4, 5] },
        7: { enums: [0, 4, 5], numbers: [1, 2, 3] },
        10: { enums: [0, 6, 7], numbers: [1, 2, 3, 4, 5, 9], arrays: {9: checkTypedArrayWithOffset} },  // WebGL2
      },
      'texSubImage3D': {
        11: { enums: [0, 8, 9], numbers: [1, 2, 3, 4, 5, 6, 7] },  // WebGL2
        12: { enums: [0, 8, 9], numbers: [1, 2, 3, 4, 5, 6, 7, 11], arrays: {10: checkTypedArrayWithOffset} },  // WebGL2
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
        9: { enums: [0, 2], numbers: [1, 3, 4, 5, 7, 8] },  // WebGL2
      },
      'compressedTexSubImage2D': {
        8: { enums: [0, 6], numbers: [1, 2, 3, 4, 5] },
        9: { enums: [0, 6], numbers: [1, 2, 3, 4, 5, 8] },  // WebGL2
        10: { enums: [0, 6], numbers: [1, 2, 3, 4, 5, 8, 9] },  // WebGL2
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
        4: { enums: [0, 2], numbers: [-1, 3], arrays: { 1: checkBufferSourceWithOffset } },  // WebGL2
        5: { enums: [0, 2], numbers: [-1, 3, 4], arrays: { 1: checkBufferSourceWithOffsetAndLength } },  // WebGL2
      },
      'bufferSubData': {
        3: { enums: [0], numbers: [1], arrays: [2] },
        4: { enums: [0], numbers: [1, 3], arrays: {2: checkBufferSourceWithOffset} },  // WebGL2
        5: { enums: [0], numbers: [1, 3, 4], arrays: {2: checkBufferSourceWithOffsetAndLength} },  // WebGL2
      },
      'copyBufferSubData': {
        5: { enums: [0], numbers: [2, 3, 4] },  // WebGL2
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
        2: {arrays: {1: checkArrayForUniform(1)}},
        3: {arrays: {1: checkArrayForUniformWithOffset(1)}, numbers: [2]},
        4: {arrays: {1: checkArrayForUniformWithOffsetAndLength(1)}, numbers: [2, 3]},
      },
      'uniform2fv': {
        2: {arrays: {1: checkArrayForUniform(2)}},
        3: {arrays: {1: checkArrayForUniformWithOffset(2)}, numbers: [2]},
        4: {arrays: {1: checkArrayForUniformWithOffsetAndLength(2)}, numbers: [2, 3]},
      },
      'uniform3fv': {
        2: {arrays: {1: checkArrayForUniform(3)}},
        3: {arrays: {1: checkArrayForUniformWithOffset(3)}, numbers: [2]},
        4: {arrays: {1: checkArrayForUniformWithOffsetAndLength(3)}, numbers: [2, 3]},
      },
      'uniform4fv': {
        2: {arrays: {1: checkArrayForUniform(4)}},
        3: {arrays: {1: checkArrayForUniformWithOffset(4)}, numbers: [2]},
        4: {arrays: {1: checkArrayForUniformWithOffsetAndLength(4)}, numbers: [2, 3]},
      },

      'uniform1iv': {
        2: {arrays: {1: checkArrayForUniform(1)}},
        3: {arrays: {1: checkArrayForUniformWithOffset(1)}, numbers: [2]},
        4: {arrays: {1: checkArrayForUniformWithOffsetAndLength(1)}, numbers: [2, 3]},
      },
      'uniform2iv': {
        2: {arrays: {1: checkArrayForUniform(2)}},
        3: {arrays: {1: checkArrayForUniformWithOffset(2)}, numbers: [2]},
        4: {arrays: {1: checkArrayForUniformWithOffsetAndLength(2)}, numbers: [2, 3]},
      },
      'uniform3iv': {
        2: {arrays: {1: checkArrayForUniform(3)}},
        3: {arrays: {1: checkArrayForUniformWithOffset(3)}, numbers: [2]},
        4: {arrays: {1: checkArrayForUniformWithOffsetAndLength(3)}, numbers: [2, 3]},
      },
      'uniform4iv': {
        2: {arrays: {1: checkArrayForUniform(4)}},
        3: {arrays: {1: checkArrayForUniformWithOffset(4)}, numbers: [2]},
        4: {arrays: {1: checkArrayForUniformWithOffsetAndLength(4)}, numbers: [2, 3]},
      },

      'uniformMatrix2fv': {
        3: {arrays: {2: checkArrayForUniform(4)}},
        4: {arrays: {2: checkArrayForUniformWithOffset(4)}, numbers: [3]},
        5: {arrays: {2: checkArrayForUniformWithOffsetAndLength(4)}, numbers: [3, 4]},
      },
      'uniformMatrix3fv': {
        3: {arrays: {2: checkArrayForUniform(9)}},
        4: {arrays: {2: checkArrayForUniformWithOffset(9)}, numbers: [3]},
        5: {arrays: {2: checkArrayForUniformWithOffsetAndLength(9)}, numbers: [3, 4]},
      },
      'uniformMatrix4fv': {
        3: {arrays: {2: checkArrayForUniform(16)}},
        4: {arrays: {2: checkArrayForUniformWithOffset(16)}, numbers: [3]},
        5: {arrays: {2: checkArrayForUniformWithOffsetAndLength(16)}, numbers: [3, 4]},
      },

      'uniform1ui': { 2: {numbers: [1]} },  // WebGL2
      'uniform2ui': { 3: {numbers: [1, 2]} },  // WebGL2
      'uniform3ui': { 4: {numbers: [1, 2, 3]} },  // WebGL2
      'uniform4ui': { 5: {numbers: [1, 2, 3, 4]} },  // WebGL2

      'uniform1uiv': {  // WebGL2
        2: { arrays: {1: checkArrayForUniform(1)}, },
        3: { arrays: {1: checkArrayForUniformWithOffset(1)}, numbers: [2] },
        4: { arrays: {1: checkArrayForUniformWithOffsetAndLength(1)}, numbers: [2, 3] },
      },
      'uniform2uiv': {  // WebGL2
        2: { arrays: {1: checkArrayForUniform(2)}, },
        3: { arrays: {1: checkArrayForUniformWithOffset(2)}, numbers: [2] },
        4: { arrays: {1: checkArrayForUniformWithOffsetAndLength(2)}, numbers: [2, 3] },
      },
      'uniform3uiv': {  // WebGL2
        2: { arrays: {1: checkArrayForUniform(3)}, },
        3: { arrays: {1: checkArrayForUniformWithOffset(3)}, numbers: [2] },
        4: { arrays: {1: checkArrayForUniformWithOffsetAndLength(3)}, numbers: [2, 3] },
      },
      'uniform4uiv': {  // WebGL2
        2: { arrays: {1: checkArrayForUniform(4)}, },
        3: { arrays: {1: checkArrayForUniformWithOffset(4)}, numbers: [2] },
        4: { arrays: {1: checkArrayForUniformWithOffsetAndLength(4)}, numbers: [2, 3] },
      },
      'uniformMatrix3x2fv': {  // WebGL2
        3: { arrays: {2: checkArrayForUniform(6)}, },
        4: { arrays: {2: checkArrayForUniformWithOffset(6)}, numbers: [3] },
        5: { arrays: {2: checkArrayForUniformWithOffsetAndLength(6)}, numbers: [3, 4] },
      },
      'uniformMatrix4x2fv': {  // WebGL2
        3: { arrays: {2: checkArrayForUniform(8)}, },
        4: { arrays: {2: checkArrayForUniformWithOffset(8)}, numbers: [3] },
        5: { arrays: {2: checkArrayForUniformWithOffsetAndLength(8)}, numbers: [3, 4] },
      },

      'uniformMatrix2x3fv': {  // WebGL2
        3: { arrays: {2: checkArrayForUniform(6)}, },
        4: { arrays: {2: checkArrayForUniformWithOffset(6)}, numbers: [3] },
        5: { arrays: {2: checkArrayForUniformWithOffsetAndLength(6)}, numbers: [3, 4] },
      },
      'uniformMatrix4x3fv': {  // WebGL2
        3: { arrays: {2: checkArrayForUniform(12)}, },
        4: { arrays: {2: checkArrayForUniformWithOffset(12)}, numbers: [3] },
        5: { arrays: {2: checkArrayForUniformWithOffsetAndLength(12)}, numbers: [3, 4] },
      },

      'uniformMatrix2x4fv': {  // WebGL2
        3: { arrays: {2: checkArrayForUniform(8)}, },
        4: { arrays: {2: checkArrayForUniformWithOffset(8)}, numbers: [3] },
        5: { arrays: {2: checkArrayForUniformWithOffsetAndLength(8)}, numbers: [3, 4] },
      },
      'uniformMatrix3x4fv': {  // WebGL2
        3: { arrays: {2: checkArrayForUniform(12)}, },
        4: { arrays: {2: checkArrayForUniformWithOffset(12)}, numbers: [3] },
        5: { arrays: {2: checkArrayForUniformWithOffsetAndLength(12)}, numbers: [3, 4] },
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

    // Holds booleans for each GL error so after we get the error ourselves
    // we can still return it to the client app.
    const glErrorShadow = { };
    const origFuncs = {};

    function discardInfoForProgram(program) {
      const oldLocations = sharedState.programToLocationsMap.get(program);
      if (oldLocations) {
        oldLocations.forEach(loc => sharedState.locationsToNamesMap.delete(loc));
      }
      sharedState.programToLocationsMap.set(program, new Set());
      sharedState.programToUnsetUniformsMap.delete(program);
      sharedState.programToUniformInfoMap.delete(program);
      sharedState.programToUniformSamplerValues.delete(program);
    }

    function removeChecks() {
      for (const {ctx, origFuncs} of Object.values(sharedState.apis)) {
        Object.assign(ctx, origFuncs);
      }
      for (const key of [...Object.keys(sharedState)]) {
        delete sharedState[key];
      }
    }

    function checkMaxDrawCallsAndZeroCount(gl, funcName, args) {
      const {vertCount, instances} = getDrawFunctionArgs(funcName, args);
      if (vertCount === 0) {
        console.warn(`count for ${funcName} is 0!`);
      }

      if (instances === 0) {
        console.warn(`instanceCount for ${funcName} is 0!`);
      }

      --sharedState.config.maxDrawCalls;
      if (sharedState.config.maxDrawCalls === 0) {
        removeChecks();
      }
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

    function getCurrentVertexArray() {
      const gl = sharedState.baseContext;
      return (gl instanceof WebGL2RenderingContext || sharedState.apis.oes_vertex_array_object)
         ? gl.getParameter(VERTEX_ARRAY_BINDING)
         : null;
    }

    function checkUnsetUniforms(ctx, funcName, args) {
      const unsetUniforms = sharedState.programToUnsetUniformsMap.get(sharedState.currentProgram);
      if (unsetUniforms) {
        const uniformNames = [];
        for (const [name, {index, unset}] of unsetUniforms) {
          if (unset.has(index)) {
            uniformNames.push(name);
          }
        }
        reportFunctionError(ctx, funcName, args, `uniforms "${uniformNames.join('", "')}" have not been set\nSee docs at https://github.com/greggman/webgl-list/ for how to turn off this check`);
      }
    }

    function getUniformElementName(name, size, index) {
      return (size > 1 || index > 1)
         ? `${name}[${index}]`
         : name;
    }

    function checkUnRenderableTextures(ctx, funcName, args) {
      const uniformSamplerInfos = sharedState.programToUniformSamplerValues.get(sharedState.currentProgram);
      const numTextureUnits = sharedState.textureManager.numTextureUnits;
      for (const {type, values, name} of uniformSamplerInfos) {
        const {bindPoint} = getBindPointForSampler(type);
        for (let i = 0; i < values.length; ++i) {
          const texUnit = values[i];
          if (texUnit >= numTextureUnits) {
            reportFunctionError(ctx, funcName, args, `uniform ${getUniformTypeInfo(type).name} ${getUniformElementName(name, values.length, i)} is set to ${texUnit} which is out of range. There are only ${numTextureUnits} texture units`);
            return;
          }
          const unrenderableReason = sharedState.textureManager.getTextureUnitUnrenderableReason(texUnit, bindPoint);
          if (unrenderableReason) {
            // TODO:
            //   * is the type of texture compatible with the sampler?
            //     int textures for int samplers, unsigned for unsigned.
            //   *
            const texture = sharedState.textureManager.getTextureForTextureUnit(texUnit, bindPoint);
            reportFunctionError(
                ctx,
                funcName,
                args,
                texture
                    ? `texture ${getWebGLObjectString(texture)} on texture unit ${texUnit} referenced by uniform ${getUniformElementName(name, values.length, i)} is not renderable: ${unrenderableReason}`
                    : `no texture on texture unit ${texUnit} referenced by uniform ${getUniformElementName(name, values.length, i)}`);
            return;
          }
        }
      }
    }

    function checkUnsetUniformsAndUnrenderableTextures(ctx, funcName, args) {
      if (!sharedState.currentProgram) {
        reportFunctionError(ctx, funcName, args, 'no current program');
        return;
      }
      checkUnsetUniforms(ctx, funcName, args);
      checkUnRenderableTextures(ctx, funcName, args);
    }

    const preChecks = {
      drawArrays: checkUnsetUniformsAndUnrenderableTextures,
      drawElements: checkUnsetUniformsAndUnrenderableTextures,
      drawArraysInstanced: checkUnsetUniformsAndUnrenderableTextures,
      drawElementsInstanced: checkUnsetUniformsAndUnrenderableTextures,
      drawArraysInstancedANGLE: checkUnsetUniformsAndUnrenderableTextures,
      drawElementsInstancedANGLE: checkUnsetUniformsAndUnrenderableTextures,
      drawRangeElements: checkUnsetUniformsAndUnrenderableTextures,
    };

    function markUniformRangeAsSet(webGLUniformLocation, count) {
      const unsetUniforms = sharedState.programToUnsetUniformsMap.get(sharedState.currentProgram);
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
          sharedState.programToUnsetUniformsMap.delete(sharedState.currentProgram);
        }
      }
    }

    function markUniformSetV(numValuesPer) {
      return function(gl, funcName, args) {
        const [webGLUniformLocation, data, srcOffset = 0, srcLength = 0] = args;
        const length = srcLength ? srcLength : data.length - srcOffset;
        markUniformRangeAsSet(webGLUniformLocation, length / numValuesPer | 0);
      };
    }

    function isUniformIgnored(webglUniformLocation) {
      return sharedState.ignoredUniforms.has(sharedState.locationsToNamesMap.get(webglUniformLocation));
    }

    function markUniformSetMatrixV(numValuesPer) {
      return function(gl, funcName, args) {
        const [webGLUniformLocation, transpose, data, srcOffset = 0, srcLength = 0] = args;
        const length = srcLength ? srcLength : data.length - srcOffset;
        const count = length / numValuesPer | 0;
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
              reportFunctionError(gl, funcName, [webGLUniformLocation, transpose, ...args], 'matrix is all zeros\nSee docs at https://github.com/greggman/webgl-list/ for how to turn off this check');
              return;
            }
          }
        }
        markUniformRangeAsSet(webGLUniformLocation, count);
      };
    }

    function markUniformSetAndRecordSamplerValueV(numValuesPer) {
      const markUniformSetFn = markUniformSetV(numValuesPer);
      return function(gl, funcName, args) {
        markUniformSetFn(gl, funcName, args);
        const [webglUniformLocation, array] = args;
        recordSamplerValues(webglUniformLocation, array);
      };
    }

    function markUniformSet(gl, funcName, args) {
      const [webGLUniformLocation] = args;
      markUniformRangeAsSet(webGLUniformLocation, 1);
    }

    function markUniformSetAndRecordSamplerValue(gl, funcName, args) {
      markUniformSet(gl, funcName, args);
        const [webglUniformLocation, value] = args;
        recordSamplerValues(webglUniformLocation, [value]);
    }

    function recordSamplerValues(webglUniformLocation, newValues) {
      const name = sharedState.locationsToNamesMap.get(webglUniformLocation);
      const uniformInfos = sharedState.programToUniformInfoMap.get(sharedState.currentProgram);
      const {index, type, values} = uniformInfos.get(name);
      if (!uniformTypeIsSampler(type)) {
        return;
      }
      const numToCopy = Math.min(newValues.length, index - values.length);
      for (let i = 0; i < numToCopy; ++i) {
        values[i] = newValues[i];
      }
    }

    function makeDeleteWrapper(ctx, funcName, args) {
      const [obj] = args;
      sharedState.webglObjectToNamesMap.delete(obj);
    }

    const postChecks = {
      // WebGL1
      //   void bufferData(GLenum target, GLsizeiptr size, GLenum usage);
      //   void bufferData(GLenum target, [AllowShared] BufferSource? srcData, GLenum usage);
      // WebGL2:
      //   void bufferData(GLenum target, [AllowShared] ArrayBufferView srcData, GLenum usage, GLuint srcOffset,
      //                   optional GLuint length = 0);
      bufferData(gl, funcName, args) {
        const [target, src, /* usage */, srcOffset = 0, length = 0] = args;
        if (target !== gl.ELEMENT_ARRAY_BUFFER) {
          return;
        }
        const buffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        if (isNumber(src)) {
          sharedState.bufferToIndices.set(buffer, new ArrayBuffer(src));
        } else {
          const isDataView = src instanceof DataView;
          const copyLength = length ? length : isDataView
             ? src.byteLength - srcOffset
             : src.length - srcOffset;
          const elemSize = isDataView ? 1 : src.BYTES_PER_ELEMENT;
          const bufSize = copyLength * elemSize;
          const arrayBuffer = src.buffer ? src.buffer : src;
          sharedState.bufferToIndices.set(buffer, arrayBuffer.slice(srcOffset * elemSize, bufSize));
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
        const data = sharedState.bufferToIndices.get(buffer);
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

      uniform1i: markUniformSetAndRecordSamplerValue,
      uniform2i: markUniformSet,
      uniform3i: markUniformSet,
      uniform4i: markUniformSet,

      uniform1fv: markUniformSetV(1),
      uniform2fv: markUniformSetV(2),
      uniform3fv: markUniformSetV(3),
      uniform4fv: markUniformSetV(4),

      uniform1iv: markUniformSetAndRecordSamplerValueV(1),
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

      getSupportedExtensions(ctx, funcName, args, result) {
        result.push('GMAN_debug_helper');
      },

      getUniformLocation(ctx, funcName, args, location) {
        const [program, name] = args;
        if (location) {
          sharedState.locationsToNamesMap.set(location, name);
          sharedState.programToLocationsMap.get(program).add(location);
        }
      },

      linkProgram(gl, funcName, args) {
        const [program] = args;
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
          discardInfoForProgram(program);
          const unsetUniforms = new Map();
          const uniformInfos = new Map();
          const uniformSamplerValues = [];
          const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
          for (let ii = 0; ii < numUniforms; ++ii) {
            const {name, type, size} = gl.getActiveUniform(program, ii);
            if (isBuiltIn(name)) {
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

            const addUnsetUniform =
                (!uniformTypeIsSampler(type) || sharedState.config.failUnsetSamplerUniforms)
                && !sharedState.ignoredUniforms.has(name);

            const values = uniformTypeIsSampler(type) ? new Array(size).fill(0) : undefined;
            if (values) {
              uniformSamplerValues.push({type, values, name: baseName});
            }

            const unset = new Set(range(0, size));
            for (const [name, index] of altNames) {
              if (addUnsetUniform) {
                unsetUniforms.set(name, {
                  index,
                  unset,
                  altNames,
                });
              }
              uniformInfos.set(name, {
                index,
                type,
                size,
                ...(values && {values}),
              });
            }
          }
          sharedState.programToUniformSamplerValues.set(program, uniformSamplerValues);
          sharedState.programToUniformInfoMap.set(program, uniformInfos);
          if (unsetUniforms.size) {
            sharedState.programToUnsetUniformsMap.set(program, unsetUniforms);
          }
        }
      },

      useProgram(ctx, funcName, args) {
        const [program] = args;
        sharedState.currentProgram = program;
      },

      deleteProgram(ctx, funcName, args) {
        const [program] = args;
        if (sharedState.currentProgram === program) {
          sharedState.currentProgram = undefined;
        }
        discardInfoForProgram(program);
      },

      deleteBuffer(ctx, funcName, args) {
        const [buffer] = args;
        // meh! technically this doesn't work because buffers
        // are ref counted so if you have an index buffer on
        // vao you can still use it. Sigh!
        sharedState.bufferToIndices.delete(buffer);
      },

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
      ...sharedState.textureManager.postChecks,
    };

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
      return `${webglObject.constructor.name}(${quotedStringOrEmpty(name)})`;
    }

    function getIndicesForBuffer(buffer) {
      return sharedState.bufferToIndices.get(buffer);
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
                //            'Error setting attrib 4 of WebGLVertexArrayObject("sphere") to WebGLBuffer("sphere positions")
                //   O drawBuffers implicit
                //       Example: 'Error trying to set drawBuffers on WebGLFrameBuffer('post-processing-fb)
                if (!funcName.startsWith('bind') && argumentIndex === 0) {
                  const binding = getBindingQueryEnumForBindPoint(value);
                  if (binding) {
                    const webglObject = gl.getParameter(binding);
                    if (webglObject) {
                      return `${glEnumToString(value)}{${getWebGLObjectString(webglObject)}}`;
                    }
                  }
                }
                return glEnumToString(value);
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

    function checkTypedArray(ctx, funcName, args, arg, ndx, offset, length) {
      if (!isTypedArray(arg)) {
        reportFunctionError(ctx, funcName, args, `argument ${ndx} must be a TypedArray`);
        return;
      }
      if (!isArrayThatCanHaveBadValues(arg)) {
        return;
      }
      const start = offset;
      const end = offset + length;
      for (let i = start; i < end; ++i) {
        if (arg[i] === undefined) {
          reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is undefined`);
          return;
        } else if (isNaN(arg[i])) {
          reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is NaN`);
          return;
        }
      }
      return;
    }

    function checkTypedArrayWithOffset(ctx, funcName, args, arg, ndx) {
      const offset = args[args.length - 1];
      const length = arg.length - offset;
      checkTypedArray(ctx, funcName, args, arg, ndx, offset, length);
    }

    function checkBufferSourceWithOffset(ctx, funcName, args, arg, ndx) {
      if (isTypedArray(arg) && isArrayThatCanHaveBadValues(arg)) {
        const offset = args[args.length - 1];
        const length = arg.length - offset;
        checkTypedArray(ctx, funcName, args, arg, ndx, offset, length);
      } else {
        if (Array.isArray(arg)) {
          reportFunctionError(ctx, funcName, args, `argument ${ndx} is not an ArrayBufferView or ArrayBuffer`);
        }
      }
    }

    function checkBufferSourceWithOffsetAndLength(ctx, funcName, args, arg, ndx) {
      if (isTypedArray(arg) && isArrayThatCanHaveBadValues(arg)) {
        const offset = args[args.length - 2];
        const length = args[args.length - 1];
        checkTypedArray(ctx, funcName, args, arg, ndx, offset, length);
      } else {
        if (Array.isArray(arg)) {
          reportFunctionError(ctx, funcName, args, `argument ${ndx} is not an ArrayBufferView or ArrayBuffer`);
        }
      }
    }

    function checkOptionalTypedArrayWithOffset(ctx, funcName, args, arg, ndx) {
      if (Array.isArray(arg) || isTypedArray(arg)) {
        const offset = args[args.length - 1];
        const length = arg.length - offset;
        checkTypedArray(ctx, funcName, args, arg, ndx, offset, length);
      }
    }

    function checkArrayForUniformImpl(ctx, funcName, args, arg, ndx, offset, length, valuesPerElementFunctionRequires) {
      const webglUniformLocation = args[0];
      if (!webglUniformLocation) {
        return;
      }
      const uniformInfos = sharedState.programToUniformInfoMap.get(sharedState.currentProgram);
      if (!uniformInfos) {
        return;
      }
      // The uniform info type might be 'vec3' but they
      // might be calling uniform2fv. WebGL itself will catch that error but we might
      // report the wrong error here if we check for vec3 amount of data
      const name = sharedState.locationsToNamesMap.get(webglUniformLocation);
      const {type, size, index} = uniformInfos.get(name);
      const valuesPerElementUniformRequires = getUniformTypeInfo(type).size;
      if (valuesPerElementFunctionRequires !== valuesPerElementUniformRequires) {
        reportFunctionError(ctx, funcName, args, `uniform "${name}" is ${getUniformTypeInfo(type).name} which is wrong for ${funcName}`);
      }
      const maxElementsToReadFromArray = size - index;
      const numElementsToCheck = Math.min(length / valuesPerElementFunctionRequires | 0, maxElementsToReadFromArray);
      const numValuesToCheck = numElementsToCheck * valuesPerElementFunctionRequires;

      const start = offset;
      const end = offset + numValuesToCheck;
      for (let i = start; i < end; ++i) {
        if (arg[i] === undefined) {
          reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is undefined`);
          return;
        } else if (isNaN(arg[i])) {
          reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is NaN`);
          return;
        }
      }
    }

    function checkArrayForUniformWithOffsetAndLength(valuesPerElementFunctionRequires) {
      return function(ctx, funcName, args, arg, ndx) {
        const offset = args[args.length - 2];
        const length = args[args.length - 1];
        checkArrayForUniformImpl(ctx, funcName, args, arg, ndx, offset, length, valuesPerElementFunctionRequires);
      };
    }

    function checkArrayForUniformWithOffset(valuesPerElementFunctionRequires) {
      return function(ctx, funcName, args, arg, ndx) {
        const offset = args[args.length - 1];
        const length = arg.length - offset;
        checkArrayForUniformImpl(ctx, funcName, args, arg, ndx, offset, length, valuesPerElementFunctionRequires);
      };
    }

    function checkArrayForUniform(valuesPerElementFunctionRequires) {
      return function(ctx, funcName, args, arg, ndx) {
        const offset = 0;
        const length = arg.length;
        checkArrayForUniformImpl(ctx, funcName, args, arg, ndx, offset, length, valuesPerElementFunctionRequires);
      };
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
      const gl = sharedState.baseContext;
      const msgs = [msg];
      const funcInfos = glFunctionInfos[funcName];
      if (funcInfos && funcInfos.errorHelper) {
        msgs.push(funcInfos.errorHelper(ctx, funcName, args, sharedState));
      }
      if (funcName.includes('draw')) {
        const program = gl.getParameter(gl.CURRENT_PROGRAM);
        if (!program) {
          msgs.push('no shader program in use!');
        } else {
          msgs.push(`with ${getWebGLObjectString(program)} as current program`);
        }
      }
      if (funcName.includes('vertexAttrib') || isDrawFunction(funcName)) {
        const vao = getCurrentVertexArray();
        const name = sharedState.webglObjectToNamesMap.get(vao);
        const vaoName = `WebGLVertexArrayObject(${quotedStringOrEmpty(name || '*unnamed*')})`;
        msgs.push(`with ${vao ? vaoName : 'the default vertex array'} bound`);
      }
      const stringifiedArgs = glFunctionArgsToString(ctx, funcName, args);
      const errorMsg = `error in ${funcName}(${stringifiedArgs}): ${msgs.join('\n')}`;
      reportError(errorMsg);
    }

    function checkArgs(ctx, funcName, args) {
      const funcInfos = glFunctionInfos[funcName];
      if (funcInfos) {
        const funcInfo = funcInfos[args.length];
        if (!funcInfo) {
          reportFunctionError(ctx, funcName, args, `no version of function '${funcName}' takes ${args.length} arguments`);
          return;
        } else {
          const {numbers = {}, arrays = {}} = funcInfo;
          for (let ndx = 0; ndx < args.length; ++ndx) {
            const arg = args[ndx];
            // check the no arguments are undefined
            if (arg === undefined) {
              reportFunctionError(ctx, funcName, args, `argument ${ndx} is undefined`);
              return;
            }
            if (numbers[ndx] !== undefined) {
              if (numbers[ndx] >= 0)  {
                // check that argument that is number (positive) is a number
                if ((typeof arg !== 'number' && !(arg instanceof Number) && arg !== false && arg !== true) || isNaN(arg)) {
                  reportFunctionError(ctx, funcName, args, `argument ${ndx} is not a number`);
                  return;
                }
              } else {
                // check that argument that maybe is a number (negative) is not NaN
                if (!(arg instanceof Object) && isNaN(arg)) {
                  reportFunctionError(ctx, funcName, args, `argument ${ndx} is NaN`);
                  return;
                }
              }
            }
            // check that an argument that is supposed to be an array of numbers is an array and has no NaNs in the array and no undefined
            const arraySetting = arrays[ndx];
            if (arraySetting !== undefined) {
              const isArrayLike = Array.isArray(arg) || isTypedArray(arg);
              if (arraySetting >= 0) {
                if (!isArrayLike) {
                  reportFunctionError(ctx, funcName, args, `argument ${ndx} is not a array or typedarray`);
                  return;
                }
              }
              if (isArrayLike && isArrayThatCanHaveBadValues(arg)) {
                if (typeof arraySetting === 'function') {
                  arraySetting(ctx, funcName, args, arg, ndx);
                } else {
                  for (let i = 0; i < arg.length; ++i) {
                    if (arg[i] === undefined) {
                      reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is undefined`);
                      return;
                    } else if (isNaN(arg[i])) {
                      reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is NaN`);
                      return;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    const extraWrappers = {
      getExtension(ctx, propertyName) {
        const origFn = ctx[propertyName];
        ctx[propertyName] = function(...args) {
          const extensionName = args[0].toLowerCase();
          const api = sharedState.apis[extensionName];
          if (api) {
            return api.ctx;
          }
          const ext = origFn.call(ctx, ...args);
          if (ext) {
            augmentAPI(ext, extensionName, {...options, origGLErrorFn});
          }
          return ext;
        };
      },
    };

    // Makes a function that calls a WebGL function and then calls getError.
    function makeErrorWrapper(ctx, funcName) {
      const origFn = ctx[funcName];
      const preCheck = preChecks[funcName] || noop;
      const postCheck = postChecks[funcName] || noop;
      ctx[funcName] = function(...args) {
        preCheck(ctx, funcName, args);
        checkArgs(ctx, funcName, args);
        const result = origFn.call(ctx, ...args);
        const gl = sharedState.baseContext;
        const err = origGLErrorFn.call(gl);
        if (err !== 0) {
          glErrorShadow[err] = true;
          const msgs = [glEnumToString(err)];
          if (isDrawFunction(funcName)) {
            const program = gl.getParameter(gl.CURRENT_PROGRAM);
            if (program) {
              msgs.push(...checkFramebufferFeedback(gl, getWebGLObjectString));
              msgs.push(...checkAttributesForBufferOverflow(gl, funcName, args, getWebGLObjectString, getIndicesForBuffer));
            }
          }
          reportFunctionError(ctx, funcName, args, msgs.join('\n'));
        } else {
          postCheck(ctx, funcName, args, result);
        }
        return result;
      };
      const extraWrapperFn = extraWrappers[funcName];
      if (extraWrapperFn) {
        extraWrapperFn(ctx, funcName, origGLErrorFn);
      }
    }

    function range(start, end) {
      const array = [];
      for (let i = start; i < end; ++i) {
        array.push(i);
      }
      return array;
    }

    // Wrap each function
    for (const propertyName in ctx) {
      if (typeof ctx[propertyName] === 'function') {
        origFuncs[propertyName] = ctx[propertyName];
        makeErrorWrapper(ctx, propertyName);
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

    sharedState.apis[nameOfClass.toLowerCase()] = { ctx, origFuncs };
  }

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

  /* global console */
  /* global document */
  /* global HTMLCanvasElement */
  /* global OffscreenCanvas */

  console.log('webgl-lint running');

  function wrapGetContext(Ctor) {
    const oldFn = Ctor.prototype.getContext;
    Ctor.prototype.getContext = function(type, ...args) {
      const ctx = oldFn.call(this, type, ...args);
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
        augmentAPI(ctx, type, config);
        const ext = ctx.getExtension('GMAN_debug_helper');
        document.querySelectorAll('[data-gman-debug-helper]').forEach(elem => {
          const str = elem.dataset.gmanDebugHelper;
          let config;
          try {
            config = JSON.parse(str);
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
  }

  if (typeof HTMLCanvasElement !== 'undefined') {
    wrapGetContext(HTMLCanvasElement);
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    wrapGetContext(OffscreenCanvas);
  }

})));
