import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: change "al-jazeera-5" below to match your GitHub repository name
// exactly, otherwise GitHub Pages will not load the assets correctly.
export default defineConfig({
  plugins: [react()],
  base: "/al-jazeera-5/",
});
