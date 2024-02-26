import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

const baseOutput = { dir: './dist', entryFileNames: '[name].[format].js' };
/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: ['src/cli.ts'],
  output: [
    { format: 'cjs', ...baseOutput },
    { format: 'esm', ...baseOutput },
  ],
  plugins: [typescript(), json()],
};

export default config;
