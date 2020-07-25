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
  [SAMPLER_2D,                    {bindPoint: '2D'}],
  [SAMPLER_CUBE,                  {bindPoint: 'CUBE'}],
  [SAMPLER_3D,                    {bindPoint: '3D'}],
  [SAMPLER_2D_SHADOW,             {bindPoint: '2D'}],
  [SAMPLER_2D_ARRAY,              {bindPoint: '2D_ARRAY'}],
  [SAMPLER_2D_ARRAY_SHADOW,       {bindPoint: '2D_ARRAY'}],
  [SAMPLER_CUBE_SHADOW,           {bindPoint: 'CUBE'}],
  [INT_SAMPLER_2D,                {bindPoint: '2D'}],
  [INT_SAMPLER_3D,                {bindPoint: '3D'}],
  [INT_SAMPLER_CUBE,              {bindPoint: 'CUBE'}],
  [INT_SAMPLER_2D_ARRAY,          {bindPoint: '2D_ARRAY'}],
  [UNSIGNED_INT_SAMPLER_2D,       {bindPoint: '2D'}],
  [UNSIGNED_INT_SAMPLER_3D,       {bindPoint: '3D'}],
  [UNSIGNED_INT_SAMPLER_CUBE,     {bindPoint: 'CUBE'}],
  [UNSIGNED_INT_SAMPLER_2D_ARRAY, {bindPoint: '2D_ARRAY'}],
]);

export function getBindPointForSampler(type) {
  return samplerTypes.get(type);
}

export function uniformTypeIsSampler(type) {
  return samplerTypes.has(type);
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
