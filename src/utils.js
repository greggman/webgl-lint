export function isBuiltIn(name) {
  return name.startsWith('gl_') || name.startsWith('webgl_');
}

export function isWebGL2(gl) {
  // a proxy for if this is webgl
  return !!gl.texImage3D;
}

export function isTypedArray(v) {
  return v && v.buffer && v.buffer instanceof ArrayBuffer;
}

export function isArrayThatCanHaveBadValues(v) {
  return Array.isArray(v) ||
         v instanceof Float32Array ||
         v instanceof Float64Array;
}

export function quotedStringOrEmpty(s) {
  return s ? `"${s}"` : '';
}

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
export function addEnumsForContext(ctx, type) {
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

export function enumArrayToString(gl, enums) {
  const enumStrings = [];
  if (enums.length) {
    for (let i = 0; i < enums.length; ++i) {
      enums.push(glEnumToString(enums[i]));  // eslint-disable-line
    }
    return '[' + enumStrings.join(', ') + ']';
  }
  return enumStrings.toString();
}

export function makeBitFieldToStringFunc(enums) {
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
export function addEnumsFromAPI(api) {
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
export function glEnumToString(value) {
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

export function getUniformTypeInfo(type) {
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

export function getBindingQueryEnumForBindPoint(bindPoint) {
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

export function getBytesPerValueForGLType(type) {
  return glTypeToSizeMap.get(type) || 0;
}

const glTypeToTypedArrayMap = new Map([
  [UNSIGNED_BYTE,  Uint8Array],
  [UNSIGNED_SHORT, Uint16Array],
  [UNSIGNED_INT,   Uint32Array],
]);

export function glTypeToTypedArray(type) {
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

export function getDrawFunctionArgs(funcName, args) {
  return drawFuncsToArgs[funcName](...args);
}

export function isDrawFunction(funcName) {
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

export function getAttributeTypeInfo(type) {
  return attrTypeMap.get(type);
}

export const createWeakRef = obj => obj ? new WeakRef(obj) : null;
export const isObjectRefEqual = (ref, obj) => {
  const refed = ref?.deref();
  // check they both reference something or both don't reference something.
  if (!!refed !== !!obj) {
    return false;
  }
  return refed ? refed === obj : true;
};

export function getWithDefault(v, defaultValue) {
  return v === 'undefined' ? defaultValue : v;
}