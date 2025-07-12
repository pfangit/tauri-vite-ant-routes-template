import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { ConfigEnv, defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { viteMockServe } from "vite-plugin-mock";
import { settings } from "./defaultSettings";

const host = process.env.TAURI_DEV_HOST;
const port = parseInt(process.env.PORT);

const isDev = process.env.NODE_ENV === "development";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }: ConfigEnv) => ({
  plugins: [
    react(),
    tailwindcss(),
    viteMockServe({
      mockPath: "mock",
      watchFiles: true,
      logger: true,
      enable: isDev,
      cors: true,
    }),
    createHtmlPlugin({
      inject: {
        data: {
          // 定义了一个title 变量，可以被html中进行引用
          title: settings.title,
        },
      },
    }),
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      open: true, //如果存在本地服务端口，将在打包后自动展示
    }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: port || 1420,
    strictPort: true,
    host: host || false,
    open: true,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, ".", "src"),
    },
  },
}));
