const SAMPLER_2D                    = 0x8B5E;
const SAMPLER_CUBE                  = 0x8B60;
const SAMPLER_3D                    = 0x8B5F;
const SAMPLER_2D_SHADOW             = 0x8B62;
const SAMPLER_2D_ARRAY              = 0x8DC1;
const SAMPLER_2D_ARRAY_SHADOW       = 0x8DC4;
const SAMPLER_CUBE_SHADOW           = 0x8DC5;
const INT_SAMPLER_2D                = 0x8DCA;
const INT_SAMPLER_3D                = 0x8DCB;
const INT_SAMPLER_CUBE              = 0x8DCC;
const INT_SAMPLER_2D_ARRAY          = 0x8DCF;
const UNSIGNED_INT_SAMPLER_2D       = 0x8DD2;
const UNSIGNED_INT_SAMPLER_3D       = 0x8DD3;
const UNSIGNED_INT_SAMPLER_CUBE     = 0x8DD4;
const UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

const samplers = new Set([
  SAMPLER_2D,
  SAMPLER_CUBE,
  SAMPLER_3D,
  SAMPLER_2D_SHADOW,
  SAMPLER_2D_ARRAY,
  SAMPLER_2D_ARRAY_SHADOW,
  SAMPLER_CUBE_SHADOW,
]);

export function isSampler(type) {
  return samplers.has(type);
}

const samplerTypes = new Map([
  [SAMPLER_2D,                    {uniformType: 'sampler2D',       numberType: 'float/normalized', bindPoint: '2D'}],
  [SAMPLER_CUBE,                  {uniformType: 'samplerCube',     numberType: 'float/normalized', bindPoint: 'CUBE'}],
  [SAMPLER_3D,                    {uniformType: 'sampler3D',       numberType: 'float/normalized', bindPoint: '3D'}],
  [SAMPLER_2D_SHADOW,             {uniformType: 'sampler2D',       numberType: 'float/normalized', bindPoint: '2D'}],
  [SAMPLER_2D_ARRAY,              {uniformType: 'sampler2DArray',  numberType: 'float/normalized', bindPoint: '2D_ARRAY'}],
  [SAMPLER_2D_ARRAY_SHADOW,       {uniformType: 'sampler2DArray',  numberType: 'float/normalized', bindPoint: '2D_ARRAY'}],
  [SAMPLER_CUBE_SHADOW,           {uniformType: 'samplerCube',     numberType: 'float/normalized', bindPoint: 'CUBE'}],
  [INT_SAMPLER_2D,                {uniformType: 'isampler2D',      numberType: 'int',              bindPoint: '2D'}],
  [INT_SAMPLER_3D,                {uniformType: 'isampler3D',      numberType: 'int',              bindPoint: '3D'}],
  [INT_SAMPLER_CUBE,              {uniformType: 'isamplerCube',    numberType: 'int',              bindPoint: 'CUBE'}],
  [INT_SAMPLER_2D_ARRAY,          {uniformType: 'isampler2DArray', numberType: 'int',              bindPoint: '2D_ARRAY'}],
  [UNSIGNED_INT_SAMPLER_2D,       {uniformType: 'usampler2D',      numberType: 'unsigned int',     bindPoint: '2D'}],
  [UNSIGNED_INT_SAMPLER_3D,       {uniformType: 'usampler3D',      numberType: 'unsigned int',     bindPoint: '3D'}],
  [UNSIGNED_INT_SAMPLER_CUBE,     {uniformType: 'usamplerCube',    numberType: 'unsigned int',     bindPoint: 'CUBE'}],
  [UNSIGNED_INT_SAMPLER_2D_ARRAY, {uniformType: 'usampler2DArray', numberType: 'unsigned int',     bindPoint: '2D_ARRAY'}],
]);

export function getBindPointForSampler(type) {
  return samplerTypes.get(type).bindPoint;
}

export function uniformTypeIsSampler(type) {
  return samplerTypes.has(type);
}

export function getNumberTypeForUniformSamplerType(type) {
  return samplerTypes.get(type).numberType;
}

export function getUniformTypeForUniformSamplerType(type) {
  return samplerTypes.get(type).uniformType;
}

const TEXTURE_2D                     = 0x0DE1;
const TEXTURE_3D                     = 0x806F;
const TEXTURE_2D_ARRAY               = 0x8C1A;
const TEXTURE_CUBE_MAP               = 0x8513;
const TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
const TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
const TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
const TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
const TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
const TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;

const targetToBindPointMap = new Map([
  [TEXTURE_2D, '2D'],
  [TEXTURE_3D, '3D'],
  [TEXTURE_CUBE_MAP, 'CUBE'],
  [TEXTURE_CUBE_MAP_POSITIVE_X, 'CUBE'],
  [TEXTURE_CUBE_MAP_NEGATIVE_X, 'CUBE'],
  [TEXTURE_CUBE_MAP_POSITIVE_Y, 'CUBE'],
  [TEXTURE_CUBE_MAP_NEGATIVE_Y, 'CUBE'],
  [TEXTURE_CUBE_MAP_POSITIVE_Z, 'CUBE'],
  [TEXTURE_CUBE_MAP_NEGATIVE_Z, 'CUBE'],
  [TEXTURE_2D_ARRAY, '2D_ARRAY'],
]);

export function getBindPointForTarget(target) {
  return targetToBindPointMap.get(target);
}

const TEXTURE_BINDING_2D            = 0x8069;
const TEXTURE_BINDING_CUBE_MAP      = 0x8514;
const TEXTURE_BINDING_3D            = 0x806A;
const TEXTURE_BINDING_2D_ARRAY      = 0x8C1D;

const samplerTypeToBinding = new Map([
  [SAMPLER_2D, TEXTURE_BINDING_2D],
  [SAMPLER_2D_SHADOW, TEXTURE_BINDING_2D],
  [SAMPLER_3D, TEXTURE_BINDING_3D],
  [SAMPLER_2D_ARRAY, TEXTURE_BINDING_2D_ARRAY],
  [SAMPLER_2D_ARRAY_SHADOW, TEXTURE_BINDING_2D_ARRAY],
  [SAMPLER_CUBE, TEXTURE_BINDING_CUBE_MAP],
  [SAMPLER_CUBE_SHADOW, TEXTURE_BINDING_CUBE_MAP],
]);

export function getTextureForUnit(gl, unit, type) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  const binding = samplerTypeToBinding.get(type);
  return gl.getParameter(binding);
}
