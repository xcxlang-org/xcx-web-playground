// vite.config.ts
import { defineConfig } from "file:///D:/XCX-WORKSPACE/xcx-web-playground/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/XCX-WORKSPACE/xcx-web-playground/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import viteCompression from "file:///D:/XCX-WORKSPACE/xcx-web-playground/frontend/node_modules/vite-plugin-compression/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///D:/XCX-WORKSPACE/xcx-web-playground/frontend/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    viteCompression({ algorithm: "gzip" })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
      "xcx-interpreter/browser": fileURLToPath(new URL("../interpreter/src/run.ts", __vite_injected_original_import_meta_url))
    }
  },
  server: {
    port: 3e3,
    open: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
  },
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf("node_modules") !== -1) {
            if (id.indexOf("@codemirror") !== -1 || id.indexOf("@lezer") !== -1 || id.indexOf("@replit") !== -1) {
              return "codemirror";
            }
            if (id.indexOf("vue") !== -1) {
              return "vue";
            }
          }
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxYQ1gtV09SS1NQQUNFXFxcXHhjeC13ZWItcGxheWdyb3VuZFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcWENYLVdPUktTUEFDRVxcXFx4Y3gtd2ViLXBsYXlncm91bmRcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1hDWC1XT1JLU1BBQ0UveGN4LXdlYi1wbGF5Z3JvdW5kL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgdml0ZUNvbXByZXNzaW9uIGZyb20gJ3ZpdGUtcGx1Z2luLWNvbXByZXNzaW9uJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHZpdGVDb21wcmVzc2lvbih7IGFsZ29yaXRobTogJ2d6aXAnIH0pXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAneGN4LWludGVycHJldGVyL2Jyb3dzZXInOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4uL2ludGVycHJldGVyL3NyYy9ydW4udHMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIG9wZW46IHRydWUsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0Nyb3NzLU9yaWdpbi1FbWJlZGRlci1Qb2xpY3knOiAncmVxdWlyZS1jb3JwJyxcbiAgICAgICdDcm9zcy1PcmlnaW4tT3BlbmVyLVBvbGljeSc6ICdzYW1lLW9yaWdpbicsXG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgIGlmIChpZC5pbmRleE9mKCdub2RlX21vZHVsZXMnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmRleE9mKCdAY29kZW1pcnJvcicpICE9PSAtMSB8fCBpZC5pbmRleE9mKCdAbGV6ZXInKSAhPT0gLTEgfHwgaWQuaW5kZXhPZignQHJlcGxpdCcpICE9PSAtMSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2NvZGVtaXJyb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluZGV4T2YoJ3Z1ZScpICE9PSAtMSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3Z1ZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VCxTQUFTLG9CQUFvQjtBQUMzVixPQUFPLFNBQVM7QUFDaEIsT0FBTyxxQkFBcUI7QUFDNUIsU0FBUyxlQUFlLFdBQVc7QUFIb0ssSUFBTSwyQ0FBMkM7QUFLeFAsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osZ0JBQWdCLEVBQUUsV0FBVyxPQUFPLENBQUM7QUFBQSxFQUN2QztBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxNQUNwRCwyQkFBMkIsY0FBYyxJQUFJLElBQUksNkJBQTZCLHdDQUFlLENBQUM7QUFBQSxJQUNoRztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLGdDQUFnQztBQUFBLE1BQ2hDLDhCQUE4QjtBQUFBLElBQ2hDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sYUFBYSxJQUFJO0FBQ2YsY0FBSSxHQUFHLFFBQVEsY0FBYyxNQUFNLElBQUk7QUFDckMsZ0JBQUksR0FBRyxRQUFRLGFBQWEsTUFBTSxNQUFNLEdBQUcsUUFBUSxRQUFRLE1BQU0sTUFBTSxHQUFHLFFBQVEsU0FBUyxNQUFNLElBQUk7QUFDbkcscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxRQUFRLEtBQUssTUFBTSxJQUFJO0FBQzVCLHFCQUFPO0FBQUEsWUFDVDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
