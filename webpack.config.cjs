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
      path: path.resolve(__dirname, 'dist'),
      clean: true,
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