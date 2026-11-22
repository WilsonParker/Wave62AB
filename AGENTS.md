# PROJECT KNOWLEDGE BASE

**Generated:** 2026-11-22
**Commit:** beab010
**Branch:** master

## OVERVIEW
Manifest V3 Chrome extension for Inditex CS staff: pins the display language on ALMA and BICO, and shows a floating Cases-summary Panel on BICO order pages. Plain vanilla JS, no build step, no dependencies. Domain vocabulary lives in `CONTEXT.md` - use its terms (Panel, Popup, Section, Case, SUBTYPE code).

## STRUCTURE
```
Wave62AB/
├── manifest.json        # content-script routing by URL path; single source of wiring
├── CONTEXT.md           # glossary - read before naming anything
├── icons/               # PNG used by manifest; SVG sources kept beside them
└── src/
    ├── background.js    # service worker: rewrites BICO `locale` cookie via chrome.cookies
    ├── alma.js          # content script on /almafeshll/*: language enforcement only
    ├── bico.js          # content script on /bico/*: language + Panel + Cases stats (~650 lines)
    ├── interceptor.js   # injected into PAGE world by bico.js; hooks fetch/XHR
    └── popup.html/.js   # toolbar Popup: ALMA section + BICO section
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a setting | `popup.html`, `popup.js`, consumer script | Defaults are duplicated in each `chrome.storage.sync.get({...})` call - keep them identical |
| ALMA language bug | `src/alma.js` `enforceLanguage` | Writes cookie directly via `document.cookie` |
| BICO language bug | `src/bico.js` `enforceLanguage` -> `background.js` `setLocaleCookie` | Goes through the service worker (`setLocale` message) |
| Cases not captured | `src/interceptor.js` `extractCasesArray` | Any URL matching `/cases/i`; tries keys cases/data/items/results/content/records |
| Cases parsed wrong | `src/bico.js` `buildStats`, `resolveSubtypeCode`, `parseDomCases` | API path and DOM-table fallback both feed `buildStats` |
| Panel UI / new Section | `src/bico.js` `ensurePanel`, `setSection`, `getStyles` | One Section = one `setSection(name, ...)` key |
| Host / URL scope | `manifest.json` | Only `https://apps.inditex.com/*` |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `setLocaleCookie` | fn | background.js | Updates every existing `locale` cookie preserving domain/path/flags |
| `enforceLanguage` | fn | alma.js, bico.js | Polling loop (2s ALMA / 3s BICO) restoring the Language setting |
| `langGuardAllows` | fn | alma.js, bico.js | sessionStorage reload limiter: max 2 reloads / 60s |
| `__bico_cases__` | CustomEvent | interceptor.js -> bico.js | Page-world to content-script bridge carrying the Cases array |
| `autoLoadCases` | fn | bico.js | Clicks the Cases tab, waits for render, returns to the original tab |
| `buildStats` | fn | bico.js | Last-year filter, count per SUBTYPE code, best description per code |
| `setSection` | fn | bico.js | Creates/updates a minimisable Section in the Panel |

## CONVENTIONS
- Every script is a single IIFE (except background/popup); no modules, no imports, no bundler.
- Storage keys (`chrome.storage.sync`): `almaLocale` (default `ko-KR`), `almaEnabled`, `bicoLocale` (default `ko`), `bicoEnabled`, `panelEnabled` (all default `true`).
- Language setting format differs per app: ALMA needs region codes (`ko-KR`; bare `ko` is ignored by the app - `LOCALE_ALIASES` maps it), BICO needs bare codes (`ko`).
- Korean UI strings inside `bico.js` are written as `\uXXXX` escapes; `popup.html`/`popup.js` use literal Korean. Follow the file you are in.
- Panel state (position, minimised Sections, dismissed order) is in-memory only; resets on reload.
- Content scripts stop their timers when `chrome.runtime.id` is gone (extension reloaded) - keep that check in any new interval.

## ANTI-PATTERNS (THIS PROJECT)
- NEVER reload without `langGuardAllows()` - ALMA and BICO share one `locale` cookie and can fight into a reload loop.
- ALMA after first run must accept any `ko*` cookie when Korean is wanted: BICO writes `ko`, ALMA wants `ko-KR`; strict equality makes the two scripts flip each other.
- Do not access page JS (`window.fetch`, app state) from `bico.js` directly - content scripts are isolated; go through `interceptor.js` and the `__bico_cases__` event.
- Do not add `interceptor.js` to `content_scripts`; it must stay in `web_accessible_resources` and be injected as a `<script>` tag.
- Insert Panel HTML only through `escHtml` for data values.

## NOTES
- `findCasesTabContent` in `bico.js` is unused.
- `findTab` matches leaf elements by visible text (`cases`, or first word of the tab name) - breaks if BICO localises tab labels.
- DOM fallback date regex expects `DD/MM/YYYY[, HH:MM[:SS]]` (BICO UI) or ISO; `parseDate` also takes 10/13-digit Unix timestamps.
- Popup save text says changes apply after tab refresh; only `panelEnabled` is live via `storage.onChanged`.
- `.idea/` and `Wave62AB.iml` are IDE files (`.idea` git-ignored).

## COMMANDS
```bash
# No build, lint, or tests. Load unpacked:
#   chrome://extensions -> Developer mode -> Load unpacked -> repo root
# After edits: click reload on the extension card, then refresh the ALMA/BICO tab.
```
