module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    [
      "@babel/preset-react",
      {
        runtime: "automatic", // This enables the new JSX transform
      },
    ],
  ],
};
