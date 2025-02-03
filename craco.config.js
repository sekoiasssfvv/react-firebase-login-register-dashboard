const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    "path": require.resolve("path-browserify"),
                    "os": require.resolve("os-browserify/browser"),
                    "crypto": require.resolve("crypto-browserify"),
                    "buffer": require.resolve("buffer/"),
                    "stream": require.resolve("stream-browserify"),
                    "process": require.resolve("process/browser")
                }
            }
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer']
            }),
            new webpack.DefinePlugin({
                'process.env': JSON.stringify(process.env)
            })
        ]
    }
}; 