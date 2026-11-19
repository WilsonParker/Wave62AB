const ALMA_URL = 'https://apps.inditex.com/almafeshll/web';
const $ = id => document.getElementById(id);

chrome.storage.sync.get(
  { almaLocale: 'ko-KR', almaEnabled: true, bicoLocale: 'ko', bicoEnabled: true, panelEnabled: true },
  s => {
    $('almaEnabled').checked = s.almaEnabled;
    $('almaLocale').value = s.almaLocale;
    $('bicoEnabled').checked = s.bicoEnabled;
    $('bicoLocale').value = s.bicoLocale;
    $('panelEnabled').checked = s.panelEnabled;
  }
);

chrome.cookies.getAll({ url: ALMA_URL, name: 'locale' }, cookies => {
  $('current').textContent = cookies.length
    ? '현재 locale 쿠키: ' + cookies.map(c => c.value + ' (' + c.domain + c.path + ')').join(', ')
    : 'locale 쿠키가 없습니다. ALMA에 로그인한 뒤 다시 열어 주세요.';
});

$('save').addEventListener('click', () => {
  chrome.storage.sync.set(
    {
      almaLocale: $('almaLocale').value.trim(),
      almaEnabled: $('almaEnabled').checked,
      bicoLocale: $('bicoLocale').value.trim(),
      bicoEnabled: $('bicoEnabled').checked,
      panelEnabled: $('panelEnabled').checked,
    },
    () => {
      $('status').textContent = '저장됨 - 탭을 새로고침하면 적용됩니다';
      setTimeout(() => { $('status').textContent = ''; }, 2000);
    }
  );
});
