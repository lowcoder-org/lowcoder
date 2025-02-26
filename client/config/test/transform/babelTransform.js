import babelJest from "babel-jest";

export default babelJest.createTransformer({
  presets: [
    [
      "babel-preset-react-app",
      {
        runtime: "automatic",
      },
    ],
    [
      "babel-preset-vite",
      {
        "env": true,
        "glob": false
      }
    ]
  ],
  babelrc: false,
  configFile: false,
});
