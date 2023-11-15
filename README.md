# rollup-plugin-minimize [![Travis Build Status][travis-img]][travis]

[travis-img]: https://travis-ci.org/allex/rollup-plugin-minimize.svg
[travis]: https://travis-ci.org/allex/rollup-plugin-minimize

A Rollup plugin to bundle with a minimize with checksum with md5 digest, based on [@rollup/plugin-terser](https://github.com/rollup/plugins/tree/master/packages/terser).

## Install

```sh
yarn add rollup-plugin-minimize --dev
```

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v2.78.0+.

## Usage

```js
import { rollup } from "rollup";
import { minimize } from "rollup-plugin-minimize";

rollup({
  input: "main.js",
  plugins: [minimize({
    implementation: require('@rollup/plugin-terser'),
    // options for rollup-plugin-terser <https://github.com/terser/terser>
    options: {
      ie8: true,
      compress: {
        drop_console: true
      },
      output: {
        shebang: true,
        indent_level: 2
      },
      module: true,
      ecma: 2017,
      toplevel: true
    }
  })]
});
```

## Why named export?

1. Module is a namespace. Default export often leads to function/component per file dogma and makes code less maintainable.
2. Interop with commonjs is broken in many cases or hard to maintain.
3. Show me any good language with default exports. It's historical javascriptism.

# License

MIT © [Allex Wang](http://iallex.com)
