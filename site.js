import { RELEASE_COPY } from './copy.mjs';
let lang = navigator.language.startsWith('ko') ? 'ko' : 'en';
let release = null, status = 'loading';
const repository = 'suhwang-atomy/agent-platform-releases';
const t = key => RELEASE_COPY[`release.${key}`]?.[lang === 'en' ? 1 : 0] ?? key;
function render() {
  document.documentElement.lang = lang;
  document.querySelector('[data-label]').setAttribute('aria-label', t('downloads'));
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelector('#language').textContent = lang === 'ko' ? 'English' : '한국어';
  document.querySelector('#status').textContent = release ? `AOA ${release.tag_name}` : t(status);
  document.querySelector('#notes').textContent = release?.body?.slice(0,20000) || t('notesEmpty');
  document.querySelector('#date').textContent = release?.published_at ? new Date(release.published_at).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US') : '';
  for (const link of document.querySelectorAll('[data-file]')) {
    const asset = release?.assets?.find(a => a.name === link.dataset.file && a.size > 0);
    const prefix = `https://github.com/${repository}/releases/download/`;
    const available = asset?.browser_download_url?.startsWith(prefix);
    link.classList.toggle('disabled', !available);
    link.setAttribute('aria-disabled', String(!available));
    link.textContent = t(available ? 'download' : 'preparing');
    if (available) link.href = asset.browser_download_url; else link.removeAttribute('href');
  }
}
document.querySelector('#language').addEventListener('click', () => { lang = lang === 'ko' ? 'en' : 'ko'; render(); });
render();
try {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, { headers: { Accept:'application/vnd.github+json' }, signal:AbortSignal.timeout(12000) });
  if (response.status === 404) status = 'unpublished';
  else {
    if (!response.ok) throw new Error('release fetch failed');
    const data = await response.json();
    if (data.draft || data.prerelease || !/^v\d+\.\d+\.\d+$/.test(data.tag_name) || !Array.isArray(data.assets)) throw new Error('invalid release');
    release = data;
  }
} catch { status = 'failed'; }
render();
