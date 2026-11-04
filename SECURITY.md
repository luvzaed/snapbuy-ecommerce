# Snapbuy security

## Controls and scope

The default is a local Windows demonstration. PostgreSQL uses SCRAM passwords on `127.0.0.1:55432`; npm servers bind to `127.0.0.1`. An offline database does not by itself make a website safe to publish online.

- Signed HS256, HttpOnly, SameSite session cookies. Production cookies are Secure; logout clears the browser cookie. User state is confirmed with the server.
- Protected APIs recheck account existence and current database role. Private account/order access is limited to owners and administrators. Public reviews omit emails; responses never select password hashes.
- Cross-site browser mutations are rejected. Security headers disable content sniffing and framing.
- Passwords use bcrypt; plaintext database passwords cannot log in. Registration/reset validate length and login failures use bounded, per-process throttling.
- Checkout validates quantities, duplicates and stock; prices come from PostgreSQL and stock updates are transactional. Only known shipping/contact fields can be saved. Card details are not collected or sent.
- Images are limited to 5 MB/20 million pixels, decoded and re-encoded as JPEG with random names. SVG/fake images are rejected. Approved HTTPS hosts and constrained local paths prevent arbitrary file references/deletion.
- Visual search uses loopback, image limits, a reindex token, constrained image paths/hosts and JSON indexes instead of executable pickle.
- Credentials, databases, logs, indexes, exports and backups are ignored by Git. Never force-add them.

## Secrets and private data

`JWT_SECRET`, `DATABASE_URL` and `VISUAL_SEARCH_REINDEX_TOKEN` are generated locally or supplied through the environment. Never put real values in source, issues, screenshots, logs or pull requests. CI credentials are test-only. Uploaded product images are public assets; do not upload private documents there.

A scan of tracked files and reachable history found no matching configured signing secrets, database passwords or customer password hashes. A former public contact email remains in an older footer revision. Git history is retained, so merging does not remove that historical address. This is bounded scan evidence, not a guarantee against every possible secret pattern.

## Remaining limitations

- A previously stolen JWT remains usable until its seven-day expiry. Logout clears the browser cookie, and password changes do not revoke old tokens. Rotate the signing secret after suspected compromise. Public hosting should add server-side revocation.
- Throttling is per process; distributed hosting needs a shared limiter/WAF and trusted proxy configuration.
- The full development-tool audit still reports moderate minimatch advisories in lint tooling. Production dependency checks gate high/critical findings. No forced, incompatible linter downgrade is applied.
- This demo has no payment gateway, email verification, password recovery or independent penetration-test certification.
- Remote images and initial CLIP downloads need internet. The optional Python model-based service requires its own runtime verification.
- Local backups contain personal records and password hashes. Keep them private and make consistent PostgreSQL backups. Do not delete the database directory to troubleshoot.

Before any public deployment, review dependency audits, HTTPS, CSP, CSRF, rate limits, revocation, backups, database privileges and the Python service for that environment.

