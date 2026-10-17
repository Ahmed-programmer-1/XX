/* ============================================================
   nav.js — شريط تنقل سفلي على الموبايل (الرئيسية / بحث / قوائمي / المزيد)
   بيتحمّل في كل صفحات الزوار، ويظهر على الشاشات الصغيرة فقط.
   ============================================================ */
(function () {
  'use strict';
  if (window.__hakimNav || !document.body) return;
  window.__hakimNav = true;
  var CSS = '.m-nav{display:none}@media (max-width:720px){' +
    '.m-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:35;background:var(--surface,#121214);border-top:1px solid var(--line,#26262a);padding:6px 6px calc(6px + env(safe-area-inset-bottom));box-shadow:0 -6px 20px rgba(0,0,0,.25)}' +
    '.m-nav a,.m-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:0;color:var(--text-muted,#9a9aa2);font:inherit;font-size:.68rem;font-weight:700;padding:6px 2px;border-radius:12px;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent}' +
    '.m-nav svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.m-nav .on{color:var(--red,#e5202c)}.m-nav .on svg{stroke:var(--red,#e5202c)}' +
    'body{padding-bottom:calc(66px + env(safe-area-inset-bottom))}' +
    '.floating-telegram{bottom:calc(78px + env(safe-area-inset-bottom)) !important}' +
    '.toast{bottom:calc(84px + env(safe-area-inset-bottom)) !important}}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var isHome = here === 'index.html' || here === '';
  var tab = new URLSearchParams(location.search).get('tab');
  var I = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    lists: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 0112 6a5.4 5.4 0 019.3 6c-2.3 4.4-9.3 9-9.3 9z"/></svg>',
    more: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  var nav = document.createElement('nav'); nav.className = 'm-nav'; nav.setAttribute('aria-label', 'تنقل سريع');
  function item(tag, key, label, on, attrs) {
    var el = document.createElement(tag); el.innerHTML = I[key] + '<span>' + label + '</span>';
    if (on) el.className = 'on';
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  nav.appendChild(item('a', 'home', 'الرئيسية', isHome, { href: 'index.html' }));
  var s = item('button', 'search', 'بحث', false, { type: 'button' });
  s.addEventListener('click', function () {
    var inp = document.getElementById('searchInput');
    if (inp) { document.documentElement.classList.remove('hk-compact'); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(function () { inp.focus(); }, 300); }
    else location.href = 'index.html?focus=search';
  });
  nav.appendChild(s);
  nav.appendChild(item('a', 'lists', 'قوائمي', here === 'hub.html' && tab === 'mylists', { href: 'hub.html?tab=mylists' }));
  var m = item('button', 'more', 'المزيد', false, { type: 'button' });
  m.addEventListener('click', function () { var b = document.getElementById('menuBtn'); if (b) b.click(); });
  nav.appendChild(m);
  document.body.appendChild(nav);
})();

/* تحميل نظام الحسابات (account.js) تلقائيًا في كل الصفحات اللي فيها nav.js */
(function () { if (window.__hakimAccLoad) return; window.__hakimAccLoad = true; var s = document.createElement('script'); s.src = 'account.js'; s.defer = true; (document.head || document.documentElement).appendChild(s); })();

/* هيدر الموبايل: حقل البحث بيختفي لما تنزل تتصفّح (يوفّر مساحة) ويرجع أول ما تطلع لفوق */
(function () {
  var last = 0, busy = false, de = document.documentElement;
  window.addEventListener('scroll', function () {
    if (busy) return; busy = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset || 0;
      if (y < 80) de.classList.remove('hk-compact');
      else if (y > last + 8) de.classList.add('hk-compact');
      else if (y < last - 8) de.classList.remove('hk-compact');
      last = y; busy = false;
    });
  }, { passive: true });
})();
