import { EOL } from 'os'
import { md5 } from '@allex/md5'
import { NormalizedOutputOptions, OutputPlugin, RenderedChunk } from 'rollup'

import { merge, result } from './util'

const name = 'rollup-plugin-minimize"'

export type PluginConfig = Record<string, any> & {
  implementation: <T>(opts: T) => OutputPlugin;
  disabled?: boolean;
  options: Record<string, any>;
}

type CommentToken = {
  type: string;
  value: string;
  nlb: boolean;
}

type TerserOptions = {
  output: any;
  module: any;
  compress: any;
}

const commentsFunc = (out: any /* OutputStream */, t: CommentToken): boolean => {
  const cache = out.__ccache || (out.__ccache = {})

  // By default, comments with patterns of @license, @preserve or starting with /*! are preserved
  const isSomeComments = (c: any) => c.type === 'comments'
    && /^!|@preserve|@license|@cc_on|\blicensed\b/i.test(c.value)

  /*! IMPORTANT: preserve 3rd-party library license, Inspired from @allex/amd-build-worker/config/util.js */
  if (isSomeComments(t)) {
    let text = t.value
    let preserve: boolean = !cache[text]
    if (preserve) {
      cache[text] = true
      // strip blanks
      text = text.replace(/\n\s\s*/g, '\n ')
      if (preserve = !cache[text]) {
        cache[text] = true
        t.value = text
        if (!~text.indexOf('\n')) {
          t.nlb = false
        }
      }
    }
    return preserve
  }

  return false
}

function buildWorkerConfig (o: any): TerserOptions {
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
        comments: (comments && comments !== 'some') ? comments : commentsFunc
      }
    }
  )
}

/**
 * A Rollup plugin to bundle with a minimize with checksum with md5 digest
 */
export function minimize (opts: PluginConfig) {
  const {
    disabled,
    implementation,
    options
  } = opts

  if (!implementation) {
    throw new Error(`Invalid ${name} implementation`)
  }

  let plugin: OutputPlugin
  if (typeof implementation === 'function') {
    plugin = implementation(buildWorkerConfig(options))
  } else {
    plugin = implementation
  }

  // extends terser
  const pluginImpl = { ...plugin, name: 'minimize' }
  const renderChunk = (plugin.renderChunk! as any).bind(pluginImpl)

  pluginImpl.renderChunk = async (
    source: string,
    chunk: RenderedChunk,
    outputOptions: NormalizedOutputOptions
  ) => {
    const output = await renderChunk(source, chunk, outputOptions)
    if (!output) {
      return null
    }

    // return terser result w/o signature footer
    if (disabled) {
      return output
    }

    let code = output
    let map = null
    const withSoucemap = outputOptions.sourcemap
    if (withSoucemap && output.map) {
      code = output.code
      map = output.map
    }

    // write minify file with banner and footer
    const { banner, footer } = outputOptions

    let str = await result(banner)
    if (str && code.substring(0, str.length) !== str) {
      str = str.replace(/\r\n?|[\n\u2028\u2029]|\s*$/g, EOL)
      code = str + code
    }

    str = await result(footer)
    str = (str || `/* [hash] */`).replace(/\[hash\]/g, md5(code))
    code = code + EOL + str

    return withSoucemap
      ? { code, map }
      : code
  }

  return pluginImpl
}
