# Artwork provenance

The live page reuses assets/archive/dawn.webp, an illustration originally generated for this project. It depicts an imagined terrace, not a Vagartha venue. Its caption and alternative text identify it as an illustration.

Next Image serves responsive, optimized AVIF/WebP sizes. The hero is preloaded because it is above the fold. Its fixed container reserves space before loading. Future below-fold images should use the default lazy loading.

The symbolic practitioner and panorama remain archived and unused. They are not photographs of Girija.
The pixel renderer is retained in src/components/pixel-world as historical source and is no longer loaded by the page, in accordance with the current motion brief.

The brand SVG, PNG/ICO icons and social card are code-drawn assets. Regenerate icons and the social card with:
`node scripts/generate-brand-assets.mjs`
