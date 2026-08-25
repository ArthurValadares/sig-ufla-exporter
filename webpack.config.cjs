// @ts-check
"use strict";

const path = require("node:path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/** @type {(env: { target?: string }) => import("webpack").Configuration} */
module.exports = (env) => {
  const target = env?.target === "firefox" ? "firefox" : "chrome";
  const outputDir = path.resolve(__dirname, "dist", target);

  return {
    mode: "production",
    devtool: false,
    entry: {
      content: path.resolve(__dirname, "src/content.ts"),
    },
    output: {
      path: outputDir,
      filename: "[name].js",
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: "[name].css" }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "manifests/manifest.base.json"),
            to: "manifest.json",
            transform(content) {
              const base = JSON.parse(content.toString());
              const overridePath = path.resolve(__dirname, `manifests/manifest.${target}.json`);
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const override = require(overridePath);
              const mesclado = { ...base, ...override };
              return Buffer.from(JSON.stringify(mesclado, null, 2));
            },
          },
        ],
      }),
    ],
    optimization: {
      minimize: true,
    },
  };
};
