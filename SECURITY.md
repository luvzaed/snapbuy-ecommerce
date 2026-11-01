# SnapBuy Security Notes

## Environment variables
- `JWT_SECRET`: long cryptographically random signing secret (32+ random bytes recommended).
- `DATABASE_URL`: PostgreSQL URL (never commit the secret).
- `VISUAL_SEARCH_URL`: internal Python service URL (default `http://127.0.0.1:8000`).
- `VISUAL_SEARCH_REINDEX_TOKEN`: a long random token, **identical in the Next.js and Python process environments**. The Python `/reindex` endpoint refuses requests unless this is set and supplied in `X-Reindex-Token`.
- `VISUAL_SEARCH_BIND_HOST`: default `127.0.0.1`; change only when running in a secured private network.

## Implemented in the security PR
- Signed cookies are HttpOnly and cleared on logout.
- UI revalidates signed sessions using `GET /api/users/me`.
- Authenticated API routes recheck user identity and current database role.
- Basic **single-process** failed-login throttling.
- Order quantities and duplicate item IDs are validated on the server.
- Python visual search limits incoming image size and pixel count, protects reindex, and binds to loopback by default.

## Deployment caveats
- Rotate `JWT_SECRET` when deploying this change if previous session tokens might have been exposed. Cookie clearing does not revoke a previously stolen JWT.
- The in-memory login throttle is insufficient for distributed/serverless production: use a shared Redis limiter or WAF.
- Python and Next.js need to run in a shared private network if hosted on separate machines. Neither public `/reindex` nor public database access should be exposed.
- Uploaded product images currently lack robust server-side validation. Use content sniffing, size limits, and object storage before public deployment.
- Existing product review responses expose reviewer emails; remove them for privacy.
- Index file `.pkl` uses Python pickle: never load an index from an untrusted source.
- Add CSRF/origin checks for cookie-based API mutations; configure a CSP and run `npm audit` and `pip-audit`.
- This PR has not passed a full production build or integration tests with a database. Keep it in draft until tested.
