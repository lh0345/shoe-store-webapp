const path = require('path');

/** @param {Record<string, unknown>} env @param {{ mode?: string }} argv */
module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const isProd = mode === 'production';

  return {
    mode,
    entry: './src/app.js',
    output: {
      filename: 'bundle.js',
      chunkFilename: '[name].[contenthash:8].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      // Required so lazy-loaded chunks (e.g. admin.*.js) fetch from /dist/ when the
      // shell is served from site root with script src="/dist/bundle.js".
      publicPath: isProd ? '/dist/' : 'auto',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
      ],
    },
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
    resolve: {
      extensions: ['.js'],
    },
  };
};