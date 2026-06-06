/* Global Logistics Empire — site i18n loader
* Loads /locales/{code}.json, applies translations to [data-i18n] / [data-i18n-attr],
* remembers choice in localStorage, falls back to EN.
*/
(function () {
const LANGUAGES = [
{ code: 'en', label: 'EN', flag: '🇬🇧' },
{ code: 'cs', label: 'CS', flag: '🇨🇿' },
{ code: 'de', label: 'DE', flag: '🇩🇪' },
{ code: 'fr', label: 'FR', flag: '🇫🇷' },
{ code: 'es', label: 'ES', flag: '🇪🇸' },
{ code: 'it', label: 'IT', flag: '🇮🇹' },
{ code: 'nl', label: 'NL', flag: '🇳🇱' },
{ code: 'pl', label: 'PL', flag: '🇵🇱' },
{ code: 'hu', label: 'HU', flag: '🇭🇺' },
{ code: 'ro', label: 'RO', flag: '🇷🇴' },
{ code: 'uk', label: 'UA', flag: '🇺🇦' },
{ code: 'ru', label: 'RU', flag: '🇷🇺' },
{ code: 'pt-br', label: 'PT-BR', flag: '🇧🇷' },
{ code: 'tr', label: 'TR', flag: '🇹🇷' },
{ code: 'id', label: 'ID', flag: '🇮🇩' },
{ code: 'ar', label: 'AR', flag: '🇸🇦' },
{ code: 'sv', label: 'SV', flag: '🇸🇪' },
{ code: 'no', label: 'NO', flag: '🇳🇴' },
{ code: 'da', label: 'DA', flag: '🇩🇰' },
{ code: 'fi', label: 'FI', flag: '🇫🇮' },
{ code: 'ja', label: 'JA', flag: '🇯🇵' },
{ code: 'ko', label: 'KO', flag: '🇰🇷' },
{ code: 'hi', label: 'HI', flag: '🇮🇳' },
{ code: 'pk', label: 'PK', flag: '🇵🇰' },
];
const LS_KEY = 'gle_site_lang';
const FALLBACK = 'en';
const BASE_PATH = 'locales/';
// Map menu code -> possible filenames in /locales/ (first existing wins)
const FILE_ALIASES = {
'uk': ['uk', 'ua'],
'pt-br': ['pt-br', 'pt-BR', 'ptbr'],
};
const cache = {};
let fallbackDict = null;

function detectLang() {
const saved = localStorage.getItem(LS_KEY);
if (saved && LANGUAGES.some(l => l.code === saved)) return saved;
const nav = (navigator.language || 'en').toLowerCase();
if (nav.startsWith('pt-br') || nav.startsWith('pt')) return 'pt-br';
const base = nav.split('-')[0];
const map = { ua: 'uk' };
const code = map[base] || base;
return LANGUAGES.some(l => l.code === code) ? code : FALLBACK;
}

async function fetchFirst(names) {
for (const n of names) {
try {
const res = await fetch(BASE_PATH + n + '.json', { cache: 'no-cache' });
if (res.ok) return await res.json();
} catch (_) { /* try next */ }
}
return null;
}

async function loadDict(code) {
if (cache[code]) return cache[code];
const names = FILE_ALIASES[code] || [code];
const dict = await fetchFirst(names);
if (dict) { cache[code] = dict; return dict; }
console.warn('[i18n] missing locale file for', code, '— tried', names);
return null;
}

function applyDict(dict) {
document.querySelectorAll('[data-i18n]').forEach(el => {
const key = el.getAttribute('data-i18n');
const val = (dict && dict[key]) || (fallbackDict && fallbackDict[key]);
if (val == null) return;
const attr = el.getAttribute('data-i18n-attr');
if (attr) el.setAttribute(attr, val);
else el.textContent = val;
});
document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
const key = el.getAttribute('data-i18n-placeholder');
const val = (dict && dict[key]) || (fallbackDict && fallbackDict[key]);
if (val != null) el.setAttribute('placeholder', val);
});
}

async function setLanguage(code) {
if (!LANGUAGES.some(l => l.code === code)) code = FALLBACK;
if (!fallbackDict) fallbackDict = await loadDict(FALLBACK);
const dict = code === FALLBACK ? fallbackDict : await loadDict(code);
applyDict(dict || fallbackDict || {});
localStorage.setItem(LS_KEY, code);
document.documentElement.setAttribute('lang', code);
document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
const meta = LANGUAGES.find(l => l.code === code);
const flagEl = document.getElementById('langFlag');
const codeEl = document.getElementById('langCode');
if (flagEl) flagEl.textContent = meta.flag;
if (codeEl) codeEl.textContent = meta.label;
renderMenu(code);
}

function renderMenu(active) {
const menu = document.getElementById('langMenu');
if (!menu) return;
menu.innerHTML = '';
LANGUAGES.forEach(l => {
const btn = document.createElement('button');
btn.className = 'lang-item' + (l.code === active ? ' active' : '');
btn.setAttribute('role', 'option');
btn.innerHTML = '<span class="flag">' + l.flag + '</span><span>' + l.label + '</span><span class="code">' + l.code.toUpperCase() + '</span>';
btn.addEventListener('click', () => { closeMenu(); setLanguage(l.code); });
menu.appendChild(btn);
});
}

function openMenu() {
document.getElementById('langMenu').classList.add('open');
document.getElementById('langBtn').setAttribute('aria-expanded', 'true');
}
function closeMenu() {
const m = document.getElementById('langMenu');
const b = document.getElementById('langBtn');
if (m) m.classList.remove('open');
if (b) b.setAttribute('aria-expanded', 'false');
}

function initToc() {
const btn = document.getElementById('tocBtn');
const drawer = document.getElementById('tocDrawer');
if (!btn || !drawer) return;
btn.addEventListener('click', (e) => { e.stopPropagation(); drawer.classList.toggle('open'); });
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
document.addEventListener('click', (e) => {
if (!e.target.closest('#tocDrawer') && !e.target.closest('#tocBtn')) drawer.classList.remove('open');
});
}

function initFeedback() {
const form = document.getElementById('feedbackForm');
if (!form) return;
form.addEventListener('submit', (e) => {
e.preventDefault();
const name = (form.querySelector('[name="name"]').value || '').trim();
const msg = (form.querySelector('[name="message"]').value || '').trim();
if (!msg) return;
const subject = encodeURIComponent('GLE feedback from ' + (name || 'anonymous'));
const body = encodeURIComponent(msg + '\n\n— ' + (name || 'anonymous'));
window.location.href = 'mailto:akrijsoft@gmail.com?subject=' + subject + '&body=' + body;
const ok = document.getElementById('feedbackOk');
if (ok) ok.style.display = 'block';
form.reset();
});
}

document.addEventListener('DOMContentLoaded', () => {
const langBtn = document.getElementById('langBtn');
if (langBtn) {
langBtn.addEventListener('click', (e) => {
e.stopPropagation();
const open = document.getElementById('langMenu').classList.contains('open');
open ? closeMenu() : openMenu();
});
document.addEventListener('click', (e) => { if (!e.target.closest('.lang-switch')) closeMenu(); });
}
initToc();
initFeedback();
setLanguage(detectLang());
});
})();
