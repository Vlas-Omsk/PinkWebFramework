const { merge } = require('webpack-merge');
const path = require('path');

module.exports = (env) => {
    const common = {
        mode: "development",
        entry: "./src/Framework.js",
        output: {
            filename: "PinkFramework.js",
            path: path.resolve(__dirname, "dist"),
            library: "PinkFramework",
            libraryTarget: "umd"
        }
    };

    if (env.production) {
        return merge(common, {
            mode: "production",
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /node_modules/,
                        use: {
                            loader: "babel-loader",
                            options: {
                                presets: ['@babel/preset-env']
                            }
                        }
                    }
                ]
            }
        });
    } else {
        return common;
    }
}