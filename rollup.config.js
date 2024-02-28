import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: ['src/cli.ts'],
  output: [
    { format: 'esm', file: './bin/cli.mjs' },
  ],
  plugins: [typescript(), json()],
};

export default config;
