import {
  getBindPointForTarget,
  getNumberTypeForUniformSamplerType,
  getUniformTypeForUniformSamplerType,
} from './samplers.js';
import {glEnumToString, isWebGL2 as isWebGL2Check} from './utils.js';

function createTextureUnits(gl) {
  const textureUnits = [];
  const numUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
  for (let i = 0; i < numUnits; ++i) {
    textureUnits.push(new Map());
  }
  return textureUnits;
}

const TEXTURE0                       = 0x84C0;
const TEXTURE_2D                     = 0x0DE1;
const TEXTURE_3D                     = 0x806F;
const TEXTURE_CUBE_MAP               = 0x8513;
const TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
const TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
const TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
const TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
const TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
const TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;
const TEXTURE_MIN_FILTER             = 0x2801;
const TEXTURE_MAG_FILTER             = 0x2800;
const TEXTURE_BASE_LEVEL             = 0x813c;  // int
const TEXTURE_MAX_LEVEL              = 0x813d;  // int
const TEXTURE_WRAP_S                 = 0x2802;
const TEXTURE_WRAP_T                 = 0x2803;
const REPEAT                         = 0x2901;
const TEXTURE_2D_ARRAY               = 0x8C1A;
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
const DEPTH_COMPONENT                = 0x1902;
const DEPTH_STENCIL                  = 0x84F9;

const unsizedInternalFormats = new Set([
  ALPHA,
  LUMINANCE,
  LUMINANCE_ALPHA,
  RGB,
  RGBA,
]);

function getInternalFormatStringForInternalFormatType(internalFormat, type) {
  return unsizedInternalFormats.has(internalFormat)
     ? `${glEnumToString(internalFormat)}/${glEnumToString(type)}`
     : glEnumToString(internalFormat);
}

const targetToFaceIndex = new Map([
  [TEXTURE_2D, 0],
  [TEXTURE_3D, 0],
  [TEXTURE_2D_ARRAY, 0],
  [TEXTURE_CUBE_MAP, 0],
  [TEXTURE_CUBE_MAP_POSITIVE_X, 0],
  [TEXTURE_CUBE_MAP_NEGATIVE_X, 1],
  [TEXTURE_CUBE_MAP_POSITIVE_Y, 2],
  [TEXTURE_CUBE_MAP_NEGATIVE_Y, 3],
  [TEXTURE_CUBE_MAP_POSITIVE_Z, 4],
  [TEXTURE_CUBE_MAP_NEGATIVE_Z, 5],
]);

function getFaceTarget(face, type) {
  if (type === TEXTURE_CUBE_MAP) {
    return `(${glEnumToString(TEXTURE_CUBE_MAP_POSITIVE_X + face)})`;
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

const R8                           = 0x8229;
const R8_SNORM                     = 0x8F94;
const R16F                         = 0x822D;
const R32F                         = 0x822E;
const R8UI                         = 0x8232;
const R8I                          = 0x8231;
const RG16UI                       = 0x823A;
const RG16I                        = 0x8239;
const RG32UI                       = 0x823C;
const RG32I                        = 0x823B;
const RG8                          = 0x822B;
const RG8_SNORM                    = 0x8F95;
const RG16F                        = 0x822F;
const RG32F                        = 0x8230;
const RG8UI                        = 0x8238;
const RG8I                         = 0x8237;
const R16UI                        = 0x8234;
const R16I                         = 0x8233;
const R32UI                        = 0x8236;
const R32I                         = 0x8235;
const RGB8                         = 0x8051;
const SRGB8                        = 0x8C41;
const RGB565                       = 0x8D62;
const RGB8_SNORM                   = 0x8F96;
const R11F_G11F_B10F               = 0x8C3A;
const RGB9_E5                      = 0x8C3D;
const RGB16F                       = 0x881B;
const RGB32F                       = 0x8815;
const RGB8UI                       = 0x8D7D;
const RGB8I                        = 0x8D8F;
const RGB16UI                      = 0x8D77;
const RGB16I                       = 0x8D89;
const RGB32UI                      = 0x8D71;
const RGB32I                       = 0x8D83;
const RGBA8                        = 0x8058;
const SRGB8_ALPHA8                 = 0x8C43;
const RGBA8_SNORM                  = 0x8F97;
const RGB5_A1                      = 0x8057;
const RGBA4                        = 0x8056;
const RGB10_A2                     = 0x8059;
const RGBA16F                      = 0x881A;
const RGBA32F                      = 0x8814;
const RGBA8UI                      = 0x8D7C;
const RGBA8I                       = 0x8D8E;
const RGB10_A2UI                   = 0x906F;
const RGBA16UI                     = 0x8D76;
const RGBA16I                      = 0x8D88;
const RGBA32I                      = 0x8D82;
const RGBA32UI                     = 0x8D70;

const DEPTH_COMPONENT16            = 0x81A5;
const DEPTH_COMPONENT24            = 0x81A6;
const DEPTH_COMPONENT32F           = 0x8CAC;
const DEPTH32F_STENCIL8            = 0x8CAD;
const DEPTH24_STENCIL8             = 0x88F0;

/* DataType */
const BYTE                         = 0x1400;
const UNSIGNED_BYTE                = 0x1401;
const SHORT                        = 0x1402;
const UNSIGNED_SHORT               = 0x1403;
const INT                          = 0x1404;
const UNSIGNED_INT                 = 0x1405;
const FLOAT                        = 0x1406;
const UNSIGNED_SHORT_4_4_4_4       = 0x8033;
const UNSIGNED_SHORT_5_5_5_1       = 0x8034;
const UNSIGNED_SHORT_5_6_5         = 0x8363;
const HALF_FLOAT                   = 0x140B;
const HALF_FLOAT_OES               = 0x8D61;  // Thanks Khronos for making this different >:(
const UNSIGNED_INT_2_10_10_10_REV  = 0x8368;
const UNSIGNED_INT_10F_11F_11F_REV = 0x8C3B;
const UNSIGNED_INT_5_9_9_9_REV     = 0x8C3E;
const FLOAT_32_UNSIGNED_INT_24_8_REV = 0x8DAD;
const UNSIGNED_INT_24_8            = 0x84FA;

const RG                           = 0x8227;
const RG_INTEGER                   = 0x8228;
const RED                          = 0x1903;
const RED_INTEGER                  = 0x8D94;
const RGB_INTEGER                  = 0x8D98;
const RGBA_INTEGER                 = 0x8D99;

function createTextureInternalFormatInfoMap() {
  const textureInternalFormatInfoMap = new Map([
      // unsized formats
     [ALPHA,              { textureFormat: ALPHA,           colorRenderable: true,  textureFilterable: true,  bytesPerElement: [1, 2, 2, 4],        type: [UNSIGNED_BYTE], }],
     [LUMINANCE,          { textureFormat: LUMINANCE,       colorRenderable: true,  textureFilterable: true,  bytesPerElement: [1, 2, 2, 4],        type: [UNSIGNED_BYTE], }],
     [LUMINANCE_ALPHA,    { textureFormat: LUMINANCE_ALPHA, colorRenderable: true,  textureFilterable: true,  bytesPerElement: [2, 4, 4, 8],        type: [UNSIGNED_BYTE], }],
     [RGB,                { textureFormat: RGB,             colorRenderable: true,  textureFilterable: true,  bytesPerElement: [3, 6, 6, 12, 2],    type: [UNSIGNED_BYTE, UNSIGNED_SHORT_5_6_5], }],
     [RGBA,               { textureFormat: RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4, 8, 8, 16, 2, 2], type: [UNSIGNED_BYTE, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1], }],

      // sized formats
     [R8,                 { textureFormat: RED,             colorRenderable: true,  textureFilterable: true,  bytesPerElement: [1],        type: [UNSIGNED_BYTE], }],
     [R8_SNORM,           { textureFormat: RED,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [1],        type: [BYTE], }],
     [R16F,               { textureFormat: RED,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [4, 2],     type: [FLOAT, HALF_FLOAT], }],
     [R32F,               { textureFormat: RED,             colorRenderable: false, textureFilterable: false, bytesPerElement: [4],        type: [FLOAT], }],
     [R8UI,               { textureFormat: RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement: [1],        type: [UNSIGNED_BYTE], }],
     [R8I,                { textureFormat: RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement: [1],        type: [BYTE], }],
     [R16UI,              { textureFormat: RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement: [2],        type: [UNSIGNED_SHORT], }],
     [R16I,               { textureFormat: RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement: [2],        type: [SHORT], }],
     [R32UI,              { textureFormat: RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [UNSIGNED_INT], }],
     [R32I,               { textureFormat: RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [INT], }],
     [RG8,                { textureFormat: RG,              colorRenderable: true,  textureFilterable: true,  bytesPerElement: [2],        type: [UNSIGNED_BYTE], }],
     [RG8_SNORM,          { textureFormat: RG,              colorRenderable: false, textureFilterable: true,  bytesPerElement: [2],        type: [BYTE], }],
     [RG16F,              { textureFormat: RG,              colorRenderable: false, textureFilterable: true,  bytesPerElement: [8, 4],     type: [FLOAT, HALF_FLOAT], }],
     [RG32F,              { textureFormat: RG,              colorRenderable: false, textureFilterable: false, bytesPerElement: [8],        type: [FLOAT], }],
     [RG8UI,              { textureFormat: RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement: [2],        type: [UNSIGNED_BYTE], }],
     [RG8I,               { textureFormat: RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement: [2],        type: [BYTE], }],
     [RG16UI,             { textureFormat: RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [UNSIGNED_SHORT], }],
     [RG16I,              { textureFormat: RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [SHORT], }],
     [RG32UI,             { textureFormat: RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement: [8],        type: [UNSIGNED_INT], }],
     [RG32I,              { textureFormat: RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement: [8],        type: [INT], }],
     [RGB8,               { textureFormat: RGB,             colorRenderable: true,  textureFilterable: true,  bytesPerElement: [3],        type: [UNSIGNED_BYTE], }],
     [SRGB8,              { textureFormat: RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [3],        type: [UNSIGNED_BYTE], }],
     [RGB565,             { textureFormat: RGB,             colorRenderable: true,  textureFilterable: true,  bytesPerElement: [3, 2],     type: [UNSIGNED_BYTE, UNSIGNED_SHORT_5_6_5], }],
     [RGB8_SNORM,         { textureFormat: RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [3],        type: [BYTE], }],
     [R11F_G11F_B10F,     { textureFormat: RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [12, 6, 4], type: [FLOAT, HALF_FLOAT, UNSIGNED_INT_10F_11F_11F_REV], }],
     [RGB9_E5,            { textureFormat: RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [12, 6, 4], type: [FLOAT, HALF_FLOAT, UNSIGNED_INT_5_9_9_9_REV], }],
     [RGB16F,             { textureFormat: RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [12, 6],    type: [FLOAT, HALF_FLOAT], }],
     [RGB32F,             { textureFormat: RGB,             colorRenderable: false, textureFilterable: false, bytesPerElement: [12],       type: [FLOAT], }],
     [RGB8UI,             { textureFormat: RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement: [3],        type: [UNSIGNED_BYTE], }],
     [RGB8I,              { textureFormat: RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement: [3],        type: [BYTE], }],
     [RGB16UI,            { textureFormat: RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement: [6],        type: [UNSIGNED_SHORT], }],
     [RGB16I,             { textureFormat: RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement: [6],        type: [SHORT], }],
     [RGB32UI,            { textureFormat: RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement: [12],       type: [UNSIGNED_INT], }],
     [RGB32I,             { textureFormat: RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement: [12],       type: [INT], }],
     [RGBA8,              { textureFormat: RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4],        type: [UNSIGNED_BYTE], }],
     [SRGB8_ALPHA8,       { textureFormat: RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4],        type: [UNSIGNED_BYTE], }],
     [RGBA8_SNORM,        { textureFormat: RGBA,            colorRenderable: false, textureFilterable: true,  bytesPerElement: [4],        type: [BYTE], }],
     [RGB5_A1,            { textureFormat: RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4, 2, 4],  type: [UNSIGNED_BYTE, UNSIGNED_SHORT_5_5_5_1, UNSIGNED_INT_2_10_10_10_REV], }],
     [RGBA4,              { textureFormat: RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4, 2],     type: [UNSIGNED_BYTE, UNSIGNED_SHORT_4_4_4_4], }],
     [RGB10_A2,           { textureFormat: RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4],        type: [UNSIGNED_INT_2_10_10_10_REV], }],
     [RGBA16F,            { textureFormat: RGBA,            colorRenderable: false, textureFilterable: true,  bytesPerElement: [16, 8],    type: [FLOAT, HALF_FLOAT], }],
     [RGBA32F,            { textureFormat: RGBA,            colorRenderable: false, textureFilterable: false, bytesPerElement: [16],       type: [FLOAT], }],
     [RGBA8UI,            { textureFormat: RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [UNSIGNED_BYTE], }],
     [RGBA8I,             { textureFormat: RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [BYTE], }],
     [RGB10_A2UI,         { textureFormat: RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [UNSIGNED_INT_2_10_10_10_REV], }],
     [RGBA16UI,           { textureFormat: RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: [8],        type: [UNSIGNED_SHORT], }],
     [RGBA16I,            { textureFormat: RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: [8],        type: [SHORT], }],
     [RGBA32I,            { textureFormat: RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: [16],       type: [INT], }],
     [RGBA32UI,           { textureFormat: RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: [16],       type: [UNSIGNED_INT], }],
      // Sized Internal
     [DEPTH_COMPONENT16,  { textureFormat: DEPTH_COMPONENT, colorRenderable: true,  textureFilterable: false, bytesPerElement: [2, 4],     type: [UNSIGNED_SHORT, UNSIGNED_INT], }],
     [DEPTH_COMPONENT24,  { textureFormat: DEPTH_COMPONENT, colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [UNSIGNED_INT], }],
     [DEPTH_COMPONENT32F, { textureFormat: DEPTH_COMPONENT, colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [FLOAT], }],
     [DEPTH24_STENCIL8,   { textureFormat: DEPTH_STENCIL,   colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [UNSIGNED_INT_24_8], }],
     [DEPTH32F_STENCIL8,  { textureFormat: DEPTH_STENCIL,   colorRenderable: true,  textureFilterable: false, bytesPerElement: [4],        type: [FLOAT_32_UNSIGNED_INT_24_8_REV], }],
  ]);

  textureInternalFormatInfoMap.forEach((info) =>{
    info.bytesPerElementMap = {};
    info.bytesPerElement.forEach(function(bytesPerElement, ndx) {
      const type = info.type[ndx];
      info.bytesPerElementMap[type] = bytesPerElement;
    });
  });

  const internalFormatStringToFormatInfoMap = new Map();
  textureInternalFormatInfoMap.forEach((info, internalFormat) => {
    if (unsizedInternalFormats.has(internalFormat)) {
      info.type.forEach(type => {
        internalFormatStringToFormatInfoMap.set(
            getInternalFormatStringForInternalFormatType(internalFormat, type),
            info);
      });
    } else {
      internalFormatStringToFormatInfoMap.set(
          getInternalFormatStringForInternalFormatType(internalFormat),
          info);
    }
  });

  return {
    textureInternalFormatInfoMap,
    internalFormatStringToFormatInfoMap,
  };
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function computeNumMipsNeeded(width, height = 0, depth = 0) {
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

function getNumberTypeForInternalFormat(internalFormat) {
  const str = glEnumToString(internalFormat);
  if (str.endsWith('UI')) {
    return 'unsigned int';
  }
  if (str.endsWith('I')) {
    return 'int';
  }
  return 'float/normalized';
}

function getDimensionsString(type, width, height, depth) {
  return (type === TEXTURE_2D || type === TEXTURE_CUBE_MAP)
     ? `${width}x${height}`
     : `${width}x${height}x${depth}`;
}

export class TextureManager {
  constructor(gl) {
    const isWebGL2 = isWebGL2Check(gl);
    const needPOT = !isWebGL2;
    const extensions = new Set();
    const textureToTextureInfoMap = new Map();
    const samplerToParametersMap = new Map();
    const textureUnits = createTextureUnits(gl);
    const maxMips = computeNumMipsNeeded(gl.getParameter(gl.MAX_TEXTURE_SIZE));
    const {internalFormatStringToFormatInfoMap} = createTextureInternalFormatInfoMap();
    let activeTextureUnitIndex = 0;
    let activeTextureUnit = textureUnits[0];
    this.numTextureUnits = textureUnits.length;

    function recomputeRenderability(textureInfo) {
      textureInfo.notRenderable = computeRenderability(textureInfo, textureInfo.parameters);
    }

    function recomputeAllTextureUnrenderability() {
      textureToTextureInfoMap.forEach(recomputeRenderability);
    }

    function computeRenderability(textureInfo, parameters) {
      const {type, mips} = textureInfo;
      const baseLevel = parameters.get(TEXTURE_BASE_LEVEL) || 0;
      const maxLevel = parameters.get(TEXTURE_MAX_LEVEL) || maxMips;
      if (maxLevel < baseLevel) {
        return `TEXTURE_MAX_LEVEL(${maxLevel}) is less than TEXTURE_BASE_LEVEL(${baseLevel})`;
      }
      const baseLevelFaces = mips[baseLevel];
      if (!baseLevelFaces) {
        return 'no base level mip ${baseLevel}';
      }
      const baseMipFace = baseLevelFaces[0];
      if (!baseMipFace) {
        return 'TEXTURE_CUBE_MAP_POSITIVE_X face does not exist';
      }
      const {
        width: baseWidth,
        height: baseHeight,
        depth: baseDepth,
        // internalFormat: baseInternalFormat,
        internalFormatString: baseInternalFormatString,
      } = baseMipFace;
      const numFaces = type === TEXTURE_CUBE_MAP ? 6 : 1;
      const minFilter = parameters.get(TEXTURE_MIN_FILTER);
      const internalFormatInfo = internalFormatStringToFormatInfoMap.get(baseInternalFormatString);
      // there is no format info for compressed texture ATM.
      // we could add it but AFAIK compressed textures are colorFilterable
      // so for now let's just not do the check if we don't know about the format
      if (internalFormatInfo) {
        const textureFilterable = internalFormatInfo.textureFilterable;
        if (!textureFilterable) {
          if (minFilter !== NEAREST) {
            return `texture of type (${baseInternalFormatString}) is not filterable but TEXTURE_MIN_FILTER is set to ${glEnumToString(minFilter)}`;
          } else {
            const magFilter = parameters.get(TEXTURE_MAG_FILTER);
            if (magFilter !== NEAREST) {
              return `texture of type (${baseInternalFormatString}) is not filterable but TEXTURE_MAG_FILTER is set to ${glEnumToString(magFilter)}`;
            }
          }
        }
      }

      const numMipsNeeded = (minFilter === LINEAR || minFilter === NEAREST)
         ? 1
         : computeNumMipsNeeded(baseWidth, baseHeight, baseDepth);
      {
        let mipWidth = baseWidth;
        let mipHeight = baseHeight;
        let mipDepth = baseDepth;
        const lastMip = Math.min(maxLevel, baseLevel + numMipsNeeded - 1);
        for (let mipLevel = baseLevel; mipLevel <= lastMip; ++mipLevel) {
          const faceMips = mips[mipLevel];
          if (!faceMips) {
            return `filtering is set to use mips from level ${baseLevel} to ${lastMip} with (TEXTURE_MIN_FILTER = ${glEnumToString(minFilter)}) but mip level ${mipLevel} does not exist`;
          }
          for (let face = 0; face < numFaces; ++face) {
            const mip = faceMips[face];
            if (!mip) {
              return `filtering is set to use mips level ${baseLevel} to ${lastMip} with (TEXTURE_MIN_FILTER = ${glEnumToString(minFilter)}) but mip level ${mipLevel}${getFaceTarget(face, type)} does not exist`;
            }
            if (mip.width !== mipWidth ||
                mip.height !== mipHeight ||
                mip.depth !== mipDepth) {
              return `mip level ${mipLevel}${getFaceTarget(face, type)} needs to be ${getDimensionsString(type, mipWidth, mipHeight, mipDepth)} but it is ${getDimensionsString(type, mip.width, mip.height, mip.depth)}`;
            }
            if (mip.internalFormatString !== baseInternalFormatString) {
              return `mip level ${mipLevel}${getFaceTarget(face, type)}'s internal format ${mip.internalFormatString} does not match mip level ${baseLevel}'s internal format ${baseInternalFormatString}`;
            }
          }
          mipWidth = Math.max(1, mipWidth / 2 | 0);
          mipHeight = Math.max(1, mipHeight / 2 | 0);
          if (type !== TEXTURE_2D_ARRAY) {
            mipDepth = Math.max(1, mipDepth / 2 | 0);
          }
        }
      }

      if (needPOT) {
        if (!isPowerOf2(baseWidth) || !isPowerOf2(baseHeight)) {
          if (numMipsNeeded > 1) {
            return `texture's ${getNPotIssues(baseWidth, baseHeight)} but TEXTURE_MIN_FILTER (${glEnumToString(minFilter)}) is set to need mips`;
          }
          const wrapS = parameters.get(TEXTURE_WRAP_S);
          const wrapT = parameters.get(TEXTURE_WRAP_T);
          if (wrapS !== CLAMP_TO_EDGE || wrapT !== CLAMP_TO_EDGE) {
            return `texture's ${getNPotIssues(baseWidth, baseHeight)} but ${getClampToEdgeIssues(wrapS, wrapT)}.`;
          }
        }
      }

      if (type === TEXTURE_CUBE_MAP) {
        if (baseWidth !== baseHeight) {
          return `texture is CUBE_MAP but dimensions ${baseWidth}x${baseHeight} are not square`;
        }
      }

      return undefined;
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

    function removeFromTextureUnits(type, obj) {
      for (let i = 0; i < textureUnits.length; ++i) {
        const unit = textureUnits[i];
        if (unit.get(type) === obj) {
          unit.set(type, null);
        }
      }
    }

    function getInternalFormatStringForTextureInfo(textureInfo) {
      const {mips, parameters} = textureInfo;
      const baseLevel = parameters.get(TEXTURE_BASE_LEVEL) || 0;
      const baseFaces = mips[baseLevel];
      if (!baseFaces) {
        return '';
      }
      const baseMipFace = baseFaces[0];
      if (!baseMipFace) {
        return '';
      }
      return baseMipFace.internalFormatString;
    }

    function addInternalFormatStringInfos(type, textureFilterableExtensionName) {
      const textureFilterable = extensions.has(textureFilterableExtensionName);
      [
        RGBA,
        RGB,
        LUMINANCE,
        LUMINANCE_ALPHA,
        ALPHA,
      ].forEach(internalFormat => {
        internalFormatStringToFormatInfoMap.set(
            getInternalFormatStringForInternalFormatType(internalFormat, type),
            { textureFormat: gl.RGBA, textureFilterable });
      });
    }

    function markInternalFormatsAsTextureFilterable(internalFormats) {
      for (const internalFormat of internalFormats) {
        const info = internalFormatStringToFormatInfoMap.get(
            getInternalFormatStringForInternalFormatType(internalFormat));
        info.textureFilterable = true;
      }
    }

    this.addExtension = function(extensionName) {
      extensions.add(extensionName);
      switch (extensionName) {
        case 'oes_texture_float':
          addInternalFormatStringInfos(FLOAT, 'oes_texture_float_linear');
          break;
        case 'oes_texture_float_linear':
          if (isWebGL2) {
            markInternalFormatsAsTextureFilterable([
                R32F,
                RG32F,
                RGB32F,
                RGBA32F,
            ]);
          } else {
            if (extensions.has('oes_texture_float')) {
              addInternalFormatStringInfos(FLOAT, 'oes_texture_float_linear');
            }
          }
          recomputeAllTextureUnrenderability();
          break;
        case 'oes_texture_half_float':
          addInternalFormatStringInfos(HALF_FLOAT, 'oes_texture_half_float_linear');
          addInternalFormatStringInfos(HALF_FLOAT_OES, 'oes_texture_half_float_linear');
          break;
        case 'oes_texture_half_float_linear':
          if (isWebGL2) {
            markInternalFormatsAsTextureFilterable([
                R16F,
                RG16F,
                RGB16F,
                RGBA16F,
            ]);
          } else {
            if (extensions.has('oes_texture_half_float')) {
              addInternalFormatStringInfos(HALF_FLOAT, 'oes_texture_half_float_linear');
              addInternalFormatStringInfos(HALF_FLOAT_OES, 'oes_texture_half_float_linear');
            }
          }
          recomputeAllTextureUnrenderability();
          break;
        default:
          return;
      }
    };

    this.getTextureForTextureUnit = function(texUnit, target) {
      return textureUnits[texUnit].get(target);
    };

    this.getTextureUnitUnrenderableReason = function(uniformType, texUnit, target, getWebGLObjectString) {
      const texture = textureUnits[texUnit].get(target);
      if (!texture) {
        return `no texture bound to texture unit ${texUnit} ${target}`;
      }
      const textureInfo = textureToTextureInfoMap.get(texture);
      const {mips, parameters} = textureInfo;
      const baseLevel = parameters.get(TEXTURE_BASE_LEVEL) || 0;
      const baseLevelFaces = mips[baseLevel];
      if (!baseLevelFaces) {
        return `no mip level ${baseLevel}`;
      }
      const baseMipFace = baseLevelFaces[0];
      if (!baseMipFace) {
        return `TEXTURE_CUBE_MAP_POSITIVE_X face at mip level ${baseLevel} does not exist`;
      }
      const textureNumberType = getNumberTypeForInternalFormat(baseMipFace.internalFormat);
      const neededNumberType = getNumberTypeForUniformSamplerType(uniformType);
      if (textureNumberType !== neededNumberType) {
        return `uniform ${getUniformTypeForUniformSamplerType(uniformType)} needs a ${neededNumberType} texture but ${getWebGLObjectString(texture)} on texture unit ${texUnit} is ${textureNumberType} texture (${getInternalFormatStringForTextureInfo(textureInfo)})`;
      }
      const sampler = textureUnits[texUnit].get('SAMPLER');
      if (sampler) {
        const parameters = samplerToParametersMap.get(sampler);
        const reason = computeRenderability(textureInfo, parameters);
        return reason
           ? `${reason} with sampler ${getWebGLObjectString(sampler)} bound to texture unit ${texUnit}`
           : reason;
      } else {
        return textureInfo.notRenderable;
      }
    };

    function setMipFaceInfoForTarget(target, level, internalFormat, width, height, depth, type = 0) {
      const internalFormatString = getInternalFormatStringForInternalFormatType(internalFormat, type);
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

      deleteTexture(ctx, funcName, args) {
        const [texture] = args;
        const {type} = textureToTextureInfoMap.get(texture);
        textureToTextureInfoMap.delete(texture);
        removeFromTextureUnits(type, texture);
      },

      createSampler(ctx, funcName, args, sampler) {
        samplerToParametersMap.set(sampler, new Map());
      },

      deleteSampler(ctx, funcName, args) {
        const [sampler] = args;
        samplerToParametersMap.delete(sampler);
        removeFromTextureUnits('SAMPLER', sampler);
      },

      bindSampler(ctx, funcName, args) {
        const [unit, sampler] = args;
        textureUnits[unit].set('SAMPLER', sampler);
      },

      samplerParameteri(ctx, funcName, args) {
        const [sampler, pname, value] = args;
        const parameters = samplerToParametersMap.get(sampler);
        parameters.set(pname, value);
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
          if (target === TEXTURE_3D) {
            d = Math.max(1, (d / 2) | 0);
          }
        }
      },

      generateMipmap(ctx, funcName, args) {
        const [target] = args;
        const textureInfo = getTextureInfoForTarget(target);
        const {parameters} = textureInfo;
        const baseLevel = parameters.get(TEXTURE_BASE_LEVEL) || 0;
        const maxLevel = parameters.get(TEXTURE_MAX_LEVEL) || maxMips;
        const mipInfo = getMipInfoForTarget(target, baseLevel);
        const {width, height, depth, internalFormat, type} = mipInfo;
        const numMipsNeeded = Math.min(computeNumMipsNeeded(width, height, depth), (maxLevel + 1) - baseLevel);
        const numFaces = target === TEXTURE_CUBE_MAP ? 6 : 1;
        let w = width;
        let h = height;
        let d = depth;
        for (let level = 0; level < numMipsNeeded; ++level) {
          w = Math.max(1, (w / 2) | 0);
          h = Math.max(1, (h / 2) | 0);
          // If it's not TEXTURE_2D it's TEXTURE_2D_ARRAY
          if (target === TEXTURE_3D) {
            d = Math.max(1, (d / 2) | 0);
          }
          for (let face = 0; face < numFaces; ++face) {
            const faceTarget =  target === TEXTURE_CUBE_MAP
               ? TEXTURE_CUBE_MAP_POSITIVE_X + face
               : target;
            setMipFaceInfoForTarget(faceTarget, baseLevel + level, internalFormat, w, h, d, type);
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