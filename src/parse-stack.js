/* global navigator */

// adapted from http://stackoverflow.com/a/2401861/128511
function getBrowser() {
  const userAgent = navigator.userAgent;
  let m = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(m[1])) {
    m = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
    return {
      name: 'IE',
      version: m[1],
    };
  }
  if (m[1] === 'Chrome') {
    const temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
    if (temp) {
      return {
        name: temp[1].replace('OPR', 'Opera'),
        version: temp[2],
      };
    }
  }
  m = m[2] ? [m[1], m[2]] : [navigator.appName, navigator.appVersion, '-?'];
  const version = userAgent.match(/version\/(\d+)/i);
  if (version) {
    m.splice(1, 1, version[1]);
  }
  return {
    name: m[0],
    version: m[1],
  };
}

/**
 * @typedef {Object} StackInfo
 * @property {string} url Url of line
 * @property {number} lineNo line number of error
 * @property {number} colNo column number of error
 * @property {string} [funcName] name of function
 */

/**
 * @parameter {string} stack A stack string as in `(new Error()).stack`
 * @returns {StackInfo}
 */
export const parseStack = function() {
  const browser = getBrowser();
  let lineNdx;
  let matcher;
  if ((/chrome|opera/i).test(browser.name)) {
    lineNdx = 3;
    matcher = function(line) {
      const m = /at ([^(]+)*\(*(.*?):(\d+):(\d+)/.exec(line);
      if (m) {
        let userFnName = m[1];
        let url = m[2];
        const lineNo = parseInt(m[3]);
        const colNo = parseInt(m[4]);
        if (url === '') {
          url = userFnName;
          userFnName = '';
        }
        return {
          url: url,
          lineNo: lineNo,
          colNo: colNo,
          funcName: userFnName,
        };
      }
      return undefined;
    };
  } else if ((/firefox|safari/i).test(browser.name)) {
    lineNdx = 2;
    matcher = function(line) {
      const m = /@(.*?):(\d+):(\d+)/.exec(line);
      if (m) {
        const url = m[1];
        const lineNo = parseInt(m[2]);
        const colNo = parseInt(m[3]);
        return {
          url: url,
          lineNo: lineNo,
          colNo: colNo,
        };
      }
      return undefined;
    };
  }

  return function stackParser(stack) {
    if (matcher) {
      try {
        const lines = stack.split('\n');
        // window.fooLines = lines;
        // lines.forEach(function(line, ndx) {
        //   origConsole.log("#", ndx, line);
        // });
        return matcher(lines[lineNdx]);
      } catch (e) {
        // do nothing
      }
    }
    return undefined;
  };
}();

