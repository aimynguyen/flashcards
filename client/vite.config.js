import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [react()],
  base: isProduction ? "/flashcards/" : "/",
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
