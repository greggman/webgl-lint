import {gl} from '../shared.js';

export default [
  {
    desc: 'test extension enums',
    expect: [/FRAGMENT_SHADER_DERIVATIVE_HINT_OES/],
    func() {
      const ext = gl.getExtension('OES_standard_derivatives');
      if (!ext) {
        throw new Error('FRAGMENT_SHADER_DERIVATIVE_HINT_OES');
      }
      gl.enable(ext.FRAGMENT_SHADER_DERIVATIVE_HINT_OES);
    },
  },
];