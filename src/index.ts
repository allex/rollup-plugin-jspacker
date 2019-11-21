import { md5 } from '@allex/md5'
import { isPromise, merge, omit } from '@fdio/utils'
import { EOL } from 'os'
import { Options as TerserOptions, terser } from 'rollup-plugin-terser'

const stderr = console.error.bind(console) // eslint-disable-line no-console

export interface MinifyOptions {
  terser: TerserOptions
}

export const printMinifyError = (ex: any, code: string) => {
  if (ex.name === 'SyntaxError') {
    stderr(`Parse error at ${ex.filename}:${ex.line},${ex.col}`)
    const lines = code.split(/\r?\n/)
    let col = ex.col
    let line = lines[ex.line - 1]
    if (!line && !col) {
      line = lines[ex.line - 2]
      col = line.length
    }
    if (line) {
      const limit = 70
      if (col > limit) {
        line = line.slice(col - limit)
        col = limit
      }
      stderr(line.slice(0, 80))
      stderr(line.slice(0, col).replace(/\S/g, ' ') + '^')
    }
  }
}

function commentsFilter (n, c) {
  // remove duplicates comments
  const cache = commentsFilter.cache || (commentsFilter.cache = {})

  // multiline comment
  const COMMENT_MULTILINE = 'comment2'

  // By default, comments with patterns of @license, @preserve or starting with /*! are preserved
  const isSomeComments = c => c.type === COMMENT_MULTILINE && /^!|@preserve|@license|@cc_on|\blicensed\b/i.test(c.value)

  /*! IMPORTANT: Please preserve 3rd-party library license, Inspired from @allex/amd-build-worker/config/util.js */
  if (isSomeComments(c)) {
    let text = c.value
    let preserve = !cache[text]
    if (preserve) {
      cache[text] = 1
      // strip blanks
      text = text.replace(/\n\s\s*/g, '\n ')
      if (preserve = !cache[text]) {
        cache[text] = 1
        c.value = text
        if (!~text.indexOf('\n')) {
          c.nlb = false
        }
      }
    }
    return preserve
  }
}

function genTerserOptions (o: TerserOptions) {
  const comments = (o.output || 0).comments
  // options for terser <https://github.com/terser/terser>
  return merge(
    {
      module: true,
      ie8: true,
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    o,
    {
      output: {
        comments: (comments && comments !== 'some') ? comments : commentsFilter
      }
    }
  )
}

/**
 * Implements minify based on terser, enhancement add build signature with tag info (md5 checksum)
 *
 * @author Allex Wang (@allex_wang)
 */
export const minify = function (options: MinifyOptions = { terser: {} }) {
  // cherry-pick options for terser plugin
  const terserOptions = {
    ...genTerserOptions(options.terser),
    ...omit(options, 'terser')
  }

  const terserObj = terser(terserOptions)
  const renderChunk = terserObj.renderChunk

  // extends terser
  return {
    ...terserObj,

    name: 'minify',
    renderChunk (code, chunk, outputOptions) {
      let result = renderChunk(code, chunk, outputOptions)
      if (!isPromise(result)) {
        result = Promise.resolve(result)
      }

      return result.then(({ code, map }) => {
        // write minify file with banner and footer
        let { banner = '', footer } = outputOptions
        banner = banner.trim()
        if (banner && code.substring(0, banner.length) !== banner) {
          banner = banner.replace(/\r\n?|[\n\u2028\u2029]|\s*$/g, EOL)
          code = banner + code
        }
        footer = (footer || `/* [hash] */`).replace(/\[hash\]/g, md5(code))
        code = code + EOL + footer
        return { code, map }
      })
    }
  }
}
