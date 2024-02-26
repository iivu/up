import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: ['src/cli.ts'],
  output: [
    { format: 'cjs', file: 'dist/index.cjs.js' },
    { format: 'esm', file: 'dist/index.esm.js' },
  ],
  plugins: [
    typescript(),
    json(),
  ],
};

export default config;
