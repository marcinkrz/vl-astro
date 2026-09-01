import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import netlify from '@astrojs/netlify';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  adapter: netlify(),
  i18n: {
    locales: ["en", "pl"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false
    }
  },
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()]
  },
  devToolbar: {
    enabled: false
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      weights: [400, 600],
      subsets: ["latin", "latin-ext"],
      cssVariable: "--font-copy",
    }
  ]
});
