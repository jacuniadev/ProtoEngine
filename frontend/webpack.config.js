const path = require("path");
var htmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
    entry: "./frontend/src/index.ts",
    devtool: "inline-source-map",
    mode: "development",
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        port: 9000,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new htmlWebpackPlugin({
            inject: true,
            template: path.resolve(__dirname,  "src/index.html"),
        }),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "build"),
    },
};
