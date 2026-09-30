# Production change map

| File | Change |
| --- | --- |
| src/app/globals.css | Paper/forest/clay tokens, type and spacing scales, responsive editorial layout, form states, visible focus and reduced-motion rules. |
| src/components/site/content.ts | Plain class, audience and FAQ copy; correct .com domain and canonical email. |
| src/components/site/Hero.tsx | One enquiry action, concise introduction, optimized/preloaded existing terrace illustration. |
| src/components/site/Navbar.tsx | Simpler navigation and enquiry action; preserves active-section tracking and keyboard dismissal. |
| src/components/site/DayJourney.tsx | Normal-flow explanation of personal teaching replaces pinned, continuously animated story. |
| src/components/site/Sections.tsx | Practice disclosures, teacher introduction, FAQs and single enquiry section. |
| src/components/site/Elements.tsx | Shared brand and action styling. |
| src/components/site/Footer.tsx | Compact navigation, privacy link and correct domain; no competing phone booking path. |
| src/components/site/EnquiryForm.tsx | Validation, selected practice, pending/success/error states, spam field, retry identity and email fallback. |
| src/lib/enquiry.ts | Shared validation, practice options and mailto construction. |
| src/lib/send-enquiry.ts | Server-only Resend transport; fixed recipient, reply-to, timeout and acceptance checks. |
| src/app/api/enquiry/route.ts | Bounded request parsing, origin/content checks, honeypot, validation and truthful provider responses. |
| src/app/api/health/route.ts | Lightweight container health endpoint. |
| src/app/layout.tsx | Preloaded local fonts, metadata, social cards and Organization JSON-LD. |
| src/app/page.tsx | Revised section order; preserves existing anchors. |
| src/app/privacy/page.tsx | Plain explanation of enquiry processing; unique metadata/canonical. |
| src/app/not-found.tsx | Custom 404 and recovery links. |
| src/app/error.tsx | Page error boundary with retry and email action. |
| src/app/global-error.tsx | Root error fallback with retry and contact details. |
| src/app/sitemap.ts, src/app/robots.ts | .com crawl metadata. |
| src/app/icon.svg | Brand favicon in the production palette. |
| public/favicon.ico, public/apple-touch-icon.png, public/social-card.png | Generated brand assets. |
| scripts/generate-brand-assets.mjs | Reproducible icon/social asset generation with existing Sharp. |
| src/proxy.ts | Per-request CSP nonce and non-shared HTML caching. |
| next.config.ts | Standalone server, image optimization, www redirect and security headers. |
| .env.example | Server email configuration with no secrets. |
| Dockerfile, .dockerignore, compose.yaml | Node production container and loopback-only service. |
| deploy/Caddyfile | AWS host proxy, automatic HTTPS and www-to-apex redirect. |
| package.json | Standalone start/postbuild commands and route generation before typecheck; no dependencies added. |
| scripts/start.mjs, scripts/prepare-standalone.mjs | Prepare and run complete standalone builds, including public/static assets. |
| tsconfig.json, eslint.config.mjs, .gitignore | Separate local production output and generated QA artifacts. |
| tests/website.spec.ts | Responsive layout, navigation, accessibility, SEO and security checks. |
| tests/animation.spec.ts | Purposeful motion/reduced motion and normal scrolling checks. |
| tests/pixel-world.spec.ts | Replaces obsolete canvas assertions with image, font and enquiry UI checks. |
| tests/enquiry-server.spec.ts | Controlled provider contract, validation, spam, origin and failure tests; sends no real mail. |
| README.md, docs/design-review.md, docs/artwork.md, docs/deployment.md, docs/validation.md | Current design/provenance, launch instructions and honest verification record. |

Historical briefs and the unused pixel-world renderer are retained. The prior animation tests are copied to ignored artifacts/legacy-tests for reference. This workspace has no Git repository, so no commit or PR was created.
