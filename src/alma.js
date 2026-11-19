(function () {
  // ALMA (AMIGA) reads the shared `locale` cookie (path /, not httpOnly) and matches it with
  // BCP47 "lookup" against region locales (ko-KR, en-GB, ...), so a bare "ko" is ignored.
  const LOCALE_ALIASES = { ko: 'ko-KR', en: 'en-GB', es: 'es-ES', ja: 'ja-JP', zh: 'zh-CN' };
  const LANG_GUARD_KEY = '__alma_lang_guard';
  const LANG_MAX_TRIES = 2;
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

  const isKorean = v => /^ko(-|$)/i.test(v || '');
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
      if (!s.almaEnabled || !desired) return;
      const cookie = getLocaleCookie();
      const pageLang = document.documentElement.lang;
      const wantsKorean = isKorean(desired);
      // First run: the app ignores a bare "ko", so require the exact value. Afterwards accept
      // any ko* cookie (the BICO script writes "ko") to avoid fighting it, but still fix a
      // page whose rendered language is not Korean.
      const cookieOk = firstRun
        ? cookie !== null && cookie.toLowerCase() === desired.toLowerCase()
        : (wantsKorean ? isKorean(cookie) : cookie !== null && cookie.toLowerCase() === desired.toLowerCase());
      const pageOk = !wantsKorean || !pageLang || isKorean(pageLang);
      firstRun = false;
      if (cookieOk && pageOk) return;
      const beforeApp = appNotStarted();
      document.cookie = 'locale=' + encodeURIComponent(desired) + '; path=/; max-age=31536000; secure; samesite=lax';
      if (!beforeApp && langGuardAllows()) location.reload();
    });
  }

  enforceLanguage();
  timer = setInterval(enforceLanguage, CHECK_MS);
})();
