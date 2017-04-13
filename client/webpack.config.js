module.exports = {
  context: __dirname,
  entry: __dirname + '/controlpanel/lib/dashboard.js',
  output: {
    path: __dirname + '/controlpanel/dist/',
    filename: 'bundle.js'       
  },
  module: {
    loaders: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }
    ]
  },
  resolve: {
    extensions: ['.js', '.json'] 
  }
};
