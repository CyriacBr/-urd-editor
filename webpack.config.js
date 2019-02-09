const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

function DtsBundlePlugin() {}
DtsBundlePlugin.prototype.apply = function(compiler) {
  compiler.plugin('done', function() {
    var dts = require('dts-bundle');

    dts.bundle({
      name: '"@urd/editor"',
      main: './dist/index.d.ts',
      out: 'index.d.ts',
      removeSource: true,
      outputAsModuleFolder: true
    });
  });
};

const plugins = [
  new webpack.optimize.LimitChunkCountPlugin({
    maxChunks: 1
  }),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  }),
  new webpack.LoaderOptionsPlugin({
    options: {
      tslint: {
        emitErrors: true,
        failOnHint: true
      }
    }
  }),
  new MonacoWebpackPlugin({
    embeddableLangs: ['userDeclaration'],
    languages: ['javascript', 'typescript'],
    features: [
      'bracketMatching',
      'caretOperations',
      'clipboard',
      'codeAction',
      'codelens',
      'contextmenu',
      'cursorUndo',
      'folding',
      'format',
      'hover',
      'multicursor',
      'parameterHints',
      'quickCommand',
      'quickOutline',
      'rename',
      'smartSelect',
      'snippets',
      'suggest',
      'wordHighlighter',
      'wordOperations',
      'wordPartOperations'
    ]
  }),
  new DtsBundlePlugin()
];

var config = {
  devtool: isProd ? 'hidden-source-map' : 'source-map',
  context: path.resolve('./src'),
  entry: {
    app: './index.ts'
  },
  output: {
    path: path.resolve('./dist'),
    filename: '[name].bundle.js',
    /*chunkFilename: 'js/[name].app.js',*/
    libraryTarget: 'umd',
    library: 'urdEditor',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        exclude: [/\/node_modules\//],
        use: ['awesome-typescript-loader', 'source-map-loader']
      },
      !isProd
        ? {
            test: /\.(js|ts)$/,
            loader: 'istanbul-instrumenter-loader',
            exclude: [/\/node_modules\//],
            query: {
              esModules: true
            }
          }
        : null,
      { test: /\.html$/, loader: 'html-loader' },
      { test: /\.css$/, loaders: ['style-loader', 'css-loader'] }
    ].filter(Boolean)
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: plugins,
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
    compress: true,
    port: 4000,
    hot: true
  }
};

module.exports = config;
