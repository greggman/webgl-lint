/* global console */

export const config = {};

export function setConfig(options) {
  Object.assign(config, options);
}

function formatMsg(msg) {
  return `${msg}${msg ? ': ' : ''}`;
}

export function assertEqual(actual, expected, msg = '') {
  if (!config.noLint && actual !== expected) {
    throw new Error(`${formatMsg(msg)}expected: ${expected} to no equal actual: ${actual}`);
  }
}

export function assertNotEqual(actual, expected, msg = '') {
  if (!config.noLint && actual === expected) {
    throw new Error(`${formatMsg(msg)}expected: ${expected} to no equal actual: ${actual}`);
  }
}

export function assertThrowsWith(func, expectations, msg = '') {
  let error = '';
  if (config.throwOnError === false) {
    const origFn = console.error;
    const errors = [];
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

  if (config.noLint) {
    return;
  }

  const actualNoBreaks = error.toString().replace(/\n/g, ' ');
  for (const expectation of expectations) {
    if (expectation instanceof RegExp) {
      if (!expectation.test(actualNoBreaks)) {
        throw new Error(`${formatMsg(msg)}expected: ${expectation}, actual: ${error}`);
      }
    }
  }
}

// check if it throws it throws with x
export function assertIfThrowsItThrowsWith(func, expectations, msg = '') {
  let error = '';
  let threw = false;
  if (config.throwOnError === false) {
    const origFn = console.error;
    const errors = [];
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
      threw = true;
    }

  }

  if (config.noLint) {
    return;
  }

  if (!threw) {
    return;
  }

  const actualNoBreaks = error.toString().replace(/\n/g, ' ');
  for (const expectation of expectations) {
    if (expectation instanceof RegExp) {
      if (!expectation.test(actualNoBreaks)) {
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