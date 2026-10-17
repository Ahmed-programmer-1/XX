/* لا تعدّل هذا الملف — هذه دالة داخلية يستخدمها كل ملف كورس تلقائيًا */
function registerCourse(id, data) {
  window.__HAKIM_COURSES = window.__HAKIM_COURSES || {};
  window.__HAKIM_COURSES[id] = data;
}

/* ============================================================
   common.js — دوال مشتركة بين كل صفحات الموقع
   ============================================================ */

function hakimEscapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

const __hakimLoadedScripts = {};
/* ملفات البيانات (إعدادات الموقع/القوائم/الكورسات) بنطلبها بنسخة كل 30 ثانية، عشان تعديلات الأدمن (وضع الصيانة مثلًا)
   تظهر بسرعة بدل ما تستنى كاش المتصفح والـCDN (حوالي 10 دقايق على GitHub Pages) */
function hakimVersioned(src) {
  if (/^vendor\//.test(src) || /^media-utils\.js/.test(src) || /[?&]v=/.test(src)) return src;
  return src + (src.indexOf('?') > -1 ? '&' : '?') + 'v=' + Math.floor(Date.now() / 30000);
}
function hakimLoadScript(src) {
  if (__hakimLoadedScripts[src]) return __hakimLoadedScripts[src];
  __hakimLoadedScripts[src] = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = hakimVersioned(src);
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return __hakimLoadedScripts[src];
}

/* ---------------- زر تثبيت التطبيق (PWA) ---------------- */
let __hakimInstallPrompt = null;
function hakimIsStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function hakimIsIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function hakimSyncInstallButton() { document.querySelectorAll('#installAppBtn').forEach(b => { b.style.display = hakimIsStandalone() ? 'none' : ''; }); }
window.addEventListener('appinstalled', () => {
  window.__hakimBIP = null;
  document.querySelectorAll('#installAppBtn').forEach(b => { b.style.display = 'none'; });
  if (typeof hakimToast === 'function') hakimToast('تم تثبيت التطبيق بنجاح ✅', 'success');
});
function hakimShowInstallHelp() {
  const ios = hakimIsIOS();
  const inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|MicroMessenger/i.test(navigator.userAgent);
  const body = ios
    ? '<p style="margin:0 0 8px;font-size:.88rem;color:var(--text-muted)">آبل ما بتسمحش بالتثبيت بضغطة واحدة في آيفون/آيباد — لازم 3 خطوات سريعة من سفاري:</p><ol style="margin:0 0 14px;padding-inline-start:20px;line-height:1.9;font-size:.9rem;color:var(--text-muted)"><li>اضغط زر المشاركة ⬆️</li><li>اختر "إضافة إلى الشاشة الرئيسية"</li><li>اضغط "إضافة"</li></ol>'
    : '<p style="margin:0 0 14px;line-height:1.8;font-size:.9rem;color:var(--text-muted)">' + (inApp ? 'المتصفح المدمج داخل التطبيق ده مش بيدعم التثبيت — افتح الرابط في Chrome أو Edge وجرّب تاني.' : 'المتصفح ده مش بيدعم التثبيت المباشر. افتح الموقع في Chrome أو Edge وهتلاقي التثبيت بضغطة واحدة.') + '</p>';
  const old = document.getElementById('installHelpOverlay'); if (old) old.remove();
  const ov = document.createElement('div'); ov.id = 'installHelpOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
  ov.innerHTML = '<div role="dialog" aria-modal="true" style="background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:20px;max-width:360px;width:100%;color:var(--text);box-shadow:0 20px 50px rgba(0,0,0,.5)"><h3 style="margin:0 0 10px;font-size:1.05rem">تثبيت التطبيق على الشاشة الرئيسية</h3>' + body + '<button type="button" style="width:100%;background:var(--red);color:#fff;border:0;border-radius:10px;padding:10px;font:inherit;font-weight:700;cursor:pointer">تمام</button></div>';
  ov.addEventListener('click', (e) => { if (e.target === ov || e.target.tagName === 'BUTTON') ov.remove(); });
  document.body.appendChild(ov);
}
/* ينتظر حدث beforeinstallprompt لحظة قصيرة (مصدره سكربت صغير في أول الصفحة) */
function hakimWaitForInstallPrompt(ms) {
  return new Promise(resolve => {
    if (window.__hakimBIP) return resolve(window.__hakimBIP);
    const t = setTimeout(() => { window.removeEventListener('hakim-bip', on); resolve(null); }, ms);
    function on() { clearTimeout(t); resolve(window.__hakimBIP); }
    window.addEventListener('hakim-bip', on, { once: true });
  });
}
async function hakimInstallApp(btn) {
  if (hakimIsStandalone()) { if (typeof hakimToast === 'function') hakimToast('التطبيق مثبّت عندك بالفعل ✅', 'success'); return; }
  const ev = window.__hakimBIP || (hakimIsIOS() ? null : await hakimWaitForInstallPrompt(1800));
  if (!ev) { hakimShowInstallHelp(); return; }
  window.__hakimBIP = null;
  try {
    ev.prompt();
    const r = await ev.userChoice;
    if (r && r.outcome === 'accepted') btn.style.display = 'none';
  } catch (e) { hakimShowInstallHelp(); }
}
function hakimInitInstallButton() {
  const btn = document.getElementById('installAppBtn');
  if (!btn) return;
  hakimSyncInstallButton();
  btn.addEventListener('click', () => hakimInstallApp(btn));
  if ('serviceWorker' in navigator && !window.__HAKIM_PREVIEW) navigator.serviceWorker.register('sw.js').catch(() => {});
}

const HAKIM_PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0f13"/><stop offset="1" stop-color="#0f1016"/></linearGradient></defs><rect width="300" height="450" fill="url(#g)"/><circle cx="150" cy="215" r="46" fill="none" stroke="#e5202c" stroke-width="3" opacity=".85"/><path d="M138 192v46l38-23z" fill="#e5202c" opacity=".9"/></svg>`);

/* إعدادات الموقع (اسم/فوتر/حقوق) — يتم تحميلها وتطبيقها على أي عنصر بالكلاسات المذكورة */
async function hakimApplySiteSettings() {
  await hakimLoadScript('site-settings.js');
  const s = window.SITE_SETTINGS || {};
  if (s.siteName) { document.querySelectorAll('.js-site-name').forEach(el => { el.textContent = s.siteName; }); const baked = s.siteNameApplied || 'منصة حكيم التعليمية'; if (baked !== s.siteName) document.title = document.title.split(baked).join(s.siteName); }
  if (s.tagline) document.querySelectorAll('.js-tagline').forEach(el => { el.textContent = s.tagline; });
  if (s.footerRights) document.querySelectorAll('.js-footer-rights').forEach(el => { el.textContent = s.footerRights; });
  if (s.footerNote) document.querySelectorAll('.js-footer-note').forEach(el => { el.textContent = s.footerNote; });
  return s;
}

async function hakimRenderSideMenu() {
  const host = document.getElementById('sideMenuItems');
  if (!host) return;
  try { await hakimLoadScript('menu-config.js'); } catch (e) {}
  const P = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z',
    folder: 'M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z', mail: 'M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5z',
    bell: 'M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z', chart: 'M5 9h3v10H5zm5-5h3v15h-3zm5 8h3v7h-3z',
    cal: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14z', bulb: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z'
  };
  /* لو menu-config.js ما اتحمّلش (نت ضعيف / فتح من ملف محلي) القائمة ما تفضلش فاضية */
  const cfg = (window.MENU_CONFIG && window.MENU_CONFIG.length) ? window.MENU_CONFIG : [
    { label: 'الإشعارات', href: 'hub.html?tab=notifications', type: 'other', icon: P.bell }, { label: 'الاستطلاعات', href: 'hub.html?tab=polls', type: 'other', icon: P.chart },
    { label: 'مواعيد العرض', href: 'hub.html?tab=schedule', type: 'other', icon: P.cal }, { label: 'الاقتراحات والأفكار', href: 'hub.html?tab=suggestions', type: 'other', icon: P.bulb }
  ];
  const vis = cfg.filter(it => it.visible !== false);
  const link = (it, ico) => `<a class="menu-link${hakimIsHere(it.href || '#') ? ' current' : ''}" href="${hakimEscapeHtml(it.href || '#')}"><svg viewBox="0 0 24 24"><path d="${it.icon || ico}"/></svg>${hakimEscapeHtml(it.label || '')}</a>`;
  const sections = vis.filter(it => it.type === 'section'), others = vis.filter(it => it.type !== 'section');
  const accounts = !!((window.SITE_SETTINGS || {}).supabaseUrl);
  const contact = [{ label: 'اتصل بنا', href: 'hub.html?tab=contact' }, { label: 'الشكاوى والبلاغات', href: 'hub.html?tab=complaint' }, { label: 'DMCA', href: 'hub.html?tab=dmca' }, { label: 'أريد العمل معكم', href: 'hub.html?tab=join' }];
  host.innerHTML = link({ label: 'الرئيسية', href: 'index.html' }, P.home)
    + (accounts ? link({ label: 'ملفي الشخصي', href: 'profile.html' }, P.user) : '')
    + (sections.length ? '<h3>الأقسام</h3>' + sections.map(it => link(it, P.folder)).join('') : '')
    + (others.length ? '<h3>المزيد</h3>' + others.map(it => link(it, P.folder)).join('') : '')
    + '<h3>تواصل معنا</h3>' + contact.map(it => link(it, P.mail)).join('');
}

function hakimIsHere(href) {
  try {
    const u = new URL(href, location.href), f = p => p.split('/').pop() || 'index.html';
    if (f(u.pathname) !== f(location.pathname)) return false;
    const cur = new URLSearchParams(location.search);
    for (const [k, v] of u.searchParams) if (cur.get(k) !== v) return false;
    return true;
  } catch (e) { return false; }
}
function hakimPlaceDropdown(btn, panel) {
  panel.style.left = ''; panel.style.right = '';
  if (window.matchMedia('(max-width: 640px)').matches) return;
  const wrap = btn.closest('.mylists-wrap'); if (!wrap) return;
  const vw = document.documentElement.clientWidth, w = panel.offsetWidth, wr = wrap.getBoundingClientRect();
  const left = Math.max(10, Math.min(wr.right - w, vw - w - 10));
  panel.style.right = 'auto'; panel.style.left = (left - wr.left) + 'px';
}
function hakimSetDropdownOpen(btn, panel, on) {
  panel._btn = btn;
  panel.classList.toggle('show', on); btn.classList.toggle('active-mylists', on); btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  if (on) hakimPlaceDropdown(btn, panel);
}
window.addEventListener('resize', () => document.querySelectorAll('.mylists-dropdown.show').forEach(p => p._btn && hakimPlaceDropdown(p._btn, p)));

async function hakimRenderSectionsDropdown() {
  const host = document.getElementById('sectionsDropdown');
  if (!host) return;
  await hakimLoadScript('menu-config.js');
  const items = (window.MENU_CONFIG || []).filter(it => it.visible !== false && it.type === 'section');
  if (items.length === 0) {
    host.innerHTML = `<p class="mylists-empty-hint">لا توجد أقسام مضافة بعد.</p>`;
    return;
  }
  host.innerHTML = `<div class="mylists-rows"><a class="mylists-row is-all${hakimIsHere('index.html') ? ' current' : ''}" href="index.html"><span class="name">الصفحة الرئيسية</span></a>${items.map(it =>
    `<a class="mylists-row${hakimIsHere(it.href || '#') ? ' current' : ''}" href="${hakimEscapeHtml(it.href || '#')}"><span class="name">${hakimEscapeHtml(it.label || '')}</span></a>`
  ).join('')}</div>`;
}
function hakimInitSectionsMenu() {
  const btn = document.getElementById('sectionsBtn');
  const panel = document.getElementById('sectionsDropdown');
  if (!btn || !panel) return;
  function open() { const o = document.getElementById('myListsDropdown'), ob = document.getElementById('myListsBtn'); if (o && ob) hakimSetDropdownOpen(ob, o, false); hakimSetDropdownOpen(btn, panel, true); Promise.resolve(hakimRenderSectionsDropdown()).then(() => hakimPlaceDropdown(btn, panel)); }
  function close() { hakimSetDropdownOpen(btn, panel, false); }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.classList.contains('show')) close(); else open();
  });
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && !panel.contains(e.target) && !btn.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

function hakimInitMenu() {
  const btn = document.getElementById('menuBtn');
  const overlay = document.getElementById('menuOverlay');
  const panel = document.getElementById('sideMenu');
  const closeBtn = document.getElementById('menuCloseBtn');
  if (!btn || !overlay || !panel) return;
  hakimRenderSideMenu();
  function open() { overlay.classList.add('show'); panel.classList.add('show'); }
  function close() { overlay.classList.remove('show'); panel.classList.remove('show'); }
  btn.addEventListener('click', open);
  overlay.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
}

function hakimInitTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('hakim_theme', 'dark'); }
    else { document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('hakim_theme', 'light'); }
  });
}

function hakimAddTelegramButton() {
  const s = window.SITE_SETTINGS || {};
  if (!s.telegramUrl) return;
  const a = document.createElement('a');
  a.href = s.telegramUrl; a.target = '_blank'; a.rel = 'noopener';
  a.className = 'floating-telegram'; a.title = 'انضم لقناتنا على تليجرام';
  a.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.92c-.23.23-.42.42-.82.42z"/></svg>`;
  document.body.appendChild(a);
}

/* ============================================================
   قوائمي — المفضلة + المتابعة + قوائم تشغيل مخصصة (محلي بالكامل)
   ============================================================ */
const HAKIM_MYLISTS_KEY = 'hakim_mylists';

function hakimGetMyLists() {
  try {
    const d = JSON.parse(localStorage.getItem(HAKIM_MYLISTS_KEY) || '{}');
    return { favorites: d.favorites || [], following: d.following || [], playlists: d.playlists || [] };
  } catch (e) { return { favorites: [], following: [], playlists: [] }; }
}
function hakimSaveMyLists(d) { localStorage.setItem(HAKIM_MYLISTS_KEY, JSON.stringify(d)); }

function hakimIsFavorite(id) { return hakimGetMyLists().favorites.includes(id); }
function hakimToggleFavorite(id) {
  const d = hakimGetMyLists();
  const i = d.favorites.indexOf(id);
  if (i === -1) d.favorites.unshift(id); else d.favorites.splice(i, 1);
  hakimSaveMyLists(d);
  return i === -1;
}
function hakimIsFollowing(id) { return hakimGetMyLists().following.includes(id); }
function hakimToggleFollowing(id) {
  const d = hakimGetMyLists();
  const i = d.following.indexOf(id);
  if (i === -1) d.following.unshift(id); else d.following.splice(i, 1);
  hakimSaveMyLists(d);
  return i === -1;
}
function hakimCreatePlaylist(name) {
  const d = hakimGetMyLists();
  const pl = { id: 'pl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, courseIds: [] };
  d.playlists.push(pl);
  hakimSaveMyLists(d);
  return pl.id;
}
function hakimRenamePlaylist(plId, name) {
  const d = hakimGetMyLists();
  const pl = d.playlists.find(p => p.id === plId);
  if (pl && name) { pl.name = name; hakimSaveMyLists(d); }
}
function hakimDeletePlaylist(plId) {
  const d = hakimGetMyLists();
  d.playlists = d.playlists.filter(p => p.id !== plId);
  hakimSaveMyLists(d);
}
function hakimIsInPlaylist(plId, courseId) {
  const pl = hakimGetMyLists().playlists.find(p => p.id === plId);
  return !!(pl && pl.courseIds.includes(courseId));
}
function hakimTogglePlaylistCourse(plId, courseId) {
  const d = hakimGetMyLists();
  const pl = d.playlists.find(p => p.id === plId);
  if (!pl) return false;
  const i = pl.courseIds.indexOf(courseId);
  if (i === -1) pl.courseIds.unshift(courseId); else pl.courseIds.splice(i, 1);
  hakimSaveMyLists(d);
  return i === -1;
}

function hakimToast(msg, type) {
  let el = document.getElementById('hakimToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hakimToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(el._hakimToastT);
  el._hakimToastT = setTimeout(() => { el.classList.remove('show'); }, 2500);
}

function hakimRenderMyListsDropdown() {
  const host = document.getElementById('myListsDropdown');
  if (!host) return;
  const d = hakimGetMyLists();
  let rows = `
    <a class="mylists-row is-all" href="hub.html?tab=mylists"><span class="name">عرض كل قوائمي</span></a>
    <a class="mylists-row" href="hub.html?tab=mylists&list=favorites"><span class="name">♥ ${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.favoritesLabel) || 'المفضلة')}</span><span class="count">${d.favorites.length}</span></a>
    <a class="mylists-row" href="hub.html?tab=mylists&list=following"><span class="name">◔ ${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.followingLabel) || 'المتابعة')}</span><span class="count">${d.following.length}</span></a>`;
  if (d.playlists.length) {
    rows += `<div class="mylists-divider"></div>` + d.playlists.map(pl =>
      `<a class="mylists-row" href="hub.html?tab=mylists&list=${encodeURIComponent(pl.id)}"><span class="name">▶ ${hakimEscapeHtml(pl.name)}</span><span class="count">${pl.courseIds.length}</span></a>`
    ).join('');
  }
  host.innerHTML = `
    <div class="mylists-rows">${rows}</div>
    <div class="mylists-divider"></div>
    <form class="mylists-new-form" id="myListsNewForm" autocomplete="off">
      <input type="text" id="myListsNewName" placeholder="${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.newPlaylistPlaceholder) || 'اسم قائمة تشغيل جديدة')}" required>
      <button type="submit">+ ${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.createBtn) || 'إنشاء')}</button>
    </form>`;
  const form = document.getElementById('myListsNewForm');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const input = document.getElementById('myListsNewName');
    const name = input.value.trim();
    if (!name) return;
      if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تعمل قوائم وتحفظ كورساتك')) return;
        hakimCreatePlaylist(name);
    input.value = '';
    hakimRenderMyListsDropdown();
    hakimToast('تم إنشاء قائمة "' + name + '"', 'success');
  });
}

function hakimInitMyListsMenu() {
  const btn = document.getElementById('myListsBtn');
  const panel = document.getElementById('myListsDropdown');
  if (!btn || !panel) return;
  function open() { const o = document.getElementById('sectionsDropdown'), ob = document.getElementById('sectionsBtn'); if (o && ob) hakimSetDropdownOpen(ob, o, false); hakimRenderMyListsDropdown(); hakimSetDropdownOpen(btn, panel, true); }
  function close() { hakimSetDropdownOpen(btn, panel, false); }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.classList.contains('show')) close(); else open();
  });
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && !panel.contains(e.target) && !btn.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

async function hakimRenderHomeAlertBanner(hostId) {
  const host = document.getElementById(hostId);
  if (!host) return;
  await Promise.all([hakimLoadScript('notifications.js'), hakimLoadScript('polls.js')]);
  const notif = (window.NOTIFICATIONS || []).slice(-1)[0];
  const pollsCount = (window.POLLS || []).length;
  if (!notif && pollsCount === 0) return;
  const parts = [];
  if (notif) parts.push(`📢 ${hakimEscapeHtml(notif.title || '')}`);
  if (pollsCount > 0) parts.push(`📋 فيه ${pollsCount} استطلاع جديد`);
  host.innerHTML = `
    <div class="home-alert-banner">
      <svg viewBox="0 0 24 24"><path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1z"/></svg>
      <span>${parts.join(' — ')}</span>
      <a href="hub.html">التفاصيل ←</a>
    </div>`;
}

function hakimLazyFade(img) {
  if (img.complete && img.naturalWidth > 0) { img.classList.add('loaded'); return; }
  img.addEventListener('load', () => img.classList.add('loaded'));
  img.addEventListener('error', () => img.classList.add('loaded'));
}

/* ============================================================
   Supabase — تحليلات، تقييمات، شكاوى، اقتراحات (بدون مكتبات خارجية)
   ============================================================ */
function hakimSbConfig() {
  if (window.__HAKIM_PREVIEW) return { url: '', anonKey: '' }; /* معاينة الأدمن: ما نسجّلش مشاهدات ولا تقييمات */
  const s = window.SITE_SETTINGS || {};
  return { url: s.supabaseUrl || '', anonKey: s.supabaseAnonKey || '' };
}
function hakimSbReady() {
  const c = hakimSbConfig();
  return !!(c.url && c.anonKey);
}
async function hakimSbInsert(table, row) {
  const { url, anonKey } = hakimSbConfig();
  if (!url || !anonKey) return false;
  try {
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: 'POST',
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(row)
    });
    return res.ok;
  } catch (e) { return false; }
}

/* ===== مراقبة الصحة من الزوار الحقيقيين: كل مشكلة بتتسجّل مرة واحدة لكل زائر وبتظهر في "صحة الموقع" بالأدمن ===== */
const __hh = { n: 0, seen: new Set() };
function hakimHealth(type, courseId, ep, detail) {
  try {
    if (window.__HAKIM_PREVIEW) return;
    const cid = courseId || window.__HK_CUR_COURSE || null;
    const key = type + '|' + cid + '|' + ep;
    if (__hh.seen.has(key) || __hh.n >= 15) return;
    __hh.seen.add(key); __hh.n++;
    hakimSbInsert('health_events', { session_id: hakimSessionId(), type, course_id: cid, episode_index: ep != null ? ep : null, page: location.pathname.slice(-80), detail: String(detail || '').slice(0, 300), ua: navigator.userAgent.slice(0, 160) });
  } catch (e) {}
}
window.addEventListener('error', (e) => { hakimHealth('js_error', null, null, (e.message || '') + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '')); });
window.addEventListener('unhandledrejection', (e) => { hakimHealth('js_error', null, null, 'promise: ' + String((e.reason && e.reason.message) || e.reason || '')); });
async function hakimSbUpsert(table, row, conflictCols) {
  const { url, anonKey } = hakimSbConfig();
  if (!url || !anonKey) return false;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflictCols}`, {
      method: 'POST',
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row)
    });
    return res.ok;
  } catch (e) { return false; }
}
async function hakimSbRpc(fn, params) {
  const { url, anonKey } = hakimSbConfig();
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}
async function hakimSbSelect(pathWithQuery) {
  const { url, anonKey } = hakimSbConfig();
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${pathWithQuery}`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

/* حقن كود مخصص (زي سكربت إعلانات Monetag) — بيتفعّل فورًا/يتوقف فورًا
   عبر مفتاح site_config.ads.enabled في Supabase، حتى لو الكود نفسه
   محفوظ بالفعل في site-settings.js (المتحكم السريع هو التفعيل بس) */
function hakimShowMaintenanceIfNeeded() {
  if (window.__HAKIM_PREVIEW) return false;
  const s = window.SITE_SETTINGS || {};
  if (!s.maintenanceMode) return false;
  location.replace('maintenance.html');
  return true;
}

async function hakimInjectCustomCode() {
  const s = window.SITE_SETTINGS || {};
  if (!s.customCode || !hakimSbReady()) return;
  try {
    const rows = await hakimSbSelect('site_config?key=eq.ads&select=value');
    const adsEnabled = !!(rows && rows[0] && rows[0].value && rows[0].value.enabled);
    if (!adsEnabled) return;
  } catch (e) { return; }
  try {
    const holder = document.createElement('div');
    holder.innerHTML = s.customCode;
    Array.from(holder.childNodes).forEach(node => {
      if (node.tagName === 'SCRIPT') {
        const s2 = document.createElement('script');
        Array.from(node.attributes || []).forEach(a => s2.setAttribute(a.name, a.value));
        if (!node.src) s2.textContent = node.textContent;
        document.body.appendChild(s2);
      } else {
        document.body.appendChild(node);
      }
    });
  } catch (e) { /* كود مخصص خاطئ — يتجاهل بصمت عشان ميكسرش باقي الصفحة */ }
}

function hakimSessionId() {
  let sid = localStorage.getItem('hakim_session_id');
  if (!sid) {
    sid = 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
    localStorage.setItem('hakim_session_id', sid);
  }
  return sid;
}

function hakimDetectAdblock() {
  return new Promise((resolve) => {
    const bait = document.createElement('div');
    bait.className = 'ad-banner ads ad-container adsbox';
    bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
    document.body.appendChild(bait);
    setTimeout(() => {
      const blocked = !bait.offsetParent || bait.offsetHeight === 0 || getComputedStyle(bait).display === 'none';
      bait.remove();
      resolve(blocked);
    }, 100);
  });
}

async function hakimDetectCountry() {
  try {
    const cached = sessionStorage.getItem('hakim_country');
    if (cached) return cached;
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return '';
    const data = await res.json();
    const country = data.country_name || '';
    sessionStorage.setItem('hakim_country', country);
    return country;
  } catch (e) { return ''; }
}

async function hakimTrackPageView(page, courseId, episodeIndex) {
  if (!hakimSbReady()) return;
  const [country, isAdblock] = await Promise.all([hakimDetectCountry(), hakimDetectAdblock()]);
  hakimSbInsert('page_views', { session_id: hakimSessionId(), page, course_id: courseId || null, episode_index: episodeIndex != null ? episodeIndex : null, country, is_adblock: isAdblock });
}

/* ============================================================
   HakimPlayer — مشغّل فيديو مخصص وقابل لإعادة الاستخدام
   ============================================================ */
const HakimPlayer = (() => {

  /* اكتشاف نوع المصدر وطريقة التشغيل — المنطق في media-utils.js (مشترك مع لوحة الأدمن) */
  function detectSource(url, forced) {
    if (window.HakimMedia) return window.HakimMedia.detect(url, forced);
    return { sourceType: 'embed', playbackStrategy: 'iframe', confidence: 'low', src: String(url || '') };
  }
  let activeEngine = null; /* hls.js شغّال حاليًا — يتفرّغ عند تغيير الحلقة */
  function destroyEngine() {
    if (activeEngine) { try { activeEngine.destroy(); } catch (e) {} activeEngine = null; }
  }
  async function attachEngine(kind, video, src, onFatal) {
    if (kind !== 'hls') return;
    /* hls.js أولًا: بيشتغل على أي متصفح فيه MSE حتى لو المتصفح بيقول إنه بيدعم HLS بنفسه (دعمه الأصلي محدود في كروم/إيدج).
       المشغّل الأصلي للمتصفح بنستخدمه بس لو hls.js مش مدعوم (آيفون وآيباد) */
    const loaded = await hakimLoadScript('vendor/hls.min.js');
    if (loaded && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls(); activeEngine = hls;
      let recovered = false;
      hls.on(window.Hls.Events.ERROR, (ev, d) => {
        if (!d || !d.fatal) return;
        if (d.type === window.Hls.ErrorTypes.MEDIA_ERROR && !recovered) { recovered = true; hls.recoverMediaError(); return; }
        onFatal('failed');
      });
      hls.loadSource(src); hls.attachMedia(video);
      return;
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = src; return; }
    onFatal('unsupported');
  }

  function formatTime(sec) {
    if (!isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function svgIcon(path, extra) {
    return `<svg viewBox="0 0 24 24" ${extra || ''}><path d="${path}"/></svg>`;
  }

  const ICONS = {
    play: 'M8 5v14l11-7z',
    pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
    back10: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
    fwd10: 'M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z',
    fullscreen: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
    volUp: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
    volMute: 'M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.94 8.94 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    warn: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'
  };

  function mount(container, { src, type, storageKey, onEnded, onStarted, onWatched, onState, onProgress, onHealth, meta, antiPopup }) {
    const health = (t, d) => { try { if (typeof onHealth === 'function') onHealth(t, d); } catch (e) {} };
    container.innerHTML = '';
    destroyEngine();
    const source = detectSource(src, type);
    src = source.src;
    const nativeSrc = source.playbackStrategy === 'native';
    /* تقرير حالة التشغيل (بيستخدمه "معاين المشغل" في الأدمن) */
    const emit = (state, extra) => { try { if (typeof onState === 'function') onState(Object.assign({ state, strategy: source.playbackStrategy, sourceType: source.sourceType, src }, extra || {})); } catch (e) {} };

    if (source.playbackStrategy === 'iframe') {
      const wrap = document.createElement('div');
      wrap.className = 'hp-video-wrap';
      /* مزيل الإعلانات (anti-popup.js): لو الأدمن فعّله لهذه الحلقة، الـ iframe بيتحط له sandbox من البداية فيتمنع فتح نوافذ الإعلانات */
      const sandboxAttr = antiPopup ? ' sandbox="allow-scripts allow-same-origin"' : '';
      wrap.innerHTML = `<iframe src="${String(src).replace(/"/g, '&quot;')}"${sandboxAttr} allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>`;
      emit('embed', { sandbox: antiPopup ? 'allow-scripts allow-same-origin' : '' });
      container.appendChild(wrap);
      { const fr = wrap.querySelector('iframe'); let loaded = false; fr.addEventListener('load', () => { loaded = true; }); setTimeout(() => { if (!loaded) health('embed_no_load', String(src).slice(0, 120)); }, 15000); }
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'hp-video-wrap';
    wrap.innerHTML = `
      <video playsinline preload="metadata"${nativeSrc ? ` src="${String(src).replace(/"/g, '&quot;')}"` : ''}></video>
      <div class="hp-loading" data-role="loading"><div class="hp-spinner"></div></div>
      <div class="hp-error" data-role="error">
        ${svgIcon(ICONS.warn)}
        <strong data-role="errTitle">تعذّر تحميل الفيديو</strong>
        <p data-role="errMsg">تحقق من الاتصال أو من صحة الرابط.</p>
      </div>
      <div class="hp-center-play" data-role="centerPlay" role="button" tabindex="0" aria-label="تشغيل الفيديو">
        ${svgIcon(ICONS.play)}
      </div>
      <div class="hp-bottom" data-role="bottomBar">
        <div class="hp-progress-row">
          <span class="hp-time" data-role="time">00:00 / 00:00</span>
          <div class="hp-progress-wrap">
            <span class="hp-hover-preview" data-role="hoverPreview">00:00</span>
            <input type="range" class="hp-progress-bar" data-role="progress" value="0" min="0" max="100" step="0.1" aria-label="شريط تقدم الفيديو">
          </div>
        </div>
        <div class="hp-controls">
          <button class="hp-btn" data-role="back" title="تأخير 10 ثواني" aria-label="تأخير 10 ثواني">${svgIcon(ICONS.back10)}10</button>
          <button class="hp-btn play-pause" data-role="playPause" title="تشغيل / إيقاف" aria-label="تشغيل أو إيقاف">
            <span data-role="playIcon">${svgIcon(ICONS.play)}</span>
            <span data-role="pauseIcon" style="display:none">${svgIcon(ICONS.pause)}</span>
          </button>
          <button class="hp-btn" data-role="forward" title="تقديم 10 ثواني" aria-label="تقديم 10 ثواني">10${svgIcon(ICONS.fwd10)}</button>
          <div class="hp-volume-wrap">
            <button class="hp-btn" data-role="mute" style="padding:6px" title="كتم/إلغاء كتم الصوت" aria-label="كتم أو إلغاء كتم الصوت">
              <span data-role="volIcon">${svgIcon(ICONS.volUp)}</span>
              <span data-role="muteIcon" style="display:none">${svgIcon(ICONS.volMute)}</span>
            </button>
            <input type="range" class="hp-volume-bar" data-role="volume" min="0" max="1" step="0.01" value="1" aria-label="مستوى الصوت">
          </div>
          <select class="hp-speed" data-role="speed" title="سرعة التشغيل" aria-label="سرعة التشغيل">
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1" selected>1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
          <button class="hp-btn" data-role="fullscreen" title="ملء الشاشة" aria-label="ملء الشاشة">${svgIcon(ICONS.fullscreen)}</button>
        </div>
      </div>
    `;
    container.appendChild(wrap);

    const video = wrap.querySelector('video');
    const q = (role) => wrap.querySelector(`[data-role="${role}"]`);
    const loading = q('loading'), errorBox = q('error'), centerPlay = q('centerPlay'),
          timeLabel = q('time'), progress = q('progress'),
          hoverPreview = q('hoverPreview'), playPauseBtn = q('playPause'),
          playIcon = q('playIcon'), pauseIcon = q('pauseIcon'), backBtn = q('back'),
          forwardBtn = q('forward'), muteBtn = q('mute'), volIcon = q('volIcon'),
          muteIcon = q('muteIcon'), volumeBar = q('volume'), speedSelect = q('speed'),
          fullscreenBtn = q('fullscreen');

    /* تفضيلات المشغّل (الصوت/الكتم/السرعة) تفضل ثابتة من حلقة للتانية */
    const PREF_KEY = 'hakim_player_prefs';
    const readPrefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; } };
    const writePrefs = (patch) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(Object.assign(readPrefs(), patch))); } catch (e) {} };
    {
      const p = readPrefs();
      if (typeof p.volume === 'number' && p.volume >= 0 && p.volume <= 1) { video.volume = p.volume; volumeBar.value = p.volume; }
      if (p.muted) video.muted = true;
      if (p.speed && [0.5, 0.75, 1, 1.25, 1.5, 2].includes(p.speed)) { video.playbackRate = p.speed; speedSelect.value = String(p.speed); }
    }
    video.addEventListener('volumechange', () => writePrefs({ volume: video.volume, muted: video.muted }));

    function pulse(btn) { btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse'); }
    function showSeekHint(delta) {
      let h = wrap.querySelector('.hp-seek-hint'); if (h) h.remove();
      h = document.createElement('div'); h.className = 'hp-seek-hint ' + (delta < 0 ? 'back' : 'fwd');
      h.textContent = (delta < 0 ? '−' : '+') + Math.abs(delta) + ' ث'; wrap.appendChild(h);
      setTimeout(() => h.remove(), 700);
    }
    function togglePlay() { video.paused ? video.play() : video.pause(); }
    function updateCenterPlay() { centerPlay.classList.toggle('show', video.paused); }

    video.addEventListener('play', () => { playIcon.style.display = 'none'; pauseIcon.style.display = 'block'; updateCenterPlay(); });
    video.addEventListener('pause', () => { playIcon.style.display = 'block'; pauseIcon.style.display = 'none'; updateCenterPlay(); });
    video.addEventListener('ended', () => {
      if (storageKey) { try { localStorage.removeItem(storageKey); } catch (e) {} }
      if (!watchedFired) { watchedFired = true; if (typeof onWatched === 'function') onWatched(); }
      if (typeof onEnded === 'function') onEnded();
    });
    playPauseBtn.addEventListener('click', () => { pulse(playPauseBtn); togglePlay(); });
    /* لمس مزدوج على الموبايل = ±10 ثانية، ونقر مزدوج بالماوس = ملء الشاشة */
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    let tapTimer = null, lastTapAt = 0;
    /* الضغط على أي مكان فاضي في المشغّل (حتى فوق شريط التحكم الشفاف) = تشغيل/إيقاف، مع تجاهل الأزرار نفسها */
    const IGNORE_TAP = 'button, input, select, a, [data-role="centerPlay"], [data-role="error"]';
    wrap.addEventListener('click', (e) => {
      if (e.target.closest(IGNORE_TAP)) return;
      if (!coarse) { togglePlay(); return; }
      const now = Date.now();
      if (now - lastTapAt < 320) {
        clearTimeout(tapTimer); lastTapAt = 0;
        const rect = video.getBoundingClientRect();
        const delta = (e.clientX - rect.left) < rect.width / 2 ? -10 : 10;
        video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + delta));
        showSeekHint(delta); return;
      }
      lastTapAt = now;
      tapTimer = setTimeout(togglePlay, 300);
    });
    wrap.addEventListener('dblclick', (e) => { if (!coarse && !e.target.closest(IGNORE_TAP)) toggleFullscreen(); });
    centerPlay.addEventListener('click', togglePlay);
    centerPlay.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlay(); } });

    backBtn.addEventListener('click', () => { pulse(backBtn); video.currentTime = Math.max(0, video.currentTime - 10); });
    forwardBtn.addEventListener('click', () => { pulse(forwardBtn); video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); });

    speedSelect.addEventListener('change', () => { video.playbackRate = parseFloat(speedSelect.value); writePrefs({ speed: video.playbackRate }); });

    function toggleFullscreen() {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
      if (req) {
        const r = req.call(wrap);
        /* على الموبايل: لما تدخل ملء الشاشة يقلب أفقي تلقائيًا */
        Promise.resolve(r).then(() => { try { if (coarse && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
      } else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    }
    const onFsChange = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement)) { try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {} } };
    document.addEventListener('fullscreenchange', onFsChange);
    fullscreenBtn.addEventListener('click', () => { pulse(fullscreenBtn); toggleFullscreen(); });

    function updateVolumeIcon() {
      const muted = video.muted || video.volume === 0;
      volIcon.style.display = muted ? 'none' : 'block';
      muteIcon.style.display = muted ? 'block' : 'none';
    }
    muteBtn.addEventListener('click', () => {
      pulse(muteBtn);
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) { video.volume = 0.5; volumeBar.value = 0.5; }
      updateVolumeIcon();
    });
    volumeBar.addEventListener('input', () => {
      video.volume = parseFloat(volumeBar.value);
      video.muted = video.volume === 0;
      updateVolumeIcon();
    });

    /* حفظ التقدّم كل 3 ثواني (بدل 4 مرات في الثانية) وعند الإيقاف أو مغادرة الصفحة */
    let lastSaveAt = 0, watchedFired = false, startedFired = false;
    function saveProgress(force) {
      if (!storageKey || isNaN(video.duration) || video.ended) return;
      const now = Date.now(); if (!force && now - lastSaveAt < 3000) return; lastSaveAt = now;
      try { localStorage.setItem(storageKey, video.currentTime); } catch (e) {}
      if (typeof onProgress === 'function') onProgress(video.currentTime, video.duration);
    }
    video.addEventListener('pause', () => saveProgress(true));
    let hpStartT = null, hpWaitT = null;
    video.addEventListener('play', () => { clearTimeout(hpStartT); hpStartT = setTimeout(() => { if (!startedFired) health('video_no_start', String(src).slice(0, 120)); }, 15000); });
    video.addEventListener('waiting', () => { clearTimeout(hpWaitT); hpWaitT = setTimeout(() => health('video_stall', 'توقف > 12 ثانية عند ' + Math.round(video.currentTime || 0) + 'ث'), 12000); });
    video.addEventListener('playing', () => { clearTimeout(hpStartT); clearTimeout(hpWaitT); });
    video.addEventListener('pause', () => clearTimeout(hpWaitT));
    video.addEventListener('playing', () => { if (!startedFired) { startedFired = true; emit('playing'); if (typeof onStarted === 'function') onStarted(); } });
    const onPageHide = () => saveProgress(true);
    window.addEventListener('pagehide', onPageHide);
    video.addEventListener('timeupdate', () => {
      if (!isNaN(video.duration)) {
        progress.value = (video.currentTime / video.duration) * 100;
        if (!video.paused) saveProgress(false);
        if (!watchedFired && video.duration > 0 && video.currentTime / video.duration >= 0.9) { watchedFired = true; if (typeof onWatched === 'function') onWatched(); }
      }
      timeLabel.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    });

    video.addEventListener('loadedmetadata', () => {
      timeLabel.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
      if (storageKey) {
        const saved = parseFloat(localStorage.getItem(storageKey));
        if (saved && saved > 1 && saved < video.duration - 2) video.currentTime = saved;
      }
    });

    progress.addEventListener('input', () => {
      if (!isNaN(video.duration)) video.currentTime = (progress.value / 100) * video.duration;
    });
    progress.addEventListener('mousemove', (e) => {
      if (isNaN(video.duration)) return;
      const rect = progress.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      hoverPreview.textContent = formatTime(ratio * video.duration);
      hoverPreview.style.right = `${ratio * 100}%`;
      hoverPreview.classList.add('show');
    });
    progress.addEventListener('mouseleave', () => hoverPreview.classList.remove('show'));

    video.addEventListener('waiting', () => loading.classList.add('show'));
    video.addEventListener('canplay', () => loading.classList.remove('show'));
    video.addEventListener('playing', () => loading.classList.remove('show'));
    video.addEventListener('loadeddata', () => loading.classList.remove('show'));
    function showPlaybackError(reason) {
      loading.classList.remove('show');
      health('video_error', String(reason || '') + ' | ' + String(src).slice(0, 120)); emit('error', { reason: reason === 'unsupported' ? 'صيغة غير مدعومة في المتصفح' : (reason === 'failed' ? 'فشل تحميل البث (تأكد من الروابط وCORS)' : (video.error ? 'خطأ في تحميل الفيديو (كود ' + video.error.code + ')' : 'تعذّر تحميل الفيديو')) });
      const t = q('errTitle'), m = q('errMsg');
      if (reason === 'unsupported' || (source.sourceType === 'mkv' || source.sourceType === 'ts') && reason === 'native') {
        const fmt = { mkv: 'MKV', ts: 'TS', hls: 'M3U8' }[source.sourceType] || 'هذه الصيغة';
        t.textContent = 'المتصفح مش قادر يشغّل هذا الفيديو';
        m.textContent = `صيغة ${fmt} مش مدعومة في متصفحك. جرّب متصفح تاني (Chrome أو Edge) أو بلّغ عن المشكلة.`;
      }
      errorBox.style.display = 'flex';
    }
    video.addEventListener('error', () => showPlaybackError('native'));
    emit('loading');
    if (source.playbackStrategy === 'hls') {
      loading.classList.add('show');
      attachEngine(source.playbackStrategy, video, src, showPlaybackError);
    }

    let hideTimer = null;
    function showControls() {
      wrap.classList.remove('controls-hidden');
      clearTimeout(hideTimer);
      if (!video.paused) hideTimer = setTimeout(() => wrap.classList.add('controls-hidden'), 2500);
    }
    ['mousemove', 'touchstart', 'click'].forEach(evt => wrap.addEventListener(evt, showControls));
    video.addEventListener('play', showControls);
    video.addEventListener('pause', () => { clearTimeout(hideTimer); wrap.classList.remove('controls-hidden'); });

    function playerVisible() {
      const r = wrap.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      return r.height > 0 && visible / r.height > 0.3;
    }
    function keyHandler(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const el = document.activeElement, tag = el ? el.tagName : '';
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || (el && el.isContentEditable)) return;
      if (!playerVisible()) return;
      /* e.code مستقل عن لغة الكيبورد، فالاختصارات تشتغل مع العربي كمان */
      if (e.code === 'Space' || e.code === 'KeyK') { e.preventDefault(); pulse(playPauseBtn); togglePlay(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); pulse(forwardBtn); showSeekHint(10); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 10); pulse(backBtn); showSeekHint(-10); }
      else if (e.code === 'ArrowUp') { e.preventDefault(); video.muted = false; video.volume = Math.min(1, video.volume + 0.1); volumeBar.value = video.volume; updateVolumeIcon(); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volumeBar.value = video.volume; updateVolumeIcon(); }
      else if (e.code === 'KeyF') { pulse(fullscreenBtn); toggleFullscreen(); }
      else if (e.code === 'KeyM') { pulse(muteBtn); video.muted = !video.muted; updateVolumeIcon(); }
      else if (/^(Digit|Numpad)[0-9]$/.test(e.code) && !isNaN(video.duration)) { video.currentTime = video.duration * (parseInt(e.code.slice(-1), 10) / 10); }
    }
    document.addEventListener('keydown', keyHandler);
    wrap._hakimCleanup = () => {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('pagehide', onPageHide);
      saveProgress(true);
    };

    /* نافذة عائمة (Picture-in-Picture) */
    if (document.pictureInPictureEnabled) {
      const pip = document.createElement('button');
      pip.className = 'hp-btn'; pip.dataset.role = 'pip'; pip.title = 'نافذة عائمة'; pip.setAttribute('aria-label', 'نافذة عائمة');
      pip.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>';
      fullscreenBtn.parentNode.insertBefore(pip, fullscreenBtn);
      pip.addEventListener('click', async () => { try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await video.requestPictureInPicture(); } catch (e) {} });
    }

    /* أزرار قفل الشاشة / الإشعارات (Media Session) */
    if ('mediaSession' in navigator) {
      try {
        const ms = navigator.mediaSession;
        ms.metadata = meta ? new MediaMetadata({ title: meta.title || '', artist: meta.artist || '', album: meta.artist || '', artwork: meta.artwork ? [{ src: new URL(meta.artwork, location.href).href }] : [] }) : null;
        ms.setActionHandler('play', () => video.play());
        ms.setActionHandler('pause', () => video.pause());
        ms.setActionHandler('seekbackward', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
        ms.setActionHandler('seekforward', () => { video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); });
        ms.setActionHandler('previoustrack', meta && meta.onPrev ? meta.onPrev : null);
        ms.setActionHandler('nexttrack', meta && meta.onNext ? meta.onNext : null);
      } catch (e) {}
    }

    updateCenterPlay();
    updateVolumeIcon();
  }

  function unmount(container) {
    destroyEngine();
    const wrap = container.querySelector('.hp-video-wrap');
    if (wrap && wrap._hakimCleanup) wrap._hakimCleanup();
    container.innerHTML = '';
  }

  return { mount, unmount, detectSource };
})();

/* ============================================================
   course.js — صفحة الكورس المستقلة
   ============================================================ */

(function () {
  const params = new URLSearchParams(location.search);
  const id = window.__COURSE_ID || params.get('id');

  const banner = document.getElementById('banner');
  const infoSection = document.getElementById('infoSection');
  const playerHost = document.getElementById('playerHost');
  const nowPlaying = document.getElementById('nowPlaying');
  const videoStatsRow = document.getElementById('videoStatsRow');
  const playerNav = document.getElementById('playerNav');
  const pageNumbers = document.getElementById('pageNumbers');
  const lessonListEl = document.getElementById('lessonList');
  const pageBody = document.getElementById('pageBody');
  const errorBox = document.getElementById('courseError');

  const PAGE_SIZE = 48;
  let currentVideos = [];
  let courseMeta = { name: '', img: '', playback: {} };
  /* ترتيب عرض الحلقات: الأقدم أولًا (افتراضي) أو الأحدث أولًا — يتحفظ عند الزائر */
  let orderDesc = (() => { try { return localStorage.getItem('hakim_ep_order') === 'desc'; } catch (e) { return false; } })();
  const watchedKey = () => `hakim_watched_${id}`;
  function getWatched() { try { return new Set(JSON.parse(localStorage.getItem(watchedKey())) || []); } catch (e) { return new Set(); } }
  function episodeNumber(i) {
    const v = currentVideos[i] || {}, m = String(v.title || '').match(/(\d+)\s*$/);
    return Number.isFinite(parseInt(v.num, 10)) ? parseInt(v.num, 10) : (m ? parseInt(m[1], 10) : i + 1);
  }
  function markWatched(i) {
    const s = getWatched(); if (s.has(i)) return; s.add(i);
    try { localStorage.setItem(watchedKey(), JSON.stringify([...s])); } catch (e) {}
    const t = lessonListEl.querySelector(`.ep-tile[data-index="${i}"]`); if (t) t.classList.add('watched');
  }
  /* سجل المشاهدة للرئيسية (صف كمّل المشاهدة): آخر حلقة + نسبة التقدّم. لو الحلقة خلصت بننقل المؤشر للحلقة اللي بعدها */
  function saveHistory(i, t, d) {
    try {
      const pct = d > 0 ? Math.min(1, t / d) : 0;
      let h = JSON.parse(localStorage.getItem('hakim_watch_history')); if (!Array.isArray(h)) h = [];
      const old = h.find(x => x.id === id);
      h = h.filter(x => x.id !== id);
      if (pct >= 0.9) {
        if (i >= currentVideos.length - 1) { localStorage.setItem('hakim_watch_history', JSON.stringify(h)); return; }
        h.unshift({ id, index: i + 1, num: episodeNumber(i + 1), pct: 0, ts: Date.now() });
      } else h.unshift({ id, index: i, num: episodeNumber(i), pct: (!pct && old && old.index === i) ? old.pct : pct, ts: Date.now() });
      localStorage.setItem('hakim_watch_history', JSON.stringify(h.slice(0, 30)));
    } catch (e) {}
  }
  function saveLastWatch(i) {
    try { localStorage.setItem('hakim_last_watch', JSON.stringify({ id, index: i, num: episodeNumber(i), ts: Date.now() })); } catch (e) {}
  }
  function syncEpisodeUrl(i) {
    try {
      const u = new URL(location.href);
      if (i > 0) u.searchParams.set('ep', String(i + 1)); else u.searchParams.delete('ep');
      history.replaceState(null, '', u.toString());
    } catch (e) {}
  }
  function revealPlayer() {
    const r = playerHost.getBoundingClientRect();
    if (r.top < 60 || r.bottom > (window.innerHeight || 800)) window.scrollTo({ top: window.scrollY + r.top - 80, behavior: 'smooth' });
  }
  let currentIndex = 0;
  let activePage = 0;
  let episodeViewCount = 0;

  const PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">
      <rect width="300" height="400" fill="#1c222e"/>
      <text x="50%" y="50%" fill="#8b93a7" font-size="16" font-family="sans-serif" text-anchor="middle" dy=".3em">لا توجد صورة</text>
    </svg>`);

  function showError(title, msg) {
    pageBody.style.display = 'none';
    errorBox.style.display = 'block';
    errorBox.innerHTML = `<h2>${hakimEscapeHtml(title)}</h2><p>${hakimEscapeHtml(msg)}</p><a href="index.html" class="back-link" style="justify-content:center">العودة للرئيسية</a>`;
  }

  const INFO_LABELS = {
    overview: 'نبذة', studio: 'الاستديو', language: 'اللغة', writer: 'الكاتب',
    levelsCount: 'عدد المواسم', episodesCount: 'عدد الحلقات',
    status: 'حالة الكورس', country: 'البلد الصانع', ageRange: 'الفئة العمرية'
  };
  const STATUS_LABELS = { complete: 'مكتمل', ongoing: 'قيد الإنتاج - مستمر', paused: 'متوقف مؤقتًا', stopped: 'متوقف نهائيًا' };
  const AGE_RANGE_LABELS = { '5-10': 'من 5 إلى 10 سنوات', '10-17': 'من 10 إلى 17 سنة', '18-30': 'من 18 إلى 30 سنة', other: 'غير ذلك' };
  const RELEASE_DATE_LABELS = { old: 'قديم', new: 'حديثة', exclusive: 'حصري 🔥' };
  const HIDDEN_INFO_KEYS = ['grade', 'releaseDate']; // لا تُعرض ضمن الشبكة العادية (releaseDate له عرض خاص كشارات)

  function formatInfoValue(key, val) {
    if (key === 'status') return STATUS_LABELS[val] || val;
    if (key === 'ageRange') return AGE_RANGE_LABELS[val] || val;
    return val;
  }

  function renderInfo(info) {
    if (!info) { infoSection.innerHTML = ''; return; }
    const overview = info.overview ? `<div class="info-overview">${hakimEscapeHtml(info.overview)}</div>` : '';
    const items = Object.keys(INFO_LABELS)
      .filter(k => k !== 'overview' && info[k] && !HIDDEN_INFO_KEYS.includes(k))
      .map(k => `<div class="info-item"><div class="label">${INFO_LABELS[k]}</div><div class="value">${hakimEscapeHtml(String(formatInfoValue(k, info[k])))}</div></div>`)
      .join('');
    if (!overview && !items) { infoSection.innerHTML = ''; return; }
    infoSection.innerHTML = `<h3>${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.courseInfoHeading) || 'معلومات الكورس')}</h3>${overview}${items ? `<div class="info-grid">${items}</div>` : ''}`;
  }

  function pageOf(index) { return Math.floor((orderDesc ? currentVideos.length - 1 - index : index) / PAGE_SIZE); }

  function renderPageNumbers() {
    const total = currentVideos.length;
    if (total <= PAGE_SIZE) { pageNumbers.innerHTML = ''; return; }
    const pageCount = Math.ceil(total / PAGE_SIZE);
    let html = '';
    for (let p = 0; p < pageCount; p++) {
      html += `<button class="page-num-btn ${p === activePage ? 'active' : ''}" data-page="${p}">${p + 1}</button>`;
    }
    pageNumbers.innerHTML = html;
    pageNumbers.querySelectorAll('.page-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activePage = parseInt(btn.dataset.page, 10);
        renderPageNumbers();
        renderLessonList();
      });
    });
  }

  function renderLessonList() {
    const total = currentVideos.length;
    const start = total > PAGE_SIZE ? activePage * PAGE_SIZE : 0;
    const end = total > PAGE_SIZE ? Math.min(total, start + PAGE_SIZE) : total;

    const watchedSet = getWatched();
    const orderBtn = total >= 5 ? `<button type="button" class="ep-order-btn" id="epOrderBtn" title="تغيير ترتيب الحلقات">↕ ${orderDesc ? 'الأحدث أولًا' : 'الأقدم أولًا'}</button>` : '';
    let html = `<div class="ep-head"><h3>${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.courseContentHeading) || 'محتوى الكورس')}</h3>${orderBtn}</div><div class="ep-grid">`;
    for (let pos = start; pos < end; pos++) {
      const i = orderDesc ? total - 1 - pos : pos;
      const v = currentVideos[i];
      const m = String(v.title || '').match(/(\d+)\s*$/);
      const num = Number.isFinite(parseInt(v.num, 10)) ? parseInt(v.num, 10) : (m ? parseInt(m[1], 10) : i + 1);
      const tip = [v.title, v.description].filter(Boolean).join(' — ');
      html += `<button type="button" class="ep-tile ${i === currentIndex ? 'active' : ''} ${v.disabled ? 'lesson-disabled' : ''} ${watchedSet.has(i) ? 'watched' : ''}" data-index="${i}" data-video-id="${hakimEscapeHtml(id + '-' + (i + 1))}" title="${hakimEscapeHtml(tip)}" aria-label="${hakimEscapeHtml(v.title || ('الحلقة ' + num))}"${i === currentIndex ? ' aria-current="true"' : ''}>
          <span class="ep-label">${v.disabled ? '🔒' : 'الحلقة'}</span><span class="ep-num">${num}</span>
        </button>`;
    }
    html += '</div>';
    lessonListEl.innerHTML = html;

    lessonListEl.querySelectorAll('.ep-tile').forEach(el => {
      const i = parseInt(el.dataset.index, 10);
      el.addEventListener('click', () => { playLesson(i, true); revealPlayer(); });
    });
    const ob = document.getElementById('epOrderBtn');
    if (ob) ob.addEventListener('click', () => {
      orderDesc = !orderDesc;
      try { localStorage.setItem('hakim_ep_order', orderDesc ? 'desc' : 'asc'); } catch (e) {}
      activePage = pageOf(currentIndex); renderPageNumbers(); renderLessonList();
    });
  }

  function renderPlayerNav() {
    const total = currentVideos.length;
    playerNav.innerHTML = `
      <button class="nav-btn" id="prevEpBtn" ${currentIndex <= 0 ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        الحلقة السابقة
      </button>
      <button class="nav-btn" id="nextEpBtn" ${currentIndex >= total - 1 ? 'disabled' : ''}>
        الحلقة التالية
        <svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
      </button>`;
    const prevBtn = document.getElementById('prevEpBtn');
    const nextBtn = document.getElementById('nextEpBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (currentIndex > 0) { playLesson(currentIndex - 1, true); revealPlayer(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (currentIndex < total - 1) { playLesson(currentIndex + 1, true); revealPlayer(); } });
  }

  /* ---------------- تقييم الحلقة بالنجوم (حقيقي عبر Supabase، المتوسط فقط ظاهر) ---------------- */
  function episodeRatingKey(index) { return `hakim_ep_rating_${id}_${index}`; }

  async function submitEpisodeRating(index, stars) {
    localStorage.setItem(episodeRatingKey(index), String(stars));
    await hakimSbUpsert('episode_ratings', {
      session_id: hakimSessionId(), course_id: id, episode_index: index, rating: stars
    }, 'session_id,course_id,episode_index');
    renderVideoStats(currentVideos[index], index);
  }

  async function renderVideoStats(v, index) {
    /* رابط التحميل: http/https أو مسار نسبي بس (ما نقبلش javascript: وأمثالها) */
    const dl = String(v.download || '').trim();
    const safeDownloadUrl = /^(https?:\/\/|[^:]*$)/i.test(dl) ? dl : '';
    const myRating = parseInt(localStorage.getItem(episodeRatingKey(index)) || '0', 10);
    let avgLabel = '—';
    if (hakimSbReady()) {
      const avg = await hakimSbRpc('get_episode_rating', { p_course_id: id, p_episode_index: index });
      if (avg != null) avgLabel = (typeof avg === 'number' ? avg : parseFloat(avg)).toFixed(1);
    }
    const starsHtml = [1, 2, 3, 4, 5].map(n => `
      <button type="button" class="star-btn ${n <= myRating ? 'filled' : ''}" data-star="${n}" title="قيّم ${n} نجوم">
        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      </button>`).join('');
    videoStatsRow.innerHTML = `
      <span title="عدد المشاهدات (حقيقي)"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg> ${episodeViewCount}</span>
      <span class="ep-stars" title="تقييمك لهذه الحلقة">${starsHtml} <b class="ep-avg">${avgLabel}</b></span>
      ${safeDownloadUrl ? `<a class="stat-btn download-btn" href="${hakimEscapeHtml(safeDownloadUrl)}" target="_blank" rel="noopener noreferrer" download>⬇️ تحميل</a>` : ''}
      <button type="button" class="stat-btn report-btn" data-act="report">⚠️ إبلاغ عن خطأ</button>
    `;
    videoStatsRow.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => submitEpisodeRating(index, parseInt(btn.dataset.star, 10)));
    });
    videoStatsRow.querySelector('[data-act="report"]').addEventListener('click', () => openReportModal(v, index));
  }

  const REPORT_REASONS = ['ترتيب الحلقة غير صحيح', 'الفيديو لا يعمل', 'الصوت أو الترجمة بها مشكلة', 'محتوى غير لائق', 'مشكلة أخرى'];
  function openReportModal(v, index) {
    let modal = document.getElementById('reportModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'reportModal';
      modal.className = 'admin-overlay';
      modal.innerHTML = `
        <div class="admin-card" style="max-width:420px;width:92%">
          <h2>${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.reportModalTitle) || 'الإبلاغ عن مشكلة')}</h2>
          <p class="hint">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.reportModalHint) || 'اختر نوع المشكلة في هذه الحلقة، وأضف تفاصيل لو حبيت — البلاغ بيوصل لإدارة الموقع مباشرة.')}</p>
          <div id="reportReasons" style="margin-bottom:14px"></div>
          <div class="field"><label>${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.reportDetailLabel) || 'تفاصيل إضافية (اختياري)')}</label><textarea id="reportDetail"></textarea></div>
          <div style="display:flex;gap:10px">
            <button type="button" class="btn-primary" id="reportSendBtn">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.reportSendBtn) || 'إرسال البلاغ')}</button>
            <button type="button" class="btn-secondary" id="reportCancelBtn">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.cancelBtn) || 'إلغاء')}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector('#reportCancelBtn').addEventListener('click', () => { modal.style.display = 'none'; });
    }

    modal.querySelector('#reportReasons').innerHTML = REPORT_REASONS.map((r, i) => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:0.85rem;cursor:pointer">
        <input type="radio" name="reportReason" value="${hakimEscapeHtml(r)}" ${i === 0 ? 'checked' : ''}> ${hakimEscapeHtml(r)}
      </label>`).join('');
    modal.querySelector('#reportDetail').value = '';

    modal.querySelector('#reportSendBtn').onclick = () => {
      const reasonInput = modal.querySelector('input[name="reportReason"]:checked');
      const reason = reasonInput ? reasonInput.value : '';
      const detail = modal.querySelector('#reportDetail').value.trim();
      const sendBtn = modal.querySelector('#reportSendBtn'); sendBtn.disabled = true;
      const reportUrl = (siteSettingsCache && siteSettingsCache.reportUrl) || '';
      hakimSbInsert('episode_reports', { session_id: hakimSessionId(), course_id: id, episode_index: index, episode_title: String(v.title || '').slice(0, 150), reason, details: detail.slice(0, 1000), page_url: location.href.slice(0, 300) }).then((ok) => {
        sendBtn.disabled = false;
        if (ok) { alert('وصل بلاغك لإدارة الموقع — شكرًا لمساعدتك 🙏'); modal.style.display = 'none'; return; }
        if (!reportUrl) { alert('تعذّر إرسال البلاغ حاليًا، حاول مرة تانية بعد شوية.'); return; }
        const title = encodeURIComponent(`بلاغ: ${id} — ${v.title || 'حلقة ' + (index + 1)}`);
        const body = encodeURIComponent(`الكورس: ${id}\nالحلقة رقم: ${index + 1} (${v.title || ''})\nسبب البلاغ: ${reason}\nتفاصيل إضافية: ${detail || '(لا يوجد)'}`);
        (window.hakimTrustedOpen || window.open).call(window, `${reportUrl}?title=${title}&body=${body}`, '_blank');
        modal.style.display = 'none';
      });
    };

    modal.style.display = 'flex';
  }


  /* ===== السيو: عنوان/وصف/canonical/OG/JSON-LD/فتات الخبز — يقرأ data.seo لو موجود وإلا يولّد تلقائيًا ===== */
  function seoH1(data) { return (data.seo && data.seo.h1) || data.name || 'كورس بدون اسم'; }
  function seoFill(tpl, n, name) {
    return String(tpl || '').replace(/\{رقم\}|\bX\b/g, n).replace(/\{اسم\}/g, name || '');
  }
  function seoSetMeta(attr, key, val) {
    if (!val) return;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', val);
  }
  function seoSetCanonical(url) {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
    el.href = url;
  }
  /* السيو التلقائي: أي حقل فاضي بيتولّد من بيانات الكورس (نفس منطق الأدمن) */
  function seoClip(t, max) { t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= max) return t; const c = t.slice(0, max - 1); return c.slice(0, Math.max(c.lastIndexOf(' '), max - 25)).trim() + '…'; }
  function seoAuto(data, site) {
    const name = (data.name || 'كورس').trim(), n = (data.videos || []).length, info = data.info || {};
    const full = `${name} — شرح كامل ومجاني | ${site}`;
    return {
      title: full.length <= 62 ? full : seoClip(`${name} | ${site}`, 62),
      description: seoClip(`شاهد ${name} كامل${n ? ` (${n} حلقة)` : ''} مجانًا وبجودة عالية على ${site}.${info.overview ? ' ' + info.overview : ''}`, 158),
      keywords: [...new Set([name, `شرح ${name}`, `مشاهدة ${name}`, `${name} مجانا`, data.category, site].filter(Boolean))].join(', '),
      epTitle: 'الحلقة {رقم} من {اسم}', epDesc: `شاهد الحلقة {رقم} من ${name} مجانًا وبجودة عالية على ${site}`
    };
  }
  function applyCourseSeo(id, data) {
    const site = (window.SITE_SETTINGS && window.SITE_SETTINGS.siteName) || 'منصة حكيم التعليمية';
    const seo = data.seo || {};
    const auto = seoAuto(data, site);
    const title = seo.title || auto.title;
    const desc = seo.description || data.description || auto.description;
    const base = location.href.split('#')[0].split('?')[0];
    const url = window.__COURSE_ID ? base : `${base}?id=${encodeURIComponent(id)}`;
    document.title = title;
    seoSetMeta('name', 'description', desc);
    seoSetMeta('name', 'keywords', seo.keywords || auto.keywords);
    seoSetCanonical(url);
    seoSetMeta('property', 'og:title', title);
    seoSetMeta('property', 'og:description', desc);
    seoSetMeta('property', 'og:type', 'website');
    seoSetMeta('property', 'og:url', url);
    if (data.img) seoSetMeta('property', 'og:image', data.img);
    seoSetMeta('name', 'twitter:card', 'summary_large_image');

    const videos = data.videos || [];
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: seo.h1 || data.name || '',
      description: desc,
      url,
      inLanguage: 'ar',
      provider: { '@type': 'Organization', name: site },
      hasPart: videos.filter(v => !v.disabled).map((v, i) => ({
        '@type': 'VideoObject',
        name: seoFill(seo.episodeTitleTemplate || auto.epTitle, i + 1, data.name) || v.title || `الحلقة ${i + 1}`,
        description: seoFill(seo.episodeDescTemplate || auto.epDesc, i + 1, data.name) || v.description || v.title || '',
        thumbnailUrl: new URL(data.img || 'icon-512.png', location.href).href,
        contentUrl: v.link || undefined,
        uploadDate: (data.firstPublishedAt && String(data.firstPublishedAt).slice(0, 10)) || (data.info && data.info.startDate) || (new Date().toISOString().slice(0, 10)),
        position: i + 1
      }))
    };
    let ldEl = document.querySelector('script[data-seo="course"]') || document.getElementById('seoJsonLd');
    if (!ldEl) { ldEl = document.createElement('script'); ldEl.type = 'application/ld+json'; ldEl.id = 'seoJsonLd'; document.head.appendChild(ldEl); }
    ldEl.textContent = JSON.stringify(ld);

    /* فتات الخبز (Breadcrumbs) + JSON-LD لها */
    const cat = data.category || '';
    const crumbs = [{ n: 'الرئيسية', h: 'index.html' }];
    if (cat) crumbs.push({ n: cat, h: `index.html?cat=${encodeURIComponent(cat)}` });
    crumbs.push({ n: data.name || 'الكورس', h: null });
    let nav = document.getElementById('seoBreadcrumbs');
    if (!nav) {
      nav = document.createElement('nav'); nav.id = 'seoBreadcrumbs'; nav.setAttribute('aria-label', 'breadcrumb');
      nav.style.cssText = 'font-size:0.82rem;color:var(--text-muted);margin:6px 0 12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center';
      const back = document.querySelector('.back-link');
      if (back && back.parentNode) back.parentNode.insertBefore(nav, back.nextSibling);
    }
    nav.innerHTML = crumbs.map((c, i) => (c.h ? `<a href="${c.h}" style="color:var(--text-muted)">${hakimEscapeHtml(c.n)}</a>` : `<span style="color:var(--text)">${hakimEscapeHtml(c.n)}</span>`) + (i < crumbs.length - 1 ? '<span>‹</span>' : '')).join(' ');
    let bcEl = document.getElementById('seoBreadcrumbLd');
    if (!bcEl) { bcEl = document.createElement('script'); bcEl.type = 'application/ld+json'; bcEl.id = 'seoBreadcrumbLd'; document.head.appendChild(bcEl); }
    bcEl.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.n })) });
    window.__seoCourse = { data, id };
    const navLabelEl = document.getElementById('sectionsBtnLabel');
    if (navLabelEl) navLabelEl.textContent = data.category || data.name || 'صفحة الكورس';
  }
  function applyEpisodeSeo(index) {
    const c = window.__seoCourse; if (!c) return;
    const seo = c.data.seo || {}; const v = (c.data.videos || [])[index]; if (!v) return;
    const n = index + 1, site = (window.SITE_SETTINGS && window.SITE_SETTINGS.siteName) || 'منصة حكيم التعليمية';
    const t = seoFill(seo.episodeTitleTemplate, n, c.data.name) || `${v.title || ('الحلقة ' + n)} — ${c.data.name || ''}`;
    document.title = `${t} — ${site}`;
    const d = seoFill(seo.episodeDescTemplate, n, c.data.name) || v.description;
    if (d) { seoSetMeta('name', 'description', d); seoSetMeta('property', 'og:description', d); }
    seoSetMeta('property', 'og:title', t);
  }

  async function playLesson(index, autoplay) {
    const v = currentVideos[index];
    if (!v) return;
    currentIndex = index;
    if (window.__HAKIM_PREVIEW) { try { parent.postMessage({ hakimPreview: 'episode', index }, '*'); } catch (e) {} }
    syncEpisodeUrl(index);
    try { applyEpisodeSeo(index); } catch (e) {}

    if (v.disabled) {
      playerHost.innerHTML = `
        <div class="episode-disabled-box">
          <svg viewBox="0 0 24 24"><path d="M12 17a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2zm6-9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V6a5 5 0 0110 0v2h1zm-6-5a3 3 0 00-3 3v2h6V6a3 3 0 00-3-3z"/></svg>
          <p>${hakimEscapeHtml(v.disabledMessage || 'هذه الحلقة غير متاحة حاليًا.')}</p>
        </div>`;
      nowPlaying.innerHTML = `<strong>${hakimEscapeHtml(v.title || '')}</strong> — غير متاحة حاليًا`;
      videoStatsRow.innerHTML = '';
    } else {
      HakimPlayer.mount(playerHost, {
        src: v.link, storageKey: `hakim_progress_${id}_${index}`,
        type: v.type || courseMeta.playback.defaultType || 'auto',
        onState: window.__HAKIM_PREVIEW ? (st) => { try { parent.postMessage({ hakimPreview: 'state', index, ...st }, '*'); } catch (e) {} } : null,
        onHealth: (t, d) => hakimHealth(t, id, index, d),
        antiPopup: !!v.antiPopup || courseMeta.playback.antiPopupAll !== false, /* افتراضي: شغّال لكل الحلقات */
        onProgress: (t, d) => saveHistory(index, t, d),
        onStarted: () => { saveLastWatch(index); saveHistory(index, 0, 0); },
        onWatched: () => markWatched(index),
        meta: {
          title: v.title || '', artist: courseMeta.name, artwork: courseMeta.img || '',
          onPrev: index > 0 ? () => playLesson(index - 1, true) : null,
          onNext: index < currentVideos.length - 1 ? () => playLesson(index + 1, true) : null
        },
        onEnded: () => {
          if (courseMeta.playback.autoNext === false) return;
          if (currentIndex < currentVideos.length - 1) playLesson(currentIndex + 1, true);
        }
      });
      if (autoplay) {
        const vidEl = playerHost.querySelector('video');
        if (vidEl) vidEl.play().catch(() => {});
      }
      nowPlaying.innerHTML = `${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.nowPlayingLabel) || 'يُشغَّل الآن:')} <strong>${hakimEscapeHtml(v.title || '')}</strong>`;

      hakimTrackPageView('episode', id, index);
      episodeViewCount = await hakimSbRpc('get_episode_views', { p_course_id: id, p_episode_index: index }) || 0;
      renderVideoStats(v, index);
    }

    const targetPage = pageOf(index);
    activePage = targetPage;
    renderPageNumbers();
    renderLessonList();
    renderPlayerNav();

    const activeEl = lessonListEl.querySelector(`[data-index="${index}"]`);
    if (activeEl && window.__hakimPlayedOnce) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window.__hakimPlayedOnce = true;
  }

  let siteSettingsCache = {};

  const courseRatingKey = `hakim_course_rating_${id}`;
  async function renderCourseRatingWidget() {
    const host = document.getElementById('courseRatingHost');
    if (!host) return;
    const myRating = parseInt(localStorage.getItem(courseRatingKey) || '0', 10);
    let avgLabel = '—';
    if (hakimSbReady()) {
      const avg = await hakimSbRpc('get_course_rating', { p_course_id: id });
      if (avg != null) avgLabel = (typeof avg === 'number' ? avg : parseFloat(avg)).toFixed(1);
    }
    const starsHtml = [1, 2, 3, 4, 5].map(n => `
      <button type="button" class="star-btn ${n <= myRating ? 'filled' : ''}" data-star="${n}">
        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      </button>`).join('');
    host.innerHTML = `
      <span style="font-size:0.82rem;color:var(--text-muted)">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.courseRatingLabel) || 'تقييمك للكورس ككل:')}</span>
      ${starsHtml}
      <b class="ep-avg">${avgLabel}</b>
    `;
    host.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const stars = parseInt(btn.dataset.star, 10);
        localStorage.setItem(courseRatingKey, String(stars));
        await hakimSbUpsert('course_ratings', { session_id: hakimSessionId(), course_id: id, rating: stars }, 'session_id,course_id');
        renderCourseRatingWidget();
      });
    });
  }

  const FAV_ICON = '<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-4.35-9.5-8.5C.5 9 2 5.5 5.5 5c2-.3 3.6.7 4.5 2 .9-1.3 2.5-2.3 4.5-2 3.5.5 5 4 3 7.5C18.5 16.65 12 21 12 21z"/></svg>';
  const FOLLOW_ICON = '<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>';
  const SHARE_ICON = '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>';
  const PLAYLIST_ICON = '<svg viewBox="0 0 24 24"><path d="M3 5h12v2H3zm0 6h12v2H3zm0 6h8v2H3zM19 9v6.26a3 3 0 102 2.82V11h3V9z"/></svg>';

  /* ذات الصلة: مواسم نفس الكورس تحت قائمة الحلقات */
  async function renderRelatedSeasons(courseId, data) {
    const host = document.getElementById('relatedSeasons'); if (!host) return;
    await Promise.all([hakimLoadScript('courses-index.js'), hakimLoadScript('courses-list.js')]);
    const idx = window.COURSES_INDEX || {}, published = window.COURSES_LIST || [];
    const seriesId = (idx[courseId] && idx[courseId].seriesId) || data.seriesId || courseId;
    const ids = Object.keys(idx).filter(x => published.includes(x) && (idx[x].seriesId || x) === seriesId && !(idx[x].publishAt && Date.parse(idx[x].publishAt) > Date.now()))
      .sort((a, b) => (idx[a].seasonNumber || 1) - (idx[b].seasonNumber || 1));
    if (ids.length < 2) { host.innerHTML = ''; return; }
    const st = window.SITE_TEXT || {};
    host.innerHTML = `<h3>${hakimEscapeHtml(st.relatedHeading || 'ذات الصلة')}</h3><div class="related-grid">${ids.map(x => {
      const e = idx[x], cur = x === courseId;
      const label = e.level || `الموسم ${e.seasonNumber || 1}`;
      return `<a class="related-card${cur ? ' current' : ''}" href="${hakimEscapeHtml(x)}.html"${cur ? ' aria-current="page"' : ''}>
        <img src="${hakimEscapeHtml(e.img || PLACEHOLDER_IMG)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
        <span class="rc-text"><strong>${hakimEscapeHtml(label)}</strong><small>${hakimEscapeHtml(e.name || '')}</small><small>${e.videosCount || 0} حلقة${cur ? ' · تشاهد الآن' : ''}</small></span>
      </a>`;
    }).join('')}</div>`;
  }

  function renderCourseActionsRow(courseId) {
    const host = document.getElementById('courseActionsRow');
    if (!host) return;

    function draw() {
      const isFav = hakimIsFavorite(courseId);
      const isFollow = hakimIsFollowing(courseId);
      const st = window.SITE_TEXT || {};
      host.innerHTML = `
        <button class="mylists-action-btn ${isFav ? 'active' : ''}" id="favBtn">${FAV_ICON}<span>${isFav ? hakimEscapeHtml(st.favActiveBtn || 'في المفضلة') : hakimEscapeHtml(st.favAddBtn || 'أضف للمفضلة')}</span></button>
        <button class="mylists-action-btn ${isFollow ? 'active' : ''}" id="followBtn">${FOLLOW_ICON}<span>${isFollow ? hakimEscapeHtml(st.followActiveBtn || 'متابَع') : hakimEscapeHtml(st.followAddBtn || 'تابع الكورس')}</span></button>
        <div class="playlist-picker">
          <button class="mylists-action-btn" id="playlistBtn">${PLAYLIST_ICON}<span>${hakimEscapeHtml(st.addToPlaylistBtn || 'أضف لقائمة تشغيل')}</span></button>
          <div class="playlist-picker-panel" id="playlistPanel"></div>
        </div>
        <button class="mylists-action-btn" id="shareBtn">${SHARE_ICON}<span>${hakimEscapeHtml(st.shareBtn || 'مشاركة')}</span></button>`;

      document.getElementById('shareBtn').addEventListener('click', async () => {
        const url = (document.head.querySelector('link[rel="canonical"]') || {}).href || location.href.split('#')[0];
        const h1 = document.querySelector('h1');
        const title = (h1 && h1.textContent.trim()) || document.title;
        if (navigator.share) {
          try { await navigator.share({ title, text: title, url }); return; }
          catch (e) { if (e && e.name === 'AbortError') return; }
        }
        let copied = false;
        try { await navigator.clipboard.writeText(url); copied = true; } catch (e) {}
        if (!copied) {
          const ta = document.createElement('textarea'); ta.value = url; ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta); ta.select();
          try { copied = document.execCommand('copy'); } catch (e) {}
          ta.remove();
        }
        hakimToast(copied ? (st.shareCopiedToast || 'تم نسخ رابط الكورس') : url, copied ? 'success' : 'error');
      });

      document.getElementById('favBtn').addEventListener('click', () => {
      if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تحفظ وتتابع كورساتك')) return; 
        const added = hakimToggleFavorite(courseId);
        hakimToast(added ? (st.favAddedToast || 'أُضيف للمفضلة') : (st.favRemovedToast || 'أُزيل من المفضلة'), 'success');
        draw();
      });
      document.getElementById('followBtn').addEventListener('click', () => {
        if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تتابع الكورسات')) return;
        const added = hakimToggleFollowing(courseId);
        hakimToast(added ? (st.followAddedToast || 'أنت الآن تتابع هذا الكورس') : (st.followRemovedToast || 'تم إلغاء المتابعة'), 'success');
        draw();
      });

      const plBtn = document.getElementById('playlistBtn');
      const plPanel = document.getElementById('playlistPanel');
      function renderPlaylistPanel() {
        const d = hakimGetMyLists();
        let html = '';
        if (d.playlists.length === 0) {
          html += `<p class="mylists-empty-hint">${hakimEscapeHtml(st.noPlaylistsHint || 'لا توجد قوائم تشغيل بعد — أنشئ واحدة من زر "قوائمي" في الأعلى.')}</p>`;
        } else {
          html += d.playlists.map(pl => `
            <label class="playlist-check-row">
              <input type="checkbox" data-pl="${pl.id}" ${pl.courseIds.includes(courseId) ? 'checked' : ''}>
              <span>${hakimEscapeHtml(pl.name)} (${pl.courseIds.length})</span>
            </label>`).join('');
        }
        plPanel.innerHTML = html;
        plPanel.querySelectorAll('input[type=checkbox]').forEach(cb => {
          cb.addEventListener('change', () => {
            if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تعمل قوائم وتحفظ كورساتك')) { cb.checked = !cb.checked; return; }
            const added = hakimTogglePlaylistCourse(cb.dataset.pl, courseId);
            hakimToast(added ? 'أُضيف للقائمة' : 'أُزيل من القائمة', 'success');
          });
        });
      }
      plBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = plPanel.classList.contains('show');
        if (open) { plPanel.classList.remove('show'); }
        else { renderPlaylistPanel(); plPanel.classList.add('show'); }
      });
      document.addEventListener('click', (e) => {
        if (plPanel.classList.contains('show') && !plPanel.contains(e.target) && e.target !== plBtn) {
          plPanel.classList.remove('show');
        }
      });
    }

    draw();
  }

  async function init() {
    siteSettingsCache = await hakimApplySiteSettings();
    hakimInjectCustomCode();
    if (hakimShowMaintenanceIfNeeded()) return;
    await hakimLoadScript('site-text.js');
    await hakimLoadScript('media-utils.js');
    hakimAddTelegramButton();
    hakimInitInstallButton();

    if (!id) { showError('لم يتم تحديد كورس', 'الرابط لا يحتوي على معرّف كورس صالح.'); return; }

    /* الصفحة المولَّدة: بيانات الكورس مدمجة جوّاها. الصفحة العامة (القالب): ندوّر على ملف قديم .js وإلا نحوّل لصفحة الكورس */
    let ok = false;
    const inline = document.getElementById('course-data');
    if (inline) {
      try { window.__HAKIM_COURSES = window.__HAKIM_COURSES || {}; window.__HAKIM_COURSES[id] = JSON.parse(inline.textContent); ok = true; } catch (e) { console.warn('course-data', e); }
    } else {
      ok = await hakimLoadScript(`${id}.js`);
      if (!ok && !window.__COURSE_ID) { location.replace(`${encodeURIComponent(id)}.html`); return; }
    }
    const data = (window.__HAKIM_COURSES || {})[id];

    if (!ok || !data) {
      showError('تعذّر العثور على هذا الكورس', 'تأكد من صحة الرابط أو من وجود ملف بيانات الكورس.');
      return;
    }

    /* كورس مجدول: لسه ما جاش موعد ظهوره */
    if (!window.__HAKIM_PREVIEW && data.publishAt && Date.parse(data.publishAt) > Date.now()) {
      const at = Date.parse(data.publishAt);
      const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
      document.title = 'قريبًا — ' + (data.name || '');
      const mainEl = document.querySelector('main');
      mainEl.innerHTML = `<div style="text-align:center;padding:90px 16px"><div style="font-size:3rem">⏳</div><h2 style="margin:12px 0 6px">${hakimEscapeHtml(data.name || '')}</h2><p style="color:var(--text-muted);margin:0 0 6px">هذا الكورس سيتوفر قريبًا</p><p id="soonWhen" style="font-weight:800;font-size:1.1rem;margin:0 0 18px"></p><a class="hero-btn" href="index.html" style="display:inline-block;background:var(--red);color:#fff;padding:10px 24px;border-radius:999px;font-weight:800">العودة للرئيسية</a></div>`;
      const tick = () => {
        const left = at - Date.now();
        if (left <= 0) { location.reload(); return; }
        const d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000), mi = Math.floor(left % 3600000 / 60000);
        document.getElementById('soonWhen').textContent = 'يظهر بعد ' + (d ? d + ' يوم و' : '') + h + ' ساعة و' + mi + ' دقيقة';
      };
      tick(); setInterval(tick, 30000);
      return;
    }
    try { applyCourseSeo(id, data); } catch (e) { console.warn('seo', e); }
    window.__HK_CUR_COURSE = id; if (performance.now() > 8000) hakimHealth('slow_load', id, null, Math.round(performance.now()) + 'ms');
    if (data.archived) { const mn = document.querySelector('main'); if (mn) mn.insertAdjacentHTML('afterbegin', '<div style="margin:0 0 12px;padding:10px 14px;border-radius:10px;border:1px solid rgba(160,120,255,.5);background:rgba(160,120,255,.14);font-weight:700;text-align:center">🗄️ مؤرشف — الكورس ده مش ظاهر في قوائم الموقع حاليًا</div>'); }
    /* كورس مخفي (مش في courses-list.js): الصفحة المولَّدة ثابتة فبنمنع فهرستها وقت العرض. لو القائمة ما اتحمّلتش ما نعملش حاجة */
    if (!window.__HAKIM_PREVIEW) hakimLoadScript('courses-list.js').then(() => {
      const l = window.COURSES_LIST;
      if (Array.isArray(l) && !l.includes(id) && !document.querySelector('meta[name="robots"]')) {
        const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
      }
    });
    hakimTrackPageView('course', id);

    banner.innerHTML = `
      <div class="banner-img">
        <img loading="lazy" src="${data.img ? hakimEscapeHtml(data.img) : PLACEHOLDER_IMG}" alt="${hakimEscapeHtml(data.name || '')}"
             onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
      </div>
      <div>
        <h1>${hakimEscapeHtml(seoH1(data))}</h1>
        <p class="banner-desc">${hakimEscapeHtml(data.description || '')}</p>
        <div class="badges">
          ${data.category ? `<span>${hakimEscapeHtml(data.category)}</span>` : ''}
          ${data.level ? `<span>${hakimEscapeHtml(data.level)}</span>` : ''}
          ${(data.categories || []).map(c => `<span>${hakimEscapeHtml(c)}</span>`).join('')}
          ${((data.info && data.info.releaseDate) || []).map(r => `<span>${RELEASE_DATE_LABELS[r] || r}</span>`).join('')}
          <span>${(data.videos || []).length} فيديو</span>
        </div>
        <div class="course-actions-row" id="courseActionsRow"></div>
      </div>`;
    banner.querySelectorAll('img').forEach(hakimLazyFade);

    renderCourseActionsRow(id);
    renderRelatedSeasons(id, data);
    renderInfo(Object.assign({}, data.info || {}, { episodesCount: (data.videos || []).filter(v => !v.disabled).length || (data.videos || []).length || '' }));
    await renderCourseRatingWidget();

    currentVideos = data.videos || [];
    if (currentVideos.length === 0) {
      lessonListEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.noVideosYet) || 'لا توجد فيديوهات مضافة لهذا الكورس بعد.')}</p>`;
      playerNav.innerHTML = '';
      return;
    }

    courseMeta = { name: data.name || '', img: data.img || '', playback: data.playback || {} };
    let startIdx = 0;
    const epParam = window.__HAKIM_PREVIEW ? (parseInt(window.__HAKIM_PREVIEW_EP, 10) + 1) : parseInt(new URLSearchParams(location.search).get('ep'), 10);
    if (epParam >= 1 && epParam <= currentVideos.length) startIdx = epParam - 1;
    else {
      /* لو الزائر كان بيشاهد الكورس ده قبل كده نفتح على آخر حلقة وصل لها */
      try { const lw = JSON.parse(localStorage.getItem('hakim_last_watch')); if (lw && lw.id === id && lw.index >= 0 && lw.index < currentVideos.length) startIdx = lw.index; } catch (e) {}
    }
    playLesson(startIdx, !!window.__HAKIM_PREVIEW);
    if (window.__HAKIM_PREVIEW) setTimeout(() => { try { playerHost.scrollIntoView({ block: 'center' }); } catch (e) {} }, 400);
  }

  init();
  hakimInitTheme();
  hakimInitMenu();
  hakimInitMyListsMenu();
  hakimInitSectionsMenu();
})();

