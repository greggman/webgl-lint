/* eslint-env browser */
/* global WeakRef */
import './webgl-lint.js';

const glContextRefs = [];
HTMLCanvasElement.prototype.getContext = (function(origFn) {
  return function(contextType, ...args) {
    const ctx = origFn.call(this, contextType, ...args);
    if (ctx && (contextType === 'webgl' || contextType === 'webgl2')) {
      if (glContextRefs.findIndex(ref => ref.deref() === ctx) < 0) {
        const ext = ctx.getExtension('GMAN_debug_helper');
        ext.setConfiguration({maxDrawCalls: 0});
        glContextRefs.push({ref: new WeakRef(ctx), ext});
      }
    }
    return ctx;
  };
})(HTMLCanvasElement.prototype.getContext);

window.requestAnimationFrame = (function(origFn) {
  return function(fn) {
    return origFn.call(this, (time) => {
      // add up all calls across contexts since we have no idea which contexts will render
      // Note: You could call getAndResetRedundantCallInfo yourself for your own context.
      const sums = {};

      const refs = glContextRefs.filter(({ref}) => ref.deref());
      glContextRefs.length = 0;
      glContextRefs.push(...refs);

      for (const {ext} of glContextRefs) {
        const info = ext.getAndResetRedundantCallInfo();
        for (const [key, value] of Object.entries(info)) {
          sums[key] = (sums[key] || 0) + value;
        }
      }
      console.log('rc:', JSON.stringify(sums));
      fn(time);
    });
  };
})(window.requestAnimationFrame);