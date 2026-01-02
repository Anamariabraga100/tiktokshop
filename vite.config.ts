import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    // Proxy para API UmbrellaPag (para evitar problemas de CORS em desenvolvimento)
    // Descomente se estiver tendo problemas de CORS
    // proxy: {
    //   '/api/umbrellapag': {
    //     target: 'https://api.umbrellapag.com',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api\/umbrellapag/, '/api'),
    //     configure: (proxy, _options) => {
    //       proxy.on('error', (err, _req, res) => {
    //         console.log('proxy error', err);
    //       });
    //       proxy.on('proxyReq', (proxyReq, req, _res) => {
    //         console.log('Sending Request to the Target:', req.method, req.url);
    //       });
    //       proxy.on('proxyRes', (proxyRes, req, _res) => {
    //         console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
    //       });
    //     },
    //   },
    // },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
