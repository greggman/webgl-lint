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

import {checkAttributesForBufferOverflow} from './check-attributes-buffer-overflow.js';
import {checkFramebufferFeedback} from './check-framebuffer-feedback.js';
import {parseStack} from './parse-stack.js';
import {
  getBindPointForSampler,
  getUniformTypeForUniformSamplerType,
  uniformTypeIsSampler,
} from './samplers.js';
import {TextureManager} from './texture-manager.js';
import {
  addEnumsFromAPI,
  enumArrayToString,
  getBindingQueryEnumForBindPoint,
  getDrawFunctionArgs,
  getUniformTypeInfo,
  glEnumToString,
  isArrayThatCanHaveBadValues,
  isBuiltIn,
  isDrawFunction,
  isTypedArray,
  makeBitFieldToStringFunc,
  quotedStringOrEmpty,
} from './utils.js';

/* global console */
/* global WebGL2RenderingContext */
/* global WebGLUniformLocation */
/* global EventTarget */

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

function throwIfNotWebGLObject(webglObject) {
  // There's no easy way to check if it's a WebGLObject
  // and I guess we mostly don't care but a minor check is probably
  // okay
  if (Array.isArray(webglObject) || isTypedArray(webglObject) || typeof webglObject !== 'object') {
    throw new Error('not a WebGLObject');
  }
}

const augmentedSet = new Set();

/**
 * Given a WebGL context replaces all the functions with wrapped functions
 * that call gl.getError after every command
 *
 * @param {WebGLRenderingContext|Extension} ctx The webgl context to wrap.
 * @param {string} nameOfClass (eg, webgl, webgl2, OES_texture_float)
 */
export function augmentAPI(ctx, nameOfClass, options = {}) {

  if (augmentedSet.has(ctx)) {
    return ctx;
  }
  augmentedSet.add(ctx);

  const origGLErrorFn = options.origGLErrorFn || ctx.getError;
  addEnumsFromAPI(ctx);

  const tagObject = function(webglObject, name) {
    throwIfNotWebGLObject(webglObject);
    sharedState.webglObjectToNamesMap.set(webglObject, name);
  };

  const untagObject = function(webglObject) {
    throwIfNotWebGLObject(webglObject);
    sharedState.webglObjectToNamesMap.delete(webglObject);
  };

  const getTagForObject = function(webglObject) {
    return sharedState.webglObjectToNamesMap.get(webglObject);
  };

  const setConfiguration = function(config) {
    for (const [key, value] of Object.entries(config)) {
      if (!(key in sharedState.config)) {
        throw new Error(`unknown configuration option: ${key}`);
      }
      sharedState.config[key] = value;
    }
    for (const name of sharedState.config.ignoreUniforms) {
      sharedState.ignoredUniforms.add(name);
    }
  };

  function createSharedState(ctx) {
    const eventTarget = new EventTarget();
    const sharedState = {
      baseContext: ctx,
      config: options,
      eventTarget,
      debugGroupStack: [
        {source: 'root', id: 0, message: ''},
      ],
      apis: {
        gman_debug_helper: {
          ctx: {
            tagObject,
            untagObject,
            getTagForObject,
            disable() {
              removeChecks();
            },
            setConfiguration,
          },
        },
        webgl_debug: {
          ctx: {
            MAX_DEBUG_MESSAGE_LENGTH_KHR: 0x9143,
            MAX_DEBUG_GROUP_STACK_DEPTH_KHR: 0x826C,
            DEBUG_GROUP_STACK_DEPTH_KHR: 0x826D,
            MAX_LABEL_LENGTH_KHR: 0x82E8,

            DEBUG_SOURCE_API_KHR: 0x8246,
            DEBUG_SOURCE_WINDOW_SYSTEM_KHR: 0x8247,
            DEBUG_SOURCE_SHADER_COMPILER_KHR: 0x8248,
            DEBUG_SOURCE_THIRD_PARTY_KHR: 0x8249,
            DEBUG_SOURCE_APPLICATION_KHR: 0x824A,
            DEBUG_SOURCE_OTHER_KHR: 0x824B,

            DEBUG_TYPE_ERROR_KHR: 0x824C,
            DEBUG_TYPE_DEPRECATED_BEHAVIOR_KHR: 0x824D,
            DEBUG_TYPE_UNDEFINED_BEHAVIOR_KHR: 0x824E,
            DEBUG_TYPE_PORTABILITY_KHR: 0x824F,
            DEBUG_TYPE_PERFORMANCE_KHR: 0x8250,
            DEBUG_TYPE_OTHER_KHR: 0x8251,
            DEBUG_TYPE_MARKER_KHR: 0x8268,

            DEBUG_TYPE_PUSH_GROUP_KHR: 0x8269,
            DEBUG_TYPE_POP_GROUP_KHR: 0x826A,

            DEBUG_SEVERITY_HIGH_KHR: 0x9146,
            DEBUG_SEVERITY_MEDIUM_KHR: 0x9147,
            DEBUG_SEVERITY_LOW_KHR: 0x9148,
            DEBUG_SEVERITY_NOTIFICATION_KHR: 0x826B,

            STACK_UNDERFLOW_KHR: 0x0504,
            STACK_OVERFLOW_KHR: 0x0503,

            //debugMessageControlKHR(GLenum source, GLenum type, GLenum severity, sequence<GLuint> ids, boolean enabled) {
            debugMessageControlKHR(source, type, severity, ids, enabled) {

            },
            //debugMessageInsertKHR(GLenum source, GLenum type, GLuint id, GLenum severity, DOMString buf);
            debugMessageInsertKHR(source, type, id, severity, buf) {

            },
            //pushDebugGroupKHR(GLenum source, GLuint id, DOMString message) {
            pushDebugGroupKHR(source, id, message) {
              sharedState.debugGroupStack.push({source, id, message});
            },
            popDebugGroupKHR() {
              if (sharedState.debugGroupStack.length > 1) {
                sharedState.debugGroupStack.pop();
              } else {
                // ERROR: STACK_UNDERFLOW_KHR
              }
            },
            objectLabelKHR: tagObject,
            getObjectLabelKHR: getTagForObject,
            addEventListener: eventTarget.addEventListener.bind(eventTarget),
            removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
            dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
          },
        },
      },
      idCounts: {},
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

  const {
    apis,
    baseContext,
    bufferToIndices,
    config,
    ignoredUniforms,
    locationsToNamesMap,
    programToLocationsMap,
    programToUniformInfoMap,
    programToUniformSamplerValues,
    programToUnsetUniformsMap,
    textureManager,
    webglObjectToNamesMap,
    idCounts,
  } = sharedState;

  const extensionFuncs = {
    oes_texture_float(...args) {
      textureManager.addExtension(...args);
    },
    oes_texture_float_linear(...args) {
      textureManager.addExtension(...args);
    },
    OES_texture_half_float(...args) {
      textureManager.addExtension(...args);
    },
    oes_texture_half_float_linear(...args) {
      textureManager.addExtension(...args);
    },
  };
  (extensionFuncs[nameOfClass] || noop)(nameOfClass);

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
    'transformFeedbackVaryings': { 3: {enums: [2]}}, // WebGL2
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
    const oldLocations = programToLocationsMap.get(program);
    if (oldLocations) {
      oldLocations.forEach(loc => locationsToNamesMap.delete(loc));
    }
    programToLocationsMap.set(program, new Set());
    programToUnsetUniformsMap.delete(program);
    programToUniformInfoMap.delete(program);
    programToUniformSamplerValues.delete(program);
  }

  function removeChecks() {
    for (const {ctx, origFuncs} of Object.values(apis)) {
      Object.assign(ctx, origFuncs);
      augmentedSet.delete(ctx);
    }
    for (const key of [...Object.keys(sharedState)]) {
      delete sharedState[key];
    }
  }

  function checkMaxDrawCallsAndZeroCount(gl, funcName, args) {
    const {vertCount, instances} = getDrawFunctionArgs(funcName, args);
    if (vertCount === 0) {
      console.warn(generateFunctionError(gl, funcName, args, `count for ${funcName} is 0!`));
    }

    if (instances === 0) {
      console.warn(generateFunctionError(gl, funcName, args, `instanceCount for ${funcName} is 0!`));
    }

    --config.maxDrawCalls;
    if (config.maxDrawCalls === 0) {
      removeChecks();
    }
  }

  function noop() {
  }

  function makeCreatePostCheck(typeName) {
    return function(gl, funcName, args, obj) {
      if (config.makeDefaultTags) {
        const id = (idCounts[typeName] || 0) + 1;
        idCounts[typeName] = id;
        webglObjectToNamesMap.set(obj, `*UNTAGGED:${typeName}${id}*`);
      }
    };
  }

  function reportError(errorMsg) {
    const errorInfo = parseStack((new Error()).stack);
    const msg = errorInfo
        ? `${errorInfo.url}:${errorInfo.lineNo}: ${errorMsg}`
        : errorMsg;
    if (config.throwOnError) {
      throw new Error(msg);
    } else {
      console.error(msg);
    }
  }

  function throwOrWarn(throws, warns, msg) {
    if (throws) {
      reportError(msg);
    } else if (warns) {
      console.warn(msg);
    }
  }

  // I know ths is not a full check
  function isNumber(v) {
    return typeof v === 'number';
  }

  const VERTEX_ARRAY_BINDING = 0x85B5;

  function getCurrentVertexArray() {
    const gl = baseContext;
    return (
       (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) ||
       apis.oes_vertex_array_object)
       ? gl.getParameter(VERTEX_ARRAY_BINDING)
       : null;
  }

  function checkUnsetUniforms(ctx, funcName, args) {
    if (!config.failUnsetUniforms) {
      return;
    }
    const unsetUniforms = programToUnsetUniformsMap.get(sharedState.currentProgram);
    if (unsetUniforms) {
      const uniformNames = [];
      for (const [name, {index, unset}] of unsetUniforms) {
        if (unset.has(index)) {
          uniformNames.push(name);
        }
      }
      reportFunctionError(ctx, funcName, args, `uniforms "${uniformNames.join('", "')}" have not been set\nSee docs at https://github.com/greggman/webgl-lint/ for how to turn off this check using "failUnsetUniforms": false`);
    }
  }

  function getUniformElementName(name, size, index) {
    return (size > 1 || index > 1)
       ? `${name}[${index}]`
       : name;
  }

  function checkUnRenderableTextures(ctx, funcName, args) {
    if (!config.failUnrenderableTextures) {
      return;
    }
    const uniformSamplerInfos = programToUniformSamplerValues.get(sharedState.currentProgram);
    const numTextureUnits = textureManager.numTextureUnits;
    for (const {type, values, name} of uniformSamplerInfos) {
      const bindPoint = getBindPointForSampler(type);
      for (let i = 0; i < values.length; ++i) {
        const texUnit = values[i];
        if (texUnit >= numTextureUnits) {
          reportFunctionError(ctx, funcName, args, `uniform ${getUniformTypeInfo(type).name} ${getUniformElementName(name, values.length, i)} is set to ${texUnit} which is out of range. There are only ${numTextureUnits} texture units`);
          return;
        }
        const unrenderableReason = textureManager.getTextureUnitUnrenderableReason(type, texUnit, bindPoint, getWebGLObjectString);
        if (unrenderableReason) {
          // TODO:
          //   * is the type of texture compatible with the sampler?
          //     int textures for int samplers, unsigned for unsigned.
          //   *
          const texture = textureManager.getTextureForTextureUnit(texUnit, bindPoint);
          reportFunctionError(
              ctx,
              funcName,
              args,
              texture
                  ? `texture ${getWebGLObjectString(texture)} on texture unit ${texUnit} referenced by uniform ${getUniformTypeForUniformSamplerType(type)} ${getUniformElementName(name, values.length, i)} is not renderable: ${unrenderableReason}`
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
    if (!webGLUniformLocation) {
      throwOrWarn(config.failUndefinedUniforms, config.warnUndefinedUniforms, `attempt to set non-existent uniform on ${getWebGLObjectString(sharedState.currentProgram)}\nSee docs at https://github.com/greggman/webgl-lint/ for how to turn off this check using "warnUndefinedUniforms: false"`);
      return;
    }
    const unsetUniforms = programToUnsetUniformsMap.get(sharedState.currentProgram);
    if (!unsetUniforms) {
      // no unset uniforms
      return;
    }
    const uniformName = locationsToNamesMap.get(webGLUniformLocation);
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
        programToUnsetUniformsMap.delete(sharedState.currentProgram);
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

  function isUniformNameIgnored(name) {
    return ignoredUniforms.has(name);
  }

  function isUniformIgnored(webglUniformLocation) {
    return isUniformNameIgnored(locationsToNamesMap.get(webglUniformLocation));
  }

  function markUniformSetMatrixV(numValuesPer) {
    return function(gl, funcName, args) {
      const [webGLUniformLocation, transpose, data, srcOffset = 0, srcLength = 0] = args;
      const length = srcLength ? srcLength : data.length - srcOffset;
      const count = length / numValuesPer | 0;
      if (config.failZeroMatrixUniforms && !isUniformIgnored(webGLUniformLocation)) {
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
            reportFunctionError(gl, funcName, [webGLUniformLocation, transpose, ...args], 'matrix is all zeros\nSee docs at https://github.com/greggman/webgl-lint/ for how to turn off this check using "failZeroMatrixUniforms": false');
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
    const name = locationsToNamesMap.get(webglUniformLocation);
    const uniformInfos = programToUniformInfoMap.get(sharedState.currentProgram);
    const {index, type, values} = uniformInfos.get(name);
    if (!uniformTypeIsSampler(type)) {
      return;
    }
    const numToCopy = Math.min(newValues.length, values.length - index);
    for (let i = 0; i < numToCopy; ++i) {
      values[i] = newValues[i];
    }
  }

  function makeDeleteWrapper(ctx, funcName, args) {
    const [obj] = args;
    webglObjectToNamesMap.delete(obj);
  }

  const errorRE = /ERROR:\s*\d+:(\d+)/gi;
  function addLineNumbersWithError(src, log = '') {
    // Note: Error message formats are not defined by any spec so this may or may not work.
    const matches = [...log.matchAll(errorRE)];
    const lineNoToErrorMap = new Map(matches.map((m, ndx) => {
      const lineNo = parseInt(m[1]);
      const next = matches[ndx + 1];
      const end = next ? next.index : log.length;
      const msg = log.substring(m.index, end);
      return [lineNo - 1, msg];
    }));
    return src.split('\n').map((line, lineNo) => {
      const err = lineNoToErrorMap.get(lineNo);
      return `${lineNo + 1}: ${line}${err ? `\n\n^^^ ${err}` : ''}`;
    }).join('\n');
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
        bufferToIndices.set(buffer, new ArrayBuffer(src));
      } else {
        const isDataView = src instanceof DataView;
        const copyLength = length ? length : isDataView
           ? src.byteLength - srcOffset
           : src.length - srcOffset;
        const elemSize = isDataView ? 1 : src.BYTES_PER_ELEMENT;
        const bufSize = copyLength * elemSize;
        const arrayBuffer = src.buffer ? src.buffer : src;
        const viewOffset = src.byteOffset || 0;
        bufferToIndices.set(buffer, arrayBuffer.slice(viewOffset + srcOffset * elemSize, bufSize));
      }
    },
    // WebGL1
    //   void bufferSubData(GLenum target, GLintptr dstByteOffset, [AllowShared] BufferSource srcData);
    // WebGL2
    //   void bufferSubData(GLenum target, GLintptr dstByteOffset, [AllowShared] ArrayBufferView srcData,
    //                      GLuint srcOffset, optional GLuint length = 0);
    bufferSubData(gl, funcName, args) {
      const [target, dstByteOffset, src, srcOffset = 0, length = 0] = args;
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
      const viewOffset = src.byteOffset || 0;
      const newView = new Uint8Array(arrayBuffer, viewOffset + srcOffset * elemSize, copySize);
      view.set(newView, dstByteOffset);
    },

    compileShader(gl, funcName, args) {
      if (!config.failBadShadersAndPrograms) {
        return;
      }
      const [shader] = args;
      const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        const log = gl.getShaderInfoLog(shader);
        const src = addLineNumbersWithError(gl.getShaderSource(shader), log);
        const type = gl.getShaderParameter(shader, gl.SHADER_TYPE);
        const msg = `failed to compile ${glEnumToString(type)}: ${log}\n------[ shader source ]------\n${src}`;
        reportFunctionError(gl, funcName, args, msg);
      }
    },

    createBuffer: makeCreatePostCheck('Buffer'),
    createFramebuffer: makeCreatePostCheck('Framebuffer'),
    createProgram: makeCreatePostCheck('Program'),
    createQuery: makeCreatePostCheck('Query'),
    createRenderbuffer: makeCreatePostCheck('Renderbuffer'),
    createShader: makeCreatePostCheck('Shader'),
    createTexture: makeCreatePostCheck('Texture'),
    createTransformFeedback: makeCreatePostCheck('TransformFeedback'),
    createSampler: makeCreatePostCheck('Sampler'),
    createVertexArray: makeCreatePostCheck('VertexArray'),
    createVertexArrayOES: makeCreatePostCheck('VertexArray'),

    drawArrays: checkMaxDrawCallsAndZeroCount,
    drawElements: checkMaxDrawCallsAndZeroCount,
    drawArraysInstanced: checkMaxDrawCallsAndZeroCount,
    drawElementsInstanced: checkMaxDrawCallsAndZeroCount,
    drawArraysInstancedANGLE: checkMaxDrawCallsAndZeroCount,
    drawElementsInstancedANGLE: checkMaxDrawCallsAndZeroCount,
    drawRangeElements: checkMaxDrawCallsAndZeroCount,

    fenceSync: makeCreatePostCheck('Sync'),

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
        locationsToNamesMap.set(location, name);
        programToLocationsMap.get(program).add(location);
      } else {
        if (!isUniformNameIgnored(name)) {
          warnOrThrowFunctionError(
              ctx,
              funcName,
              args,
              `uniform '${name}' does not exist in ${getWebGLObjectString(program)}`,
              config.failUndefinedUniforms,
              config.warnUndefinedUniforms);
        }
      }
    },

    linkProgram(gl, funcName, args) {
      const [program] = args;
      const success = ctx.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        discardInfoForProgram(program);
        const unsetUniforms = new Map();
        const uniformInfos = new Map();
        const uniformSamplerValues = [];
        const numUniforms = ctx.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let ii = 0; ii < numUniforms; ++ii) {
          const {name, type, size} = ctx.getActiveUniform(program, ii);
          if (isBuiltIn(name)) {
            continue;
          }
          // skip uniform block uniforms
          const location = ctx.getUniformLocation(program, name);
          if (!location) {
            continue;
          }
          const altNames = new Map([[name, 0]]);
          const isArray = name.endsWith('[0]');
          let baseName = name;
          if (isArray) {
            baseName = name.substr(0, name.length - 3);
            altNames.set(baseName, 0);
          }
          if (size > 1) {
            for (let s = 0; s < size; ++s) {
              altNames.set(`${baseName}[${s}]`, s);
            }
          }

          const addUnsetUniform =
              (!uniformTypeIsSampler(type) || config.failUnsetSamplerUniforms)
              && !ignoredUniforms.has(name);

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
        programToUniformSamplerValues.set(program, uniformSamplerValues);
        programToUniformInfoMap.set(program, uniformInfos);
        if (unsetUniforms.size) {
          programToUnsetUniformsMap.set(program, unsetUniforms);
        }
      } else if (config.failBadShadersAndPrograms) {
        const shaders = gl.getAttachedShaders(program);
        const shaderMsgs = shaders.map(shader => {
          const src = addLineNumbersWithError(gl.getShaderSource(shader));
          const type = gl.getShaderParameter(shader, gl.SHADER_TYPE);
          return `-------[ ${glEnumToString(type)} ${getWebGLObjectString(shader)} ]-------\n${src}`;
        }).join('\n');
        const log = gl.getProgramInfoLog(program);
        const msg = `failed to link program: ${log}\n${shaderMsgs}`;
        reportFunctionError(gl, funcName, args, msg);
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
      bufferToIndices.delete(buffer);
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
  };
  Object.entries(textureManager.postChecks).forEach(([funcName, func]) => {
    const existingFn = postChecks[funcName] || noop;
    postChecks[funcName] = function(...args) {
      existingFn(...args);
      if (config.failUnrenderableTextures) {
        func(...args);
      }
    };
  });

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
    const name = webglObjectToNamesMap.get(webglObject) || '*unnamed*';
    return `${webglObject.constructor.name}(${quotedStringOrEmpty(name)})`;
  }

  function getIndicesForBuffer(buffer) {
    return bufferToIndices.get(buffer);
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
    const name = webglObjectToNamesMap.get(value);
    if (name) {
      return `${value.constructor.name}("${name}")`;
    }
    if (value instanceof WebGLUniformLocation) {
      const name = locationsToNamesMap.get(value);
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
    const uniformInfos = programToUniformInfoMap.get(sharedState.currentProgram);
    if (!uniformInfos) {
      return;
    }
    // The uniform info type might be 'vec3' but they
    // might be calling uniform2fv. WebGL itself will catch that error but we might
    // report the wrong error here if we check for vec3 amount of data
    const name = locationsToNamesMap.get(webglUniformLocation);
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
      } else if (isArrayLike(arg[i])) {
        reportFunctionError(ctx, funcName, args, `element ${i} of argument ${ndx} is an array. WebGL expects flat arrays`);
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

  function generateFunctionError(ctx, funcName, args, msg) {
    const gl = baseContext;
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
      const vao = getCurrentVertexArray(ctx);
      const name = webglObjectToNamesMap.get(vao);
      const vaoName = `WebGLVertexArrayObject(${quotedStringOrEmpty(name || '*unnamed*')})`;
      msgs.push(`with ${vao ? vaoName : 'the default vertex array'} bound`);
    }
    const stringifiedArgs = glFunctionArgsToString(ctx, funcName, args);
    return `error in ${funcName}(${stringifiedArgs}): ${msgs.join('\n')}`;
  }

  function warnOrThrowFunctionError(ctx, funcName, args, msg, throws, warns) {
    throwOrWarn(throws, warns, generateFunctionError(ctx, funcName, args, msg));
  }

  function reportFunctionError(ctx, funcName, args, msg) {
    reportError(generateFunctionError(ctx, funcName, args, msg));
  }

  const isArrayLike = a => Array.isArray(a) || isTypedArray(a);

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
        const api = apis[extensionName];
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
      if (sharedState.currentProgram && isDrawFunction(funcName)) {
        const msgs = checkAttributesForBufferOverflow(baseContext, funcName, args, getWebGLObjectString, getIndicesForBuffer);
        if (msgs.length) {
          reportFunctionError(ctx, funcName, args, msgs.join('\n'));
        }
      }
      const result = origFn.call(ctx, ...args);
      const gl = baseContext;
      const err = origGLErrorFn.call(gl);
      if (err !== 0) {
        glErrorShadow[err] = true;
        const msgs = [glEnumToString(err)];
        if (isDrawFunction(funcName)) {
          if (sharedState.currentProgram) {
            msgs.push(...checkFramebufferFeedback(gl, getWebGLObjectString));
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

  apis[nameOfClass.toLowerCase()] = { ctx, origFuncs };
}

