/* global console */
/* global document */

export const config = {};
document.querySelectorAll('[data-gman-debug-helper]').forEach(elem => {
  Object.assign(config, JSON.parse(elem.dataset.gmanDebugHelper));
});

function formatMsg(msg) {
  return `${msg}${msg ? ': ' : ''}`;
}

export function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${formatMsg(msg)}expected: ${expected} to no equal actual: ${actual}`);
  }
}

export function assertNotEqual(actual, expected, msg = '') {
  if (actual === expected) {
    throw new Error(`${formatMsg(msg)}expected: ${expected} to no equal actual: ${actual}`);
  }
}

export function assertThrowsWith(func, expectations, msg = '') {
  let error;
  if (config.throwOnError === false) {
    const origFn = console.error;
    let errors = [];
    console.error = function(...args) {
      errors.push(args.join(' '));
    };
    func();
    console.error = origFn;
    if (errors.length) {
      error = errors.join('\n');
      console.error(error);
    }
  } else {
    try {
      func();
    } catch (e) {
      console.error(e);  // eslint-disable-line
      error = e;
    }

  }
  for (const expectation of expectations) {
    if (expectation instanceof RegExp) {
      if (!expectation.test(error)) {
        throw new Error(`${formatMsg(msg)}expected: ${expectation}, actual: ${error}`);
      }
    }
  }
}

export default {
  equal: assertEqual,
  notEqual: assertNotEqual,
  throwsWith: assertThrowsWith,
};