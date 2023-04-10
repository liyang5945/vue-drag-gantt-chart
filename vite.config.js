import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import Components from 'unplugin-vue-components/vite'
import { ElementUiResolver } from 'unplugin-vue-components/resolvers'
import vue2 from '@vitejs/plugin-vue2'

export default defineConfig({
  base: "./",
  plugins: [
    vue2({
      template: {
        compilerOptions: {
          preserveWhitespace: true,
          whitespace: "preserve"
        },
      },
    }),
    Components({
      resolvers: [
        ElementUiResolver({
          importStyle: false
        }),
      ]
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3001,
  }
})
