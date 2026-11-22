# One locale cookie per app, scoped by path

ALMA and BICO read the same root `locale` cookie (path `/`), but ALMA needs a region code (`ko-KR`) and BICO a bare code (`ko`), so the two content scripts kept overwriting each other and reloading the page. The server and the apps also rewrite that root cookie. We stopped touching the root cookie. Instead, each content script pins its own cookie at `/almafeshll` or `/bico`: browsers send and list the cookie with the longer path first, so each app reads its own value no matter what happens to the root cookie.

## Considered Options

- Keep the shared cookie and let BICO accept any `ko*` value. Rejected: this only works if BICO understands `ko-KR`, and it does nothing about the server rewriting the cookie.

## Consequences

- The pinned cookies last a year. If a user turns a language setting off, the script deletes that app's cookie on the next page load. Uninstalling the extension leaves the cookies in place until they expire.
- This assumes each server, when it receives two `locale` cookies, uses the first one. Check this on BICO, whose server may read the cookie itself.
