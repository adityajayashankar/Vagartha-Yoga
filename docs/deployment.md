# Deploy Vagartha Yoga on AWS with Caddy

Prepared locally only. No AWS resources, DNS records, certificates or production services were changed.

## Target
An existing Linux EC2 instance with an associated Elastic IPv4 address. Caddy runs on the host and proxies to the Next.js container at 127.0.0.1:3100. Caddy owns ports 80/443. Keep the existing Caddy global configuration and unrelated sites.

Use Node 24 for local builds. The provided Dockerfile uses Node 24 Alpine and Next's standalone output. The app runs as an unprivileged user. No framework migration or new package dependency is required.

Prerequisites on EC2: Docker Engine with Compose, Caddy 2, and a checked-out/copy of this project. Use the official [Docker installation guide](https://docs.docker.com/engine/install/ubuntu/) and [Caddy installation guide](https://caddyserver.com/docs/install) for your Linux distribution.

## DNS records
At the authoritative DNS provider, use these records. The EC2 Elastic IP is the only infrastructure value still missing; it cannot be inferred from the repository.

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | @ | REPLACE_WITH_EC2_ELASTIC_IPV4 | 300 |
| CNAME | www | vagarthayoga.com | 300 |

Do not publish the replacement label literally. Obtain the address from EC2 > Elastic IPs and confirm its association with the intended instance. An [Elastic IP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html) persists independently of instance stop/start.

Remove conflicting website A/CNAME records. Only publish AAAA if the instance has a working public IPv6 route and corresponding firewall rules. Preserve unrelated MX, SPF, DKIM and other email records.

The supplied Caddy fragment redirects www to the apex while preserving the path and query. Next also defines the equivalent 308 redirect as a fallback.

## Network and HTTPS
- Allow inbound TCP 80 and 443 in the EC2 security group and host firewall. UDP 443 is optional for HTTP/3.
- Permit SSH only from your administration IP, or use AWS Systems Manager.
- Do not open port 3100 or 3000 publicly. Compose publishes 3100 only on 127.0.0.1.
- Permit outbound HTTPS for certificate issuance and email delivery.
- Ensure no conflicting process owns 80/443.
- Retain Caddy's persistent data directory so certificates survive restarts. Its packaged service handles this.
- Caddy automatically obtains/renews certificates and redirects HTTP to HTTPS once both domains resolve correctly. No separate Certbot/Nginx setup is needed.
- If your zone already restricts certificate issuers through CAA, allow the CA used by your existing Caddy installation. No new CAA record is required for a zone without restrictions.

See [Caddy automatic HTTPS requirements](https://caddyserver.com/docs/automatic-https) and [reverse proxy configuration](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).

## Email configuration
The current adapter uses Resend independently of AWS hosting. Verify an owned sending domain in Resend and use the exact DKIM/SPF records generated for that account. These values are account-specific and cannot be supplied from this checkout. Do not change Gmail's MX records to send website enquiries.

Create a sending-only API key. Add values on the server in .env.production; never put them in a client variable or commit them.

```dotenv
RESEND_API_KEY=REPLACE_WITH_SENDING_KEY
ENQUIRY_FROM=Vagartha Yoga <website@YOUR_VERIFIED_SENDING_DOMAIN>
SITE_URL=https://vagarthayoga.com
ALLOW_LOCAL_ENQUIRY=false
```

Use a sender on your verified domain, not vagarthayoga@gmail.com. The recipient is fixed to vagarthayoga@gmail.com. Replies use the visitor's validated email address. API keys are runtime-only and excluded from Docker build context.

The endpoint uses plain-text email, field validation, a hidden spam field, byte limits, same-site/origin checks, an outbound timeout and provider idempotency keys for retries. It does not allow the visitor to choose a recipient, provider URL or sender.

Success means the provider accepted the message; inbox delivery still needs a real smoke test. Missing credentials or provider errors return a failure and offer an email fallback. See the [Resend send endpoint](https://resend.com/docs/api-reference/emails/send-email).

## Pre-deploy checklist
- [ ] Confirm the supplied instructor/qualification/experience/regions and approve first-person copy.
- [ ] Confirm class length, current fees, video platform and introductory offer. No invented values are published.
- [ ] Confirm privacy wording, email processor and retention policy.
- [ ] Supply the EC2 Elastic IP; check both DNS names resolve to it.
- [ ] Set and protect .env.production, verify sending domain, and check email-provider quota.
- [ ] Run lint, typecheck, tests, and production build. Inspect mobile at 360px and keyboard navigation.
- [ ] Build and smoke-test the Linux container before replacing a running release.
- [ ] Check port 3100 is free and no duplicate Caddy site block exists.
- [ ] Back up the current Caddy configuration and retain the previous app image.
- [ ] Validate Caddy configuration before reload.
- [ ] After release, verify HTTPS, redirects, security headers, sitemap, 404, and one real email received in Gmail.
- [ ] Repeat mobile Lighthouse against the public HTTPS origin. Local scores do not prove AWS latency.
- [ ] Monitor Caddy/container errors and provider delivery events without logging message bodies.

## Commands: local verification (does not deploy)
```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
docker build -t vagartha-yoga:review .
```

The postbuild script copies public and static assets into the standalone output. Use npm start after npm run build, or run the Docker image. The start script respects NEXT_DIST_DIR for isolated local previews.

The normal build writes .next. A separate NEXT_DIST_DIR=.next-production is supported for local review while next dev is running; it is not needed on EC2. Stop a local standalone server before rebuilding its output on Windows, where native image DLLs are locked by the running process.

## Commands: release on EC2 (provided, NOT executed)
Run from the project directory after uploading/reviewing the source. Values in angle brackets must be replaced.

```sh
test -f .env.production || cp .env.example .env.production
chmod 600 .env.production
# Edit .env.production securely and fill the email values before continuing.
nano .env.production

# Validate without printing the resolved environment or API key.
docker compose config --quiet

# On an existing installation, save the current image before rebuilding.
# Run this line only when vagartha-yoga:local already exists.
docker image tag vagartha-yoga:local vagartha-yoga:previous

docker compose build --pull
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1:3100/api/health
```

Install only this site's Caddy fragment, preserving existing sites:

```sh
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.before-vagartha
sudo install -d -m 755 /etc/caddy/sites
sudo install -m 644 deploy/Caddyfile /etc/caddy/sites/vagarthayoga.caddy
sudo nano /etc/caddy/Caddyfile
# Add this line once, outside any site/global block, if not already imported:
# import /etc/caddy/sites/*.caddy

sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager

curl -I http://vagarthayoga.com
curl -I https://www.vagarthayoga.com/privacy
curl -I https://vagarthayoga.com
curl --fail https://vagarthayoga.com/sitemap.xml
curl --fail https://vagarthayoga.com/robots.txt
```

Expect HTTP to redirect to HTTPS and www to redirect to https://vagarthayoga.com/privacy. Verify the final TLS certificate covers the requested hostname. Submit one clearly labelled test enquiry through the site and confirm it arrives in vagarthayoga@gmail.com before announcing launch.

## Rollback
If updating an existing app, restore the saved image and recreate only this service:

```sh
docker image tag vagartha-yoga:previous vagartha-yoga:local
docker compose up -d --no-build --force-recreate app
curl --fail http://127.0.0.1:3100/api/health
```

Restore the backed-up Caddy configuration only if its changes caused the problem, validate it, then reload Caddy. Leave its certificate data intact.
