module.exports = {
  context: __dirname,
  entry: {
    dashboard: __dirname + '/controlpanel/lib/dashboard.js',
    groupSettigns: __dirname + '/controlpanel/lib/groupSettings.js',
    allgroup: __dirname + '/controlpanel/lib/allgroups.js',
    allplants: __dirname + '/controlpanel/lib/allplants.js',
  },
  output: {
    path: __dirname + '/controlpanel/dist/',
    filename: '[name].js'       
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
