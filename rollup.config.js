import resolve from 'rollup-plugin-node-resolve';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8'}));
const banner = `/* webgl-lint@${pkg.version}, license MIT */`;

export default [
  {
    input: 'src/wrap.js',
    plugins: [
      resolve({
        modulesOnly: true,
      }),
    ],
    output: [
      {
        format: 'umd',
        file: 'webgl-lint.js',
        indent: '  ',
        banner,
      },
    ],
  },
];
