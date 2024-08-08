import path from 'path'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'

const __dirname = import.meta.dirname

export default {
  input: 'src/components/index.js',
  output: {
    file: 'public/bundle.js',
    format: 'es',
  },
  plugins: [
    resolve(),
    commonjs(),
    copy({
      targets: [
        {
          src: path.resolve(__dirname, 'node_modules/@shoelace-style/shoelace/dist/assets'),
          dest: path.resolve(__dirname, 'public/vendors/shoelace'),
        },
        {
          src: path.resolve(__dirname, 'src/assets'),
          dest: path.resolve(__dirname, 'public'),
        },
      ],
    }),
  ],
}
