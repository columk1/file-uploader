import path from 'path'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'

const __dirname = import.meta.dirname

export default {
  input: 'src/javascript/index.js',
  output: {
    file: 'public/bundle.js',
    format: 'es',
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    copy({
      targets: [
        // Copies all icons from shoelace to the public folder, done manually to save space
        // {
        //   src: path.resolve(__dirname, 'node_modules/@shoelace-style/shoelace/dist/assets'),
        //   dest: path.resolve(__dirname, 'public/vendors/shoelace'),
        // },
        {
          src: path.resolve(__dirname, 'src/assets'),
          dest: path.resolve(__dirname, 'public'),
        },
      ],
    }),
  ],
}
