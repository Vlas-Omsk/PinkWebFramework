const path = require('path');

module.exports = {
    mode: "development",
    entry: "./src/Framework.js",
    output: {
        filename: 'PinkFramework.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'PinkFramework',
        libraryTarget: 'umd'
    }
};