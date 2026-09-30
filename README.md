# Vagartha Yoga

Next.js 16 / React 19 / TypeScript site for personal online yoga with Girija Jayashankar.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Local development: http://localhost:3000. Production requires a Node server; static export was removed to support the enquiry endpoint, optimized images and request-specific security headers.

Deployment target: **AWS EC2 with Caddy**. No deployment has been performed.
See [deployment instructions](docs/deployment.md), [design review](docs/design-review.md) and [validation record](docs/validation.md).

Copy .env.example to .env.local for development. The enquiry adapter currently uses Resend, a verified sending address and a server-only API key. The recipient is always vagarthayoga@gmail.com. Missing configuration is an error, with an email fallback; it never produces a simulated success.

No runtime or development dependencies were added. Existing image/font/test tools are reused. Runtime code for the old GSAP/pixel-world presentation is retained but not imported.

`website-plan.txt` and `improvement.txt` are historical briefs. The production design brief supersedes their palette, motion and static-export requirements.
