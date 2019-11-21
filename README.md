# rollup-plugin-jspacker [![Travis Build Status][travis-img]][travis]

[travis-img]: https://travis-ci.org/allex/rollup-plugin-jspacker.svg
[travis]: https://travis-ci.org/allex/rollup-plugin-jspacker

[Rollup](https://github.com/rollup/rollup) plugin to minify generated bundle. Based on [rollup-plugin-terser](https://github.com/TrySound/rollup-plugin-terser).
Rollup plugin to minify generated bundle (based on terser with checksum signature enhance)

## Install

```sh
yarn add rollup-plugin-jspacker --dev
```

*Note: this package requires rollup@0.66 and higher (including rollup@1.0.0)*

## Usage

```js
import { rollup } from "rollup";
import { minify } from "rollup-plugin-jspacker";

rollup({
  input: "main.js",
  plugins: [minify()]
});
```

## Why named export?

1. Module is a namespace. Default export often leads to function/component per file dogma and makes code less maintainable.
2. Interop with commonjs is broken in many cases or hard to maintain.
3. Show me any good language with default exports. It's historical javascriptism.


## Options

see <https://github.com/TrySound/rollup-plugin-terser#options>

## Examples

### include/exclude
If you'd like that only some of the files will be minify, then you can filter by `include` and `exclude` to do this like so:

```js
// rollup.config.js
import { minify } from "rollup-plugin-jspacker";

export default {
  input: "index.js",
  output: [
    { file: 'lib.js', format: 'cjs' },
    { file: 'lib.min.js', format: 'cjs' },
    { file: 'lib.esm.js', format: 'es' },
    { dir: '.', entryFileNames: 'lib-[format].js', format: 'iife'  }
  ],
  plugins: [
    minify({
      include: [/^.+\.min\.js$/, '*esm*'], 
      exclude: [ 'some*' ]
    })
  ]
};
```

See [Terser documentation](https://github.com/fabiosantoscode/terser#terser) for further reference.

# License

MIT © [Allex Wang](http://iallex.com)
