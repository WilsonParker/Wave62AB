(function () {
  // ALMA (AMIGA) reads the `locale` cookie (not httpOnly) and matches it with BCP47 "lookup"
  // against region locales (ko-KR, en-GB, ...), so a bare "ko" is ignored.
  // We pin our own cookie at COOKIE_PATH instead of rewriting the shared root (path /) cookie that
  // BICO and the server also write: a longer path is sent and listed first, so ours wins and the
  // apps no longer overwrite each other (see docs/adr/0001-per-app-locale-cookie.md).
  const LOCALE_ALIASES = { ko: 'ko-KR', en: 'en-GB', es: 'es-ES', ja: 'ja-JP', zh: 'zh-CN' };
  const COOKIE_PATH = '/almafeshll';
  const LANG_GUARD_KEY = '__alma_lang_guard';
  const LANG_MAX_TRIES = 1;
  const LANG_WINDOW_MS = 60000;
  const CHECK_MS = 2000;

  function getLocaleCookie() {
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function langGuardAllows() {
    let g;
    try { g = JSON.parse(sessionStorage.getItem(LANG_GUARD_KEY)); } catch (_) { g = null; }
    const now = Date.now();
    if (!g || now - g.t > LANG_WINDOW_MS) g = { n: 0, t: now };
    if (g.n >= LANG_MAX_TRIES) return false;
    g.n += 1;
    sessionStorage.setItem(LANG_GUARD_KEY, JSON.stringify(g));
    return true;
  }

  // True while the app bundle has not run yet, so the new cookie is picked up without a reload.
  function appNotStarted() {
    if (document.readyState !== 'loading') return false;
    return !Array.from(document.scripts).some(s => s.src && !s.defer && !s.async && s.type !== 'module');
  }

  function writeLocaleCookie(value, maxAge) {
    document.cookie = 'locale=' + encodeURIComponent(value) + '; path=' + COOKIE_PATH +
      '; max-age=' + maxAge + '; secure; samesite=lax';
  }

  let timer = null;
  let firstRun = true;

  function enforceLanguage() {
    if (!chrome.runtime || !chrome.runtime.id) {
      clearInterval(timer);
      return;
    }
    chrome.storage.sync.get({ almaLocale: 'ko-KR', almaEnabled: true }, function (s) {
      const raw = (s.almaLocale || '').trim();
      const desired = LOCALE_ALIASES[raw.toLowerCase()] || raw;
      const wasFirstRun = firstRun;
      firstRun = false;
      if (!s.almaEnabled || !desired) {
        // Drop our pinned cookie so the app's own language choice applies again.
        if (wasFirstRun) writeLocaleCookie('', 0);
        return;
      }
      const cookie = getLocaleCookie();
      const ok = cookie !== null && cookie.toLowerCase() === desired.toLowerCase();
      // document.cookie cannot show paths, so a matching value may still come from the root
      // cookie: (re)write ours once per page load so it is in place before anyone changes the root.
      if (ok && !wasFirstRun) return;
      const beforeApp = appNotStarted();
      writeLocaleCookie(desired, 31536000);
      if (!ok && !beforeApp && langGuardAllows()) location.reload();
    });
  }

  enforceLanguage();
  timer = setInterval(enforceLanguage, CHECK_MS);
})();
