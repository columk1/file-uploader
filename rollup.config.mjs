import path from 'node:path'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import copy from 'rollup-plugin-copy'
import css from 'rollup-plugin-css-only'
import terser from '@rollup/plugin-terser'

const __dirname = import.meta.dirname

export default {
  input: {
    bundle: 'src/javascript/index.js',
    folder: 'src/javascript/folder.js',
    publicFolder: 'src/javascript/publicFolder.js',
    login: 'src/javascript/login.js',
    signup: 'src/javascript/signup.js',
  },
  output: {
    dir: 'public',
    format: 'es',
    entryFileNames: 'scripts/[name].min.js',
    chunkFileNames: 'scripts/chunks/[name]-[hash].js',
    assetFileNames: '[name].[ext]',
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    css({ output: 'stylesheets/bundle.css' }),
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
    terser(), // minify js
  ],
}
