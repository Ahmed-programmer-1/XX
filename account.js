/* ============================================================
   account.js — نظام الحسابات الأولي (تسجيل / دخول / ملف شخصي)
   بيتحمّل تلقائيًا من nav.js في كل صفحات الزوار (حتى صفحات الكورسات القديمة المولَّدة).
   بيشتغل فوق Supabase Auth (إيميل + اسم مستخدم + كلمة سر). لو Supabase مش مربوط في
   إعدادات الموقع: مفيش زر حساب ظاهر، والقوائم بتفضل شغّالة محليًا زي ما هي.
   الإيميل احتياطي فقط لاسترجاع الحساب. تسجيل الدخول بالإيميل + كلمة السر.
   ============================================================ */
(function () {
  'use strict';
  if (window.HakimAccount) return;

  var KEY = 'hakim_auth';
  var A = { session: null, profile: null, ready: false, cbs: [] };

  function cfg() { var s = window.SITE_SETTINGS || {}; return { url: (s.supabaseUrl || '').replace(/\/+$/, ''), key: s.supabaseAnonKey || '' }; }
  function enabled() { var c = cfg(); return !!(c.url && c.key); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function emit() { A.cbs.forEach(function (f) { try { f(A); } catch (e) {} }); renderHeaderBtn(); }

  /* ---------------- الجلسة ---------------- */
  function loadSession() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function saveSession(s) {
    if (s && s.access_token) {
      s.expires_at = s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600));
      A.session = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    } else { A.session = null; A.profile = null; try { localStorage.removeItem(KEY); } catch (e) {} }
  }
  function authErr(j, status) {
    var m = String((j && (j.msg || j.message || j.error_description || j.error)) || '').toLowerCase();
    if (m.indexOf('invalid login') > -1) return 'الإيميل أو كلمة السر غير صحيحة';
    if (m.indexOf('already') > -1 || m.indexOf('registered') > -1) return 'الإيميل ده مسجّل بالفعل — جرّب تسجيل الدخول';
    if (m.indexOf('password') > -1 && (m.indexOf('short') > -1 || m.indexOf('least') > -1 || m.indexOf('weak') > -1)) return 'كلمة السر ضعيفة — اختر 6 خانات على الأقل';
    if (m.indexOf('email') > -1 && m.indexOf('confirm') > -1) return 'لازم تأكّد الإيميل الأول (شوف بريدك)';
    if (m.indexOf('rate') > -1 || status === 429) return 'محاولات كتير — استنى شوية وجرّب تاني';
    if (m.indexOf('valid email') > -1 || m.indexOf('invalid') > -1) return 'تأكد من كتابة الإيميل صح';
    return 'حصلت مشكلة (' + (status || '؟') + ') — جرّب تاني';
  }
  async function authCall(path, body) {
    var c = cfg();
    var res = await fetch(c.url + '/auth/v1/' + path, { method: 'POST', headers: { apikey: c.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var j = null; try { j = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, json: j };
  }
  async function ensureFresh() {
    if (!A.session) return false;
    if (A.session.expires_at - 60 > Date.now() / 1000) return true;
    var r = await authCall('token?grant_type=refresh_token', { refresh_token: A.session.refresh_token });
    if (r.ok && r.json && r.json.access_token) { saveSession(r.json); return true; }
    saveSession(null); return false;
  }
  async function authed(path, opts) {
    if (!(await ensureFresh())) throw new Error('انتهت الجلسة — سجّل دخولك تاني');
    var c = cfg(); opts = opts || {};
    var h = Object.assign({ apikey: c.key, Authorization: 'Bearer ' + A.session.access_token }, opts.headers || {});
    return fetch(c.url + path, Object.assign({}, opts, { headers: h }));
  }

  /* ---------------- العمليات ---------------- */
  var USER_RE = /^[\p{L}\p{N}_.\- ]{3,24}$/u;
  async function usernameAvailable(u) {
    var c = cfg();
    try {
      var res = await fetch(c.url + '/rest/v1/rpc/username_available', { method: 'POST', headers: { apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_username: u }) });
      if (!res.ok) return true; /* الدالة مش موجودة؟ نسيب السيرفر يحكم */
      return (await res.json()) === true;
    } catch (e) { return true; }
  }
  async function signUp(email, username, password) {
    username = String(username || '').trim();
    if (!USER_RE.test(username)) return { error: 'اسم المستخدم 3 إلى 24 حرفًا (حروف/أرقام/ _ . -)' };
    if (String(password || '').length < 6) return { error: 'كلمة السر لازم تكون 6 خانات على الأقل' };
    if (!(await usernameAvailable(username))) return { error: 'اسم المستخدم ده محجوز — اختر اسم تاني' };
    var r = await authCall('signup', { email: String(email).trim(), password: password, data: { username: username } });
    if (!r.ok) return { error: authErr(r.json, r.status) };
    if (r.json && r.json.access_token) { saveSession(r.json); await refreshProfile(); emit(); return { ok: true }; }
    return { ok: true, confirm: true };
  }
  async function signIn(email, password) {
    var r = await authCall('token?grant_type=password', { email: String(email).trim(), password: password });
    if (!r.ok || !r.json || !r.json.access_token) return { error: authErr(r.json, r.status) };
    saveSession(r.json); await refreshProfile(); emit(); return { ok: true };
  }
  async function recover(email) {
    var r = await authCall('recover', { email: String(email).trim() });
    return r.ok ? { ok: true } : { error: authErr(r.json, r.status) };
  }
  function signOut() { saveSession(null); emit(); }
  async function refreshProfile() {
    if (!A.session) return null;
    try {
      var uid = A.session.user && A.session.user.id;
      var res = await authed('/rest/v1/profiles?select=*&id=eq.' + encodeURIComponent(uid));
      var rows = res.ok ? await res.json() : [];
      A.profile = rows[0] || null;
    } catch (e) { A.profile = null; }
    return A.profile;
  }
  async function updateProfile(fields) {
    var uid = A.session && A.session.user && A.session.user.id; if (!uid) return { error: 'سجّل دخولك الأول' };
    if (fields.username != null) {
      fields.username = String(fields.username).trim();
      if (!USER_RE.test(fields.username)) return { error: 'اسم المستخدم 3 إلى 24 حرفًا (حروف/أرقام/ _ . -)' };
      if (A.profile && fields.username.toLowerCase() !== String(A.profile.username).toLowerCase() && !(await usernameAvailable(fields.username))) return { error: 'اسم المستخدم ده محجوز — اختر اسم تاني' };
    }
    var res = await authed('/rest/v1/profiles?id=eq.' + encodeURIComponent(uid), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(fields) });
    if (!res.ok) return { error: res.status === 409 ? 'اسم المستخدم ده محجوز — اختر اسم تاني' : 'تعذّر الحفظ (' + res.status + ')' };
    await refreshProfile(); emit(); return { ok: true };
  }
  function squareBlob(file, size) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(img.width, img.height), cv = document.createElement('canvas'); cv.width = cv.height = size;
        cv.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        URL.revokeObjectURL(url); cv.toBlob(function (b) { b ? resolve(b) : reject(new Error('تعذّر معالجة الصورة')); }, 'image/jpeg', 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('الملف ده مش صورة صالحة')); };
      img.src = url;
    });
  }
  async function uploadAvatar(file) {
    var uid = A.session && A.session.user && A.session.user.id; if (!uid) return { error: 'سجّل دخولك الأول' };
    if (!file || !/^image\//.test(file.type)) return { error: 'اختر ملف صورة' };
    if (file.size > 8 * 1024 * 1024) return { error: 'الصورة كبيرة (الحد 8 ميجا)' };
    try {
      var blob = await squareBlob(file, 256);
      var res = await authed('/storage/v1/object/avatars/' + uid + '/avatar.jpg', { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob });
      if (!res.ok) return { error: res.status === 404 || res.status === 400 ? 'مخزن الصور مش جاهز — شغّل setup.sql في Supabase' : 'تعذّر رفع الصورة (' + res.status + ')' };
      var c = cfg();
      return updateProfile({ avatar_url: c.url + '/storage/v1/object/public/avatars/' + uid + '/avatar.jpg?v=' + Date.now() });
    } catch (e) { return { error: e.message }; }
  }

  /* ---------------- واجهة الدخول/التسجيل ---------------- */
  var CSS = '.hk-auth-ov{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.66);display:none;align-items:center;justify-content:center;padding:16px}.hk-auth-ov.show{display:flex}' +
    '.hk-auth{width:100%;max-width:400px;background:var(--surface,#161616);color:var(--text,#f2f2f2);border:1px solid var(--line,#2a2a2c);border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.5);font-family:inherit}' +
    '.hk-auth h3{margin:0 0 4px;font-size:1.15rem}.hk-auth p.sub{margin:0 0 14px;font-size:.82rem;color:var(--text-muted,#9a9a9d)}' +
    '.hk-auth .tabs{display:flex;gap:6px;margin-bottom:14px}.hk-auth .tabs button{flex:1;padding:9px;border-radius:10px;border:1px solid var(--line,#2a2a2c);background:none;color:inherit;font:inherit;font-weight:700;cursor:pointer}.hk-auth .tabs button.on{background:var(--red,#e5202c);border-color:var(--red,#e5202c);color:#fff}' +
    '.hk-auth label{display:block;font-size:.78rem;margin:10px 0 4px;color:var(--text-muted,#9a9a9d)}.hk-auth input{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;border:1px solid var(--line,#2a2a2c);background:var(--surface-2,#1c1c1e);color:inherit;font:inherit}' +
    '.hk-auth .go{width:100%;margin-top:16px;padding:12px;border:0;border-radius:12px;background:var(--red,#e5202c);color:#fff;font:inherit;font-weight:800;cursor:pointer}.hk-auth .go[disabled]{opacity:.6}' +
    '.hk-auth .msg{min-height:18px;margin-top:10px;font-size:.8rem;color:#ff7b84}.hk-auth .msg.ok{color:#4ade80}.hk-auth .lnk{background:none;border:0;color:var(--text-muted,#9a9a9d);font:inherit;font-size:.78rem;cursor:pointer;margin-top:8px;text-decoration:underline;padding:0}' +
    '.hk-auth .x{float:left;background:none;border:0;color:inherit;font-size:1.3rem;cursor:pointer;line-height:1}' +
    '.hk-acc-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--line,#2a2a2c);background:var(--surface-2,#1c1c1e);color:inherit;font:inherit;font-size:.82rem;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;flex:0 0 auto}' +
    '.hk-acc-btn:hover{border-color:var(--red,#e5202c)}.hk-acc-btn img,.hk-acc-btn .ini{width:24px;height:24px;border-radius:50%;object-fit:cover;background:var(--red,#e5202c);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.72rem}' +
    '@media(max-width:720px){.hk-acc-btn{padding:0 9px;height:34px}.hk-acc-btn .nm{display:none}}';
  var mode = 'login', modalEl = null;
  function ensureModal() {
    if (modalEl) return modalEl;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    modalEl = document.createElement('div'); modalEl.className = 'hk-auth-ov';
    modalEl.innerHTML = '<div class="hk-auth" role="dialog" aria-modal="true"><button class="x" type="button" aria-label="إغلاق">×</button>' +
      '<h3 id="hkAuthTitle">أهلًا بيك 👋</h3><p class="sub" id="hkAuthSub"></p>' +
      '<div class="tabs"><button type="button" data-m="login">تسجيل الدخول</button><button type="button" data-m="signup">إنشاء حساب</button></div>' +
      '<div id="hkF_user" style="display:none"><label>اسم المستخدم</label><input id="hkAuthUser" autocomplete="username" maxlength="24" placeholder="مثال: ahmed_55"></div>' +
      '<label>الإيميل</label><input id="hkAuthEmail" type="email" dir="ltr" autocomplete="email" placeholder="name@example.com">' +
      '<div id="hkF_pass"><label>كلمة السر</label><input id="hkAuthPass" type="password" dir="ltr" autocomplete="current-password" placeholder="••••••"></div>' +
      '<button class="go" type="button" id="hkAuthGo">دخول</button><div class="msg" id="hkAuthMsg"></div>' +
      '<button class="lnk" type="button" id="hkAuthForgot">نسيت كلمة السر؟</button></div>';
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeAuth(); });
    modalEl.querySelector('.x').addEventListener('click', closeAuth);
    modalEl.querySelectorAll('.tabs button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.m); }); });
    modalEl.querySelector('#hkAuthGo').addEventListener('click', submit);
    modalEl.querySelector('#hkAuthForgot').addEventListener('click', function () { setMode(mode === 'forgot' ? 'login' : 'forgot'); });
    modalEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); if (e.key === 'Escape') closeAuth(); });
    return modalEl;
  }
  function msg(t, ok) { var m = modalEl.querySelector('#hkAuthMsg'); m.textContent = t || ''; m.className = 'msg' + (ok ? ' ok' : ''); }
  function setMode(m) {
    mode = m; var el = ensureModal();
    el.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.m === (m === 'forgot' ? 'login' : m)); });
    el.querySelector('#hkF_user').style.display = m === 'signup' ? '' : 'none';
    el.querySelector('#hkF_pass').style.display = m === 'forgot' ? 'none' : '';
    el.querySelector('#hkAuthPass').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
    el.querySelector('#hkAuthGo').textContent = m === 'signup' ? 'إنشاء الحساب' : m === 'forgot' ? 'ابعت رابط الاسترجاع' : 'دخول';
    el.querySelector('#hkAuthForgot').textContent = m === 'forgot' ? '← رجوع لتسجيل الدخول' : 'نسيت كلمة السر؟';
    el.querySelector('#hkAuthForgot').style.display = m === 'signup' ? 'none' : '';
    msg('');
  }
  function openAuth(m, reason) {
    if (!enabled()) { alert('نظام الحسابات لسه ما اتفعّلش في الموقع.'); return; }
    var el = ensureModal(); setMode(m || 'login');
    el.querySelector('#hkAuthSub').textContent = reason || 'سجّل عشان تحفظ وتتابع كورساتك وتبني ملفك الشخصي.';
    el.classList.add('show'); setTimeout(function () { var f = el.querySelector(mode === 'signup' ? '#hkAuthUser' : '#hkAuthEmail'); if (f) f.focus(); }, 60);
  }
  function closeAuth() { if (modalEl) modalEl.classList.remove('show'); }
  async function submit() {
    var go = modalEl.querySelector('#hkAuthGo'), email = modalEl.querySelector('#hkAuthEmail').value.trim(), pass = modalEl.querySelector('#hkAuthPass').value, user = modalEl.querySelector('#hkAuthUser').value.trim();
    if (!email) { msg('اكتب الإيميل'); return; }
    go.disabled = true; msg('جارٍ التنفيذ...', true);
    try {
      var r;
      if (mode === 'signup') r = await signUp(email, user, pass);
      else if (mode === 'forgot') { r = await recover(email); if (r.ok) { msg('لو الإيميل مسجّل هيوصلك رابط استرجاع الحساب 📧', true); go.disabled = false; return; } }
      else { if (!pass) { msg('اكتب كلمة السر'); go.disabled = false; return; } r = await signIn(email, pass); }
      if (r.error) msg(r.error);
      else if (r.confirm) msg('اتعمل الحساب ✅ — فعّل الإيميل من الرسالة اللي وصلتلك وبعدين سجّل دخول.', true);
      else { closeAuth(); if (typeof window.hakimToast === 'function') window.hakimToast('أهلًا بيك ' + ((A.profile && A.profile.username) || '') + ' 👋', 'success'); }
    } catch (e) { msg('تعذّر الاتصال — جرّب تاني'); }
    go.disabled = false;
  }

  /* ---------------- زر الهيدر ---------------- */
  function renderHeaderBtn() {
    var host = document.querySelector('.header-actions'); if (!host) return;
    var b = document.getElementById('hkAccBtn');
    if (!enabled()) { if (b) b.remove(); return; }
    if (!document.getElementById('hkAccStyle')) { var st = document.createElement('style'); st.id = 'hkAccStyle'; st.textContent = CSS; document.head.appendChild(st); }
    if (!b) {
      b = document.createElement('a'); b.id = 'hkAccBtn'; b.className = 'hk-acc-btn';
      var anchor = document.getElementById('menuBtn') || host.lastElementChild; host.insertBefore(b, anchor);
    }
    var p = A.profile, u = A.session && A.session.user;
    if (u) {
      var nm = (p && p.username) || (u.email || '').split('@')[0] || 'حسابي';
      b.href = 'profile.html'; b.onclick = null; b.title = 'ملفي الشخصي';
      b.innerHTML = (p && p.avatar_url ? '<img src="' + esc(p.avatar_url) + '" alt="">' : '<span class="ini">' + esc(nm.charAt(0).toUpperCase()) + '</span>') + '<span class="nm">' + esc(nm) + '</span>';
    } else {
      b.removeAttribute('href'); b.title = 'تسجيل الدخول'; b.innerHTML = '<span>👤</span><span class="nm">دخول</span>';
      b.onclick = function (e) { e.preventDefault(); openAuth('login'); };
    }
  }

  /* بوابة: بترجّع true (وتفتح نافذة الدخول) لو لازم المستخدم يسجّل الأول — بتشتغل بس لو الحسابات مفعّلة */
  window.hakimAuthGate = function (reason) {
    if (!enabled() || (A.session && A.session.user)) return false;
    openAuth('login', reason || 'لازم تسجّل دخولك عشان تحفظ أو تتابع كورس.'); return true;
  };

  window.HakimAccount = {
    enabled: enabled, cfg: cfg, get session() { return A.session; }, get user() { return A.session && A.session.user; }, get profile() { return A.profile; },
    onChange: function (f) { A.cbs.push(f); if (A.ready) { try { f(A); } catch (e) {} } },
    openAuth: openAuth, signOut: signOut, signUp: signUp, signIn: signIn, updateProfile: updateProfile, uploadAvatar: uploadAvatar, refreshProfile: refreshProfile, usernameAvailable: usernameAvailable
  };

  /* ---------------- تهيئة: ننتظر إعدادات الموقع (Supabase) تتحمّل ---------------- */
  async function boot() {
    var tries = 0;
    while (!enabled() && tries++ < 25) await new Promise(function (r) { setTimeout(r, 300); });
    if (enabled()) {
      A.session = loadSession();
      if (A.session && await ensureFresh()) await refreshProfile(); else if (A.session) saveSession(null);
    }
    A.ready = true; emit();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
