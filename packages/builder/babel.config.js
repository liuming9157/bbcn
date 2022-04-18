module.exports = {
  presets: ["@babel/preset-env"],
  sourceMaps: "inline",
  retainLines: true,
  plugins: [
    [
      "@babel/plugin-transform-runtime",
      {
        regenerator: true,
      },
    ],
  ],
}
