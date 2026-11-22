// DEBUG (temporary): records every change to an Inditex `locale` cookie, to find what keeps
// rewriting the language. Remove once the cause is known.
// Read it from the service-worker console (chrome://extensions -> "service worker"):
//   chrome.storage.local.get('localeLog', r => console.table(r.localeLog))
// Our own writes use path /almafeshll or /bico; anything on path / comes from the apps or server.
const LOG_KEY = 'localeLog';
const LOG_MAX = 200;

chrome.cookies.onChanged.addListener(({ removed, cookie, cause }) => {
  if (cookie.name !== 'locale' || !cookie.domain.endsWith('inditex.com')) return;
  const entry = {
    at: new Date().toISOString(),
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    removed,
    cause,
  };
  console.log('[locale]', entry);
  chrome.storage.local.get({ [LOG_KEY]: [] }, r => {
    chrome.storage.local.set({ [LOG_KEY]: r[LOG_KEY].concat(entry).slice(-LOG_MAX) });
  });
});
