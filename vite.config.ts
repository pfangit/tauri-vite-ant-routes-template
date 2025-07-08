import { ConfigEnv, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import { viteMockServe } from "vite-plugin-mock";

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
