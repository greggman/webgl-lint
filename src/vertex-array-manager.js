import {
  createWeakRef,
  isObjectRefEqual,
} from './utils.js';

class VertexArray {
  constructor(numAttribs) {
    this.elementAttribArray = null;
    this.attribs = [];
    for (let i = 0; i < numAttribs; ++i) {
      this.attribs.push({
        size: 0,
        type: 0,
        normalize: false,
        stride: 0,
        offset: 0,
        divisor: 0,
        buffer: null,
        iPointer: false,
      });
    }
  }
  setElementArrayBuffer(redundantStateSetting, buffer) {
    if (isObjectRefEqual(this.elementAttribArray, buffer)) {
      ++redundantStateSetting.bindBuffer;
    } else {
      this.elementAttribArray = createWeakRef(buffer);
    }
  }
  setAttrib(redundantStateSetting, iPointer, index, size, type, normalize, stride, offset, buffer) {
    const attrib = this.attribs[index];
    if (isObjectRefEqual(attrib.buffer, buffer) &&
        attrib.iPointer === iPointer &&
        attrib.size === size &&
        attrib.type === type &&
        attrib.normalize === normalize &&
        attrib.stride === stride &&
        attrib.offset === offset) {
      ++redundantStateSetting.vertexAttribPointer;
    } else {
      Object.assign(attrib, {
        iPointer, size, type, normalize, stride, offset, buffer: createWeakRef(buffer),
      });
    }
  }
}

export class VertexArrayManager {
  constructor(gl, redundantStateSetting) {
    this.redundantStateSetting = redundantStateSetting;
    this.numAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    this.vertexArrays = new WeakMap();
    this.defaultVertexArray = new VertexArray(this.numAttribs);
    this.currentVertexArray = this.defaultVertexArray;

    const createVertexArray = (ctx, funcName, args, obj) => {
      this.vertexArrays.set(obj, new VertexArray(this.numAttribs));
    };

    const deleteVertexArray = (ctx, funcName, args) => {
      const [obj] = args;
      const vertexArray = this.vertexArrays.get(obj);
      if (this.currentVertexArray === vertexArray) {
        this.currentVertexArray = this.defaultVertexArray;
      }
      this.vertexArrays.delete(obj);
    };

    const bindVertexArray = (ctx, funcName, args) => {
      let [vertexArray] = args;
      vertexArray = vertexArray ? this.vertexArrays.get(vertexArray) : this.defaultVertexArray;
      if (vertexArray === this.currentVertexArray) {
        ++this.redundantStateSetting.bindVertexArray;
      } else {
        this.currentVertexArray = vertexArray;
      }
    };

    this.postChecks = {
      createVertexArray,
      createVertexArrayOES: createVertexArray,
      bindVertexArray,
      bindVertexArrayOES: bindVertexArray,
      bindBuffer: (ctx, funcName, args) => {
        const [target, buffer] = args;
        if (target === gl.ELEMENT_ARRAY_BUFFER) {
          this.currentVertexArray.setElementArrayBuffer(this.redundantStateSetting, buffer);
        }
      },
      deleteVertexArray,
      deleteVertexArrayOES: deleteVertexArray,
      vertexAttribPointer: (ctx, funcName, args) => {
        const [index, size, type, normalize, stride, offset] = args;
        this.currentVertexArray.setAttrib(this.redundantStateSetting, false, index, size, type, normalize, stride, offset, ctx.getParameter(gl.ARRAY_BUFFER_BINDING));
      },
      vertexAttribIPointer: (ctx, funcName, args) => {
        const [index, size, type, stride, offset] = args;
        this.currentVertexArray.setAttrib(this.redundantStateSetting, true, index, size, type, false, stride, offset, ctx.getParameter(gl.ARRAY_BUFFER_BINDING));
      }
    };
  }
}