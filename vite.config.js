import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://whop-voice-recorder-new.vercel.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});