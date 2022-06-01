import ViteComponents, {
  ElementUiResolver,
} from 'vite-plugin-components'
const { createVuePlugin } = require("vite-plugin-vue2");
import {resolve} from "path";

module.exports = {
  base: "./",
  plugins: [
    createVuePlugin({
      vueTemplateOptions: {
        compilerOptions: {
          preserveWhitespace: false,
          // whitespace: "preserve"
        }
      }
    }),
    ViteComponents({
      customComponentResolvers: [
        ElementUiResolver({
          importStyle: true
        }),
      ]
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  server: {
    port: 3001,
  }
};
