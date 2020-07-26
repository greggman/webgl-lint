import {gl} from '../shared.js';
import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';

describe('extension enum test', () => {

  it('test extension enums', () => {
    const ext = gl.getExtension('OES_standard_derivatives');
    if (!ext) {
      throw new Error('FRAGMENT_SHADER_DERIVATIVE_HINT_OES');
    }
    assertThrowsWith(() => {
      gl.enable(ext.FRAGMENT_SHADER_DERIVATIVE_HINT_OES);
    }, [/FRAGMENT_SHADER_DERIVATIVE_HINT_OES/]);
  });

});