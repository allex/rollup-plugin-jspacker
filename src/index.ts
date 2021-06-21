import { md5 } from '@allex/md5'
import { EOL } from 'os'
import { Options as TerserOptions, terser } from 'rollup-plugin-terser'

import { merge } from './util'

const isPromise = (o: any) => o && typeof o.then === 'function'

export interface MinifyOptions extends TerserOptions {
  signature?: boolean
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
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    o,
    {
      output: {
        indent_level: 2,
        comments: (comments && comments !== 'some') ? comments : commentsFilter
      }
    }
  )
}

const result = async (v: string | (() => string | Promise<string>)) =>
  typeof v === 'function' ? await v() : v

/**
 * Implements minify based on terser, enhancement add build signature with tag info (md5 checksum)
 *
 * @author Allex Wang (@allex_wang)
 */
export const minify = function (options: MinifyOptions = {}) {
  options = { ...options }

  const signature = options.signature || false
  delete options.signature

  const terserObj = terser(genTerserOptions(options))
  const renderChunk = terserObj.renderChunk

  // extends terser
  return {
    ...terserObj,

    name: 'minify',
    async renderChunk (source, chunk, outputOptions) {
      const output = await renderChunk.bind(this)(source, chunk, outputOptions)

      if (!output) {
        return null
      }

      // return terser result w/o signature footer
      if (!signature) {
        return output
      }

      let { code, map } = output

      // write minify file with banner and footer
      let { banner, footer } = outputOptions
      banner = await result(banner)
      if (banner && code.substring(0, banner.length) !== banner) {
        banner = banner.replace(/\r\n?|[\n\u2028\u2029]|\s*$/g, EOL)
        code = banner + code
      }

      footer = await result(footer)
      footer = (footer || `/* [hash] */`).replace(/\[hash\]/g, md5(code))
      code = code + EOL + footer

      return { code, map }
    }
  }
}
