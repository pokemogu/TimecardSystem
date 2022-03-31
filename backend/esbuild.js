const { build } = require('esbuild');
const glob = require('glob');
const entryPoints = glob.sync('./src/**/*.ts', '../shared/**/*.ts');

build({
  entryPoints,
  outbase: './src',
  outdir: './dist',
  platform: 'node',
  bundle: true,
  minify: true,
  external: [
    './node_modules/*',
    '../node_modules/*'
  ],
  watch: false
})