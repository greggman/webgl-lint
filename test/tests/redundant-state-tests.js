import * as twgl from '../js/twgl-full.module.js';
import {assertEqual} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';

describe('redundant state tests', () => {

  it('test bindBuffer', () => {
    const {gl, ext} = createContext();

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindBuffer, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindBuffer, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindBuffer, 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindBuffer, 1);

    const buf2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindBuffer, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test bindRenderbuffer', () => {
    const {gl, ext} = createContext();

    const buf = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindRenderbuffer, 0);
    gl.bindRenderbuffer(gl.RENDERBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindRenderbuffer, 1);
    gl.bindRenderbuffer(gl.RENDERBUFFER, buf);
    gl.bindRenderbuffer(gl.RENDERBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindRenderbuffer, 2);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindRenderbuffer, 1);

    const buf2 = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, buf);
    gl.bindRenderbuffer(gl.RENDERBUFFER, buf2);
    gl.bindRenderbuffer(gl.RENDERBUFFER, buf);
    gl.bindRenderbuffer(gl.RENDERBUFFER, buf2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindRenderbuffer, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test bindFramebuffer', () => {
    const {gl, ext} = createContext();

    const buf = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 1);

    const buf2 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });


  it('test bindFramebuffer', () => {
    const {gl, ext} = createContext();

    const buf = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 1);

    const buf2 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test bindFramebuffer WebGL2', () => {
    const {gl, ext} = createContext2();
    if (!gl) {
      return;
    }

    const buf = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 1);

    const buf2 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buf2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 0);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 1);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, buf);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, buf);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 1);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, buf2);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, buf2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindFramebuffer, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test useProgram', () => {
    const {gl, ext} = createContext();

    const vs = `void main() { gl_Position = vec4(0); }`;
    const fs = `precision mediump float; void main() { gl_FragColor = vec4(0); }`;

    const prg = twgl.createProgram(gl, [vs, fs]);
    const prg2 = twgl.createProgram(gl, [vs, fs]);

    gl.useProgram(prg);
    assertEqual(ext.getAndResetRedundantCallInfo().useProgram, 0);
    gl.useProgram(prg);
    assertEqual(ext.getAndResetRedundantCallInfo().useProgram, 1);
    gl.useProgram(prg);
    gl.useProgram(prg);
    assertEqual(ext.getAndResetRedundantCallInfo().useProgram, 2);
    gl.useProgram(null);
    gl.useProgram(null);
    assertEqual(ext.getAndResetRedundantCallInfo().useProgram, 1);

    gl.useProgram(prg);
    gl.useProgram(prg2);
    gl.useProgram(prg);
    gl.useProgram(prg2);
    assertEqual(ext.getAndResetRedundantCallInfo().useProgram, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test bindTexture', () => {
    const {gl, ext} = createContext();

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    assertEqual(ext.getAndResetRedundantCallInfo().bindTexture, 0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    assertEqual(ext.getAndResetRedundantCallInfo().bindTexture, 1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    assertEqual(ext.getAndResetRedundantCallInfo().bindTexture, 2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindTexture, 1);

    const tex2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindTexture, 0);

    const tex3 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex3);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex3);
    assertEqual(ext.getAndResetRedundantCallInfo().bindTexture, 2);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test bindSampler', () => {
    const {gl, ext} = createContext2();
    if (!gl) {
      return;
    }

    const sampler = gl.createSampler();
    gl.bindSampler(0, sampler);
    assertEqual(ext.getAndResetRedundantCallInfo().bindSampler, 0);
    gl.bindSampler(0, sampler);
    assertEqual(ext.getAndResetRedundantCallInfo().bindSampler, 1);
    gl.bindSampler(0, sampler);
    gl.bindSampler(0, sampler);
    assertEqual(ext.getAndResetRedundantCallInfo().bindSampler, 2);
    gl.bindSampler(0, null);
    gl.bindSampler(0, null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindSampler, 1);

    const sampler2 = gl.createSampler();
    gl.bindSampler(0, sampler);
    gl.bindSampler(0, sampler2);
    gl.bindSampler(0, sampler);
    gl.bindSampler(0, sampler2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindSampler, 0);

    gl.bindSampler(1, sampler);
    gl.bindSampler(1, sampler2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindSampler, 0);
    gl.bindSampler(1, sampler2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindSampler, 1);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test enable/disable', () => {
    const {gl, ext} = createContext();

    gl.disable(gl.BLEND);
    assertEqual(ext.getAndResetRedundantCallInfo().enableDisable, 1);
    gl.enable(gl.BLEND);
    assertEqual(ext.getAndResetRedundantCallInfo().enableDisable, 0);
    gl.enable(gl.BLEND);
    assertEqual(ext.getAndResetRedundantCallInfo().enableDisable, 1);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.DEPTH_TEST);
    assertEqual(ext.getAndResetRedundantCallInfo().enableDisable, 2);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.CULL_FACE);
    assertEqual(ext.getAndResetRedundantCallInfo().enableDisable, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test bindVertexArrayOES', () => {
    const {gl, ext, vaoExt} = createContext();
    if (!vaoExt) {
      return;
    }

    const va = vaoExt.createVertexArrayOES();
    const va2 = vaoExt.createVertexArrayOES();

    vaoExt.bindVertexArrayOES(va);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 0);
    vaoExt.bindVertexArrayOES(va);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 1);
    vaoExt.bindVertexArrayOES(va);
    vaoExt.bindVertexArrayOES(va);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 2);
    vaoExt.bindVertexArrayOES(null);
    vaoExt.bindVertexArrayOES(null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 1);

    vaoExt.bindVertexArrayOES(va);
    vaoExt.bindVertexArrayOES(va2);
    vaoExt.bindVertexArrayOES(va);
    vaoExt.bindVertexArrayOES(va2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test bindVertexArray', () => {
    const {gl, ext} = createContext2();
    if (!gl) {
      return;
    }

    const va = gl.createVertexArray();
    const va2 = gl.createVertexArray();

    gl.bindVertexArray(va);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 0);
    gl.bindVertexArray(va);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 1);
    gl.bindVertexArray(va);
    gl.bindVertexArray(va);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 2);
    gl.bindVertexArray(null);
    gl.bindVertexArray(null);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 1);

    gl.bindVertexArray(va);
    gl.bindVertexArray(va2);
    gl.bindVertexArray(va);
    gl.bindVertexArray(va2);
    assertEqual(ext.getAndResetRedundantCallInfo().bindVertexArray, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test vertexAttribPointer', () => {
    const {gl, ext} = createContext();

    const buf = gl.createBuffer();
    const buf2 = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribPointer(0, 3, gl.UNSIGNED_BYTE, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribPointer(0, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribPointer(0, 3, gl.UNSIGNED_BYTE, true, 4, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribPointer(0, 3, gl.UNSIGNED_BYTE, true, 4, 4);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    gl.vertexAttribPointer(0, 3, gl.UNSIGNED_BYTE, true, 4, 4);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');

  });

  it('test vertexAttribIPointer', () => {
    const {gl, ext} = createContext2();
    if (!gl) {
      return;
    }

    const buf = gl.createBuffer();
    const buf2 = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribIPointer(0, 4, gl.INT, 0, 0);
    gl.vertexAttribIPointer(0, 4, gl.INT, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 1);
    gl.vertexAttribIPointer(1, 4, gl.INT, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribIPointer(0, 3, gl.INT, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 4, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 4, 4);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 4, 4);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);
    // switch to non IPointer
    gl.vertexAttribPointer(0, 3, gl.UNSIGNED_BYTE, false, 4, 4);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');

  });

  it('test multiple vertexArrays OES', () => {
    const {gl, ext, vaoExt} = createContext();
    if (!vaoExt) {
      return;
    }

    const va = vaoExt.createVertexArrayOES();
    const va2 = vaoExt.createVertexArrayOES();

    vaoExt.bindVertexArrayOES(va);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);

    vaoExt.bindVertexArrayOES(va2);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);

    vaoExt.bindVertexArrayOES(va);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 1);

    vaoExt.bindVertexArrayOES(va2);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 1);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });

  it('test multiple vertexArrays WebGL2', () => {
    const {gl, ext} = createContext2();

    const va = gl.createVertexArray();
    const va2 = gl.createVertexArray();

    gl.bindVertexArray(va);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);

    gl.bindVertexArray(va2);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 0);

    gl.bindVertexArray(va);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 1);

    gl.bindVertexArray(va2);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    assertEqual(ext.getAndResetRedundantCallInfo().vertexAttribPointer, 1);

    assertEqual(gl.getError(), gl.NO_ERROR, 'no errors');
  });
});