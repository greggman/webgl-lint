import {
  getAttributeTypeInfo,
  getBytesPerValueForGLType,
  getDrawFunctionArgs,
  glEnumToString,
  glTypeToTypedArray,
  isWebGL2,
  isBuiltIn,
} from './utils.js';

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
    errors.push(`offset: ${startOffset} and count: ${vertCount} with index type: ${glEnumToString(gl, indexType)} passed to ${funcName} are out of range for current ELEMENT_ARRAY_BUFFER.
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


export function checkAttributesForBufferOverflow(gl, funcName, args, getWebGLObjectString, getIndicesForBuffer) {
  const {vertCount, startOffset, indexType, instances} = getDrawFunctionArgs(funcName, args);
  if (vertCount <= 0 || instances <= 0) {
    return [];
  }
  const program = gl.getParameter(gl.CURRENT_PROGRAM);
  const errors = [];
  const nonInstancedLastIndex = indexType
      ? getLastUsedIndexForDrawElements(gl, funcName, startOffset, vertCount, instances, indexType, getWebGLObjectString, getIndicesForBuffer, errors)
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
attribute size: ${numComponents}, type: ${glEnumToString(gl, type)}, stride: ${specifiedStride}, offset: ${offset}, divisor: ${divisor}
needs ${sizeNeeded} bytes for draw but buffer is only ${bufferSize} bytes`);
      }
    }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, oldArrayBuffer);
  return errors;
}

