const { build } = require('esbuild');
//const glob = require('glob');
//const entryPoints = glob.sync('./src/**/*.ts', { ignore: ['./src/**/*.test.ts'] });

build({
  //entryPoints,
  entryPoints: ['./src/index.ts', './src/worker.ts'],
  outbase: './src',
  outdir: './dist',
  platform: 'node',
  bundle: true,
  minify: true,
  sourcemap: true,
  external: [
    'dotenv',
    'express',
    'express-bearer-token',
    'express-async-handler',
    'http-errors',
    'knex',
    'nodemailer',
    'lodash',
    'uuid-apikey'
    //'./node_modules/*',
    //'../node_modules/*'
  ],
  watch: false
})