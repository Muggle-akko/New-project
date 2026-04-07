import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import remarkGfm from "remark-gfm";
import {
  createVaultResolver,
  remarkObsidianCallouts,
  remarkObsidianLinksAndEmbeds,
  remarkReadingTime,
  remarkResolveRelativeAssets,
} from "./scripts/markdown-utils.mjs";

const vaultResolver = createVaultResolver(new URL("./vault/", import.meta.url));

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [
      remarkGfm,
      remarkReadingTime,
      [remarkObsidianLinksAndEmbeds, { resolver: vaultResolver }],
      remarkObsidianCallouts,
      [remarkResolveRelativeAssets, { resolver: vaultResolver }],
    ],
    shikiConfig: {
      theme: "github-dark-default",
      wrap: true,
    },
  },
});
