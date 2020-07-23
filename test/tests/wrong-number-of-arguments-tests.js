import {gl} from '../shared.js';

export default [
  {
    desc: 'test wrong number of args',
    expect: [/'enable'.*?2 arguments/],
    func() {
      gl.enable(gl.DEPTH_TEST, 0);  // wrong number of args
    },
  },
  
];