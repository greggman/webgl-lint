import {getBindPointForTarget} from './samplers.js';
import {glEnumToString, isWebGL2} from './utils.js';

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

const unsizedInternalFormats = new Set([
  ALPHA,
  LUMINANCE,
  LUMINANCE_ALPHA,
  RGB,
  RGBA,
]);

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

export class TextureManager {
  constructor(gl) {
    const needPOT = !isWebGL2(gl);
    const textureToTextureInfoMap = new Map();
    const samplerToParametersMap = new Map();
    const textureUnits = createTextureUnits(gl);
    let activeTextureUnitIndex = 0;
    let activeTextureUnit = textureUnits[0];
    this.numTextureUnits = textureUnits.length;

    function recomputeRenderability(textureInfo) {
      textureInfo.notRenderable = computeRenderability(textureInfo, textureInfo.parameters);
    }

    function computeRenderability(textureInfo, parameters) {
      const {type, mips} = textureInfo;
      const level0Faces = mips[0];
      if (!level0Faces) {
        return 'no mip level 0';
      }
      const mipFace0 = level0Faces[0];
      if (!mipFace0) {
        return 'TEXTURE_CUBE_MAP_POSITIVE_X face does not exist';
      }
      const {width: level0Width, height: level0Height, depth: level0Depth, internalFormatString: level0InternalFormatString} = mipFace0;
      const numFaces = type === TEXTURE_CUBE_MAP ? 6 : 1;
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
            return `filtering is set to use mips (TEXTURE_MIN_FILTER = ${glEnumToString(minFilter)}) but mip level ${mipLevel} does not exist`;
          }
          for (let face = 0; face < numFaces; ++face) {
            const mip = faceMips[face];
            if (!mip) {
              return `filtering is set to use mips (TEXTURE_MIN_FILTER = ${glEnumToString(minFilter)}) but mip level ${mipLevel}${getFaceTarget(face, type)} does not exist`;
            }
            if (mip.width !== mipWidth ||
                mip.height !== mipHeight ||
                mip.depth !== mipDepth) {
              return `mip level ${mipLevel}${getFaceTarget(face, type)} needs to be ${mipWidth}x${mipHeight}x${mipDepth} but it is ${mip.width}x${mip.height}x${mip.depth}`;
            }
            if (mip.internalFormatString !== level0InternalFormatString) {
              return `mip level ${mipLevel}${getFaceTarget(face, type)}'s internal format ${mip.internalFormatString} does not match mip level 0's internal format ${level0InternalFormatString}`;
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
        if (!isPowerOf2(level0Width) || !isPowerOf2(level0Height)) {
          if (numMipsNeeded > 1) {
            return `texture's ${getNPotIssues(level0Width, level0Height)} but TEXTURE_MIN_FILTER (${glEnumToString(minFilter)}) is set to need mips`;
          }
          const wrapS = parameters.get(TEXTURE_WRAP_S);
          const wrapT = parameters.get(TEXTURE_WRAP_T);
          if (wrapS !== CLAMP_TO_EDGE || wrapT !== CLAMP_TO_EDGE) {
            return `texture's ${getNPotIssues(level0Width, level0Height)} but ${getClampToEdgeIssues(wrapS, wrapT)}.`;
          }
        }
      }

      if (type === TEXTURE_CUBE_MAP) {
        if (level0Width !== level0Height) {
          return `texture is CUBE_MAP but dimensions ${level0Width}x${level0Height} are not square`;
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

    this.getTextureForTextureUnit = function(texUnit, target) {

      return textureUnits[texUnit].get(target);
    };

    this.getTextureUnitUnrenderableReason = function(texUnit, target, getWebGLObjectString) {
      const texture = textureUnits[texUnit].get(target);
      if (!texture) {
        return `no texture bound to texture unit ${texUnit} ${target}`;
      }
      const textureInfo = textureToTextureInfoMap.get(texture);
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
        const {width, height, depth, internalFormat, type} = getMipInfoForTarget(target, 0);
        const numMipsNeeded = computeNumMipsNeeded(width, height, depth);
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