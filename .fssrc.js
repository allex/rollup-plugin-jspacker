// vim: set ft=javascript fdm=marker et ff=unix tw=80 sw=2:
// author: allex_wang <http://iallex.com>

import path from 'path'

import { version, name, author, license, description, dependencies } from './package.json'

const banner = (name, short = false) => {
  let s;
  if (short) {
    s = `/*! ${name} v${version} | ${license} licensed | ${author.name || author} */`
  } else {
    s = `/**
 * ${name} v${version} - ${description}
 *
 * @author ${author}
 * Released under the ${license} license.
 */`
  }
  return s
}

const resolve = p => path.resolve(__dirname, '.', p)

const plugins = [
  'node-builtins',
  'resolve',
  'typescript',
  'commonjs',
  'globals'
]

export default {
  destDir: resolve('lib'),
  dependencies: { events: true, ...dependencies },
  plugins: {
    typescript: {
      check: false,
      typescript: require('@allex/typescript')
    },
    globals ({ output }) {
      return ['es', 'cjs'].includes(output.format) ? {
        process: false,
        buffer: false
      } : {}
    }
  },
  entry: [
    {
      input: resolve('src/index.ts'),
      plugins,
      output: [
        { format: 'es', file: 'index.esm.js', banner: banner(name, true) },
        { format: 'cjs', file: 'index.js', minimize: false, banner: banner(name) },
      ]
    }
  ]
}
