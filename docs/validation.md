# Validation record

Validation performed locally on 30 September 2026. No deployment or live email was sent.

| Check | Result |
| --- | --- |
| Production Next.js build | Pass on Windows and Linux container. No Next.js build errors or warnings. |
| ESLint | Pass, zero errors/warnings. |
| Typecheck | Pass, including current route types and tests. |
| Automated suite | 36 passed against the final Linux production container (26.6s), as well as the Windows standalone server. |
| Responsive layout | 1920, 1440, 1280, 1024, 768, 430, 390, 375 and 360px checked; no horizontal overflow. |
| Accessibility | Axe WCAG checks pass on desktop/mobile with disclosures open and form errors visible; privacy and 404 also pass. Manual keyboard focus, navigation and reduced-motion checks included. |
| Mobile Lighthouse 13.5.0 | Performance 94, Accessibility 100, Best Practices 100, SEO 100. |
| Lighthouse metrics | First Contentful Paint: 0.8 s; Largest Contentful Paint: 2.9 s; Cumulative Layout Shift: 0; Total Blocking Time: 120 ms. No audit-run warnings. |
| Logo accessible name | Lighthouse mismatch found during review, fixed and verified. |
| Next client navigation | Home to privacy works without browser console errors. |
| Custom 404 | HTTP 404 with unique title and email recovery action. |
| Enquiry UI | Validation, pending state, success, retained inputs on failure, prefilled email fallback, same retry identity, no-JavaScript fallback checked. |
| Enquiry server | Controlled provider tests verify fixed Gmail recipient, reply-to, acceptance-only success, timeout/error handling path, configuration failure, honeypot, origin checks and byte limits. |
| CSP and headers | Per-request nonces verified; no browser CSP errors; framing, MIME and referrer headers verified. |
| Redirect and metadata | www-to-apex redirect preserves path/query; canonical, JSON-LD, OG/Twitter, sitemap, robots and icons checked. |
| Caddy | Configuration validated with Caddy 2 and formatted; no validation warnings. |
| Linux container | Builds, runs as nextjs, healthy, loopback port binding. Home/privacy/metadata/assets return 200. Unconfigured email returns 503 as intended. |

Reports/screenshots are in ignored artifacts/:
- lighthouse-mobile.report.html and lighthouse-mobile.report.json
- final-desktop.png and final-mobile.png
- qa-<width>-hero.png and qa-<width>-form.png

The old pinned-animation tests were replaced to match the current brief; originals are preserved in artifacts/legacy-tests. Provider success tests use a controlled fetch response and browser form tests use intercepted responses. They do not prove real inbox delivery.

## Boundaries and remaining launch work
- AWS latency, DNS propagation and public HTTPS issuance have not been tested; no AWS resources were accessed or changed.
- The EC2 Elastic IP has not been supplied. The DNS A record remains clearly marked in deployment.md.
- Resend needs a server API key and verified sender; Gmail receipt is unverified.
- Content/retention details still need owner review; see design-review.md.
- Local Lighthouse scores are laboratory measurements, not production guarantees. Windows passes scored 98 and 94 for Performance; the final report was run against the Linux container. All recorded runs met the requested targets.
- Container dependency installation reports an existing ESLint 9 end-of-support deprecation and npm's new install-script notice for unrs-resolver. Application build/lint/typecheck are warning-free. ESLint 10 was not forced: the installed Next React lint plugin's peer range currently ends at ESLint 9. A compatible toolchain update remains maintenance work, separate from the runtime image (which does not include lint tooling).
- This directory has no Git repository; no claim is made about remote commit state.
