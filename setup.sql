-- ============================================================
-- منصة حكيم التعليمية — إعداد قاعدة بيانات Supabase (ملف واحد شامل)
-- ============================================================
-- الاستخدام: افتح مشروعك على supabase.com → SQL Editor →
-- الصق هذا الملف كامل → Run. يشتغل مرة واحدة بس، وآمن لإعادة
-- التشغيل لو احتجت (IF NOT EXISTS / DROP POLICY IF EXISTS في كل مكان).
--
-- ملاحظة: هذا الملف يجمع كل ما كان موزّعًا سابقًا على ملفين
-- (setup.sql + setup_addition_site_config.sql) في ملف واحد فقط —
-- لو شغّلت النسختين القديمتين قبل كده على نفس المشروع، تشغيل
-- هذا الملف آمن تمامًا ومش هيكرر أو يبوّظ حاجة.
-- ============================================================


-- ============================================================
-- 1) الجداول
-- ============================================================

-- ---------- 1.1) تتبّع الزيارات (تحليلات عامة) ----------
create table if not exists page_views (
  id bigint generated always as identity primary key,
  session_id text not null,
  page text not null,
  course_id text,
  episode_index int,
  country text,
  is_adblock boolean default false,
  created_at timestamptz default now()
);

-- ---------- 1.2) تقييم الحلقات (سري: العدد مخفي، المتوسط فقط ظاهر) ----------
create table if not exists episode_ratings (
  id bigint generated always as identity primary key,
  session_id text not null,
  course_id text not null,
  episode_index int not null,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz default now(),
  unique (session_id, course_id, episode_index)
);

-- ---------- 1.3) تقييم الكورس ككل ----------
create table if not exists course_ratings (
  id bigint generated always as identity primary key,
  session_id text not null,
  course_id text not null,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz default now(),
  unique (session_id, course_id)
);

-- ---------- 1.4) قسم الشكوى / تقييم بلاغ / استحقاق ربح ----------
create table if not exists complaints (
  id bigint generated always as identity primary key,
  full_name text,
  organization text,
  phone text,
  email text,
  description text not null,
  created_at timestamptz default now(),
  is_read boolean default false
);

-- ---------- 1.5) الاقتراحات ----------
create table if not exists suggestions (
  id bigint generated always as identity primary key,
  message text not null,
  created_at timestamptz default now(),
  is_read boolean default false
);

-- ---------- 1.6) إعدادات فورية (site_config) ----------
-- الهدف: تشغيل/إيقاف الإعلانات (Monetag أو غيرها) وأي مفتاح فوري
-- تاني لحظيًا من الأدمن، بدون انتظار commit + rebuild على GitHub
-- Pages (اللي بياخد وقت). الفرق عن site-settings.js: أي تعديل هنا
-- يظهر للزوار فورًا (ثوانٍ) بدل دقيقة أو أكتر مع GitHub. مناسب
-- بالظبط لحاجة "أوقف الإعلانات فورًا لو حصلت مشكلة" أو "شغّلها
-- وقت الإطلاق".
create table if not exists site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);


-- ============================================================
-- 2) تفعيل الحماية (Row Level Security) على كل الجداول
-- ============================================================
alter table page_views enable row level security;
alter table episode_ratings enable row level security;
alter table course_ratings enable row level security;
alter table complaints enable row level security;
alter table suggestions enable row level security;
alter table site_config enable row level security;


-- ============================================================
-- 3) السياسات (Policies)
-- ============================================================

-- الزوار (بالمفتاح العام anon) يقدروا يضيفوا بيانات بس، مش يقروها
drop policy if exists "anon can insert page_views" on page_views;
create policy "anon can insert page_views" on page_views
  for insert to anon with check (true);

drop policy if exists "anon can insert episode_ratings" on episode_ratings;
create policy "anon can insert episode_ratings" on episode_ratings
  for insert to anon with check (true);
drop policy if exists "anon can update own episode_ratings" on episode_ratings;
create policy "anon can update own episode_ratings" on episode_ratings
  for update to anon using (true) with check (true);

drop policy if exists "anon can insert course_ratings" on course_ratings;
create policy "anon can insert course_ratings" on course_ratings
  for insert to anon with check (true);
drop policy if exists "anon can update own course_ratings" on course_ratings;
create policy "anon can update own course_ratings" on course_ratings
  for update to anon using (true) with check (true);

drop policy if exists "anon can insert complaints" on complaints;
create policy "anon can insert complaints" on complaints
  for insert to anon with check (true);

drop policy if exists "anon can insert suggestions" on suggestions;
create policy "anon can insert suggestions" on suggestions
  for insert to anon with check (true);

-- الكل (الزوار) يقدروا يقروا إعدادات site_config فقط — عشان الموقع
-- يعرف يشغّل الإعلانات ولا لأ. محدش غير الأدمن (service_role) يقدر
-- يعدّل، لأن مفيش سياسة insert/update/delete للـ anon هنا أصلًا.
drop policy if exists "anon can read site_config" on site_config;
create policy "anon can read site_config" on site_config
  for select to anon using (true);


-- ============================================================
-- 4) بيانات افتراضية
-- ============================================================

-- القيمة الافتراضية لمفتاح الإعلانات: مقفولة لحد ما تفعّلها إنت يدويًا
insert into site_config (key, value)
values ('ads', '{
  "enabled": false,
  "provider": "monetag",
  "preroll_seconds": 5,
  "skippable_after_seconds": 5,
  "child_safe_mode": true
}'::jsonb)
on conflict (key) do nothing;


-- ============================================================
-- 5) دوال آمنة تُرجع "متوسطات فقط" للزوار (بدون كشف عدد المقيّمين
--    أو هويتهم) — تُستخدم من صفحات الموقع العادية بالمفتاح العام
-- ============================================================
create or replace function get_episode_rating(p_course_id text, p_episode_index int)
returns numeric
language sql
security definer
as $$
  select coalesce(round(avg(rating)::numeric, 1), 0)
  from episode_ratings
  where course_id = p_course_id and episode_index = p_episode_index;
$$;

create or replace function get_course_rating(p_course_id text)
returns numeric
language sql
security definer
as $$
  select coalesce(round(avg(rating)::numeric, 1), 0)
  from course_ratings
  where course_id = p_course_id;
$$;

create or replace function get_episode_views(p_course_id text, p_episode_index int)
returns bigint
language sql
security definer
as $$
  select count(*) from page_views
  where course_id = p_course_id and episode_index = p_episode_index and page = 'episode';
$$;


-- ============================================================
-- 5-ب) دوال منطقة الاكتشاف بالصفحة الرئيسية: الأعلى تقييمًا / الأكثر مشاهدة
-- ============================================================
create or replace function get_top_rated_courses(p_limit int default 10)
returns table(course_id text, avg_rating numeric, ratings_count bigint)
language sql
security definer
as $$
  select course_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as ratings_count
  from course_ratings
  group by course_id
  having count(*) > 0
  order by avg_rating desc, ratings_count desc
  limit p_limit;
$$;

create or replace function get_top_viewed_courses(p_limit int default 10)
returns table(course_id text, views bigint)
language sql
security definer
as $$
  select course_id, count(*) as views
  from page_views
  where page = 'course' and course_id is not null
  group by course_id
  order by views desc
  limit p_limit;
$$;


-- ============================================================
-- 6) ملاحظات مهمة
-- ============================================================
-- • المفتاح العام (anon key) هو اللي هتحطه في الموقع نفسه (site-settings.js) —
--   آمن يظهر للجميع، لأن سياسات الحماية فوق بتمنعه من قراءة أي
--   بيانات حساسة (زي الشكاوى أو الاقتراحات)، وبتسمحله بالإضافة
--   فقط في الجداول العادية، وبالقراءة فقط في site_config.
-- • المفتاح السري (service_role key) هو اللي هتحطه في admin.html
--   بس — ده اللي بيقدر يقرا ويعدّل كل حاجة (الشكاوى، الاقتراحات،
--   التحليلات التفصيلية، وتشغيل/إيقاف الإعلانات). متحطهوش في أي
--   ملف عام أبدًا، ومحفوظ في متصفح الأدمن فقط.
-- • "child_safe_mode" جوه site_config.ads: مقترح — يوقف عرض
--   الإعلانات (أو يحصرها في شكل ثابت/بانر بسيط فقط بدل فيديو/بوب
--   أب) على الكورسات المصنّفة للفئة العمرية 5-10 سنة تحديدًا، حتى
--   لو الإعلانات مفعّلة عمومًا على باقي الموقع.
-- • القراءة من الموقع لحالة الإعلانات بتكون طلب GET واحد بسيط:
--   GET {url}/rest/v1/site_config?key=eq.ads&select=value
--   باستخدام anon key (hakimSbSelect() في common.js).
-- • التعديل (تشغيل/إيقاف الإعلانات) بيتم فقط من admin.html باستخدام
--   service_role key، بالضبط زي باقي عمليات الأدمن الحالية.


-- ============================================================
-- الدفعة 2 (أكتوبر 2026): الحسابات + الملف الشخصي + البلاغات + مراقبة الصحة + الإحصائيات الشاملة
-- شغّله مرة واحدة في SQL Editor (آمن لإعادة التشغيل). لازم تفعّل Email provider من Authentication → Providers.
-- نصيحة: من Authentication → Sign In / Up عطّل "Confirm email" لو عايز التسجيل يدخل فورًا بدون تأكيد.
-- ============================================================

-- ---------- الملفات الشخصية ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  code        text not null unique,          -- الرمز المميز: 8 خانات حروف/أرقام مثل A35DJ663
  avatar_url  text,
  created_at  timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 3 and 24)
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
alter table public.profiles enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
-- المستخدم يقدر يعدّل اسمه وصورته بس (مش الرمز المميز):
revoke update on public.profiles from authenticated;
grant update (username, avatar_url) on public.profiles to authenticated;

create or replace function public.gen_profile_code() returns text language plpgsql as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..8 loop c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
    exit when not exists (select 1 from public.profiles where code = c);
  end loop;
  return c;
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare u text;
begin
  u := left(coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'user' || substr(new.id::text, 1, 6)), 24);
  if char_length(u) < 3 then u := 'user' || substr(new.id::text, 1, 6); end if;
  if exists (select 1 from public.profiles where lower(username) = lower(u)) then u := left(u, 20) || floor(random() * 900 + 100)::int; end if;
  insert into public.profiles (id, username, code) values (new.id, u, public.gen_profile_code());
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- الاسم متاح؟ (بيستخدمه نموذج التسجيل قبل الإرسال)
create or replace function public.username_available(p_username text) returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(trim(p_username)));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- عرض عام لمشاركة البروفايل (بالرمز فقط، من غير أي بيانات خاصة)
create or replace view public.public_profiles as select code, username, avatar_url, created_at from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- ---------- صور الملف الشخصي (Storage) ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- بلاغات الحلقات (بتوصل لصفحة الأدمن بدل GitHub) ----------
create table if not exists public.episode_reports (
  id            bigserial primary key,
  session_id    text,
  course_id     text not null,
  episode_index int,
  episode_title text,
  reason        text not null,
  details       text,
  page_url      text,
  status        text not null default 'new',   -- new | done
  created_at    timestamptz not null default now(),
  constraint er_len check (char_length(coalesce(details, '')) <= 1000 and char_length(reason) <= 200 and char_length(course_id) <= 100)
);
create index if not exists er_status_idx on public.episode_reports (status, created_at desc);
alter table public.episode_reports enable row level security;
drop policy if exists "anon insert reports" on public.episode_reports;
create policy "anon insert reports" on public.episode_reports for insert to anon, authenticated with check (true);

-- ---------- مراقبة الصحة من الزوار الحقيقيين (24/7) ----------
create table if not exists public.health_events (
  id            bigserial primary key,
  session_id    text,
  type          text not null,    -- video_error | video_no_start | video_stall | embed_no_load | js_error | slow_load
  course_id     text,
  episode_index int,
  page          text,
  detail        text,
  ua            text,
  created_at    timestamptz not null default now(),
  constraint he_len check (char_length(type) <= 40 and char_length(coalesce(detail, '')) <= 400 and char_length(coalesce(ua, '')) <= 200)
);
create index if not exists he_created_idx on public.health_events (created_at desc);
alter table public.health_events enable row level security;
drop policy if exists "anon insert health" on public.health_events;
create policy "anon insert health" on public.health_events for insert to anon, authenticated with check (true);

-- ---------- حدود أطوال للجداول القديمة (حماية الحصة المجانية من الإغراق) ----------
do $$ begin
  alter table public.complaints  add constraint complaints_len  check (char_length(coalesce(description, '')) <= 2000) not valid;
exception when others then null; end $$;
do $$ begin
  alter table public.suggestions add constraint suggestions_len check (char_length(coalesce(message, '')) <= 2000) not valid;
exception when others then null; end $$;

-- ---------- البحث اللي ملقاش نتيجة (بيغذّي صفحة "ماذا نفعل بعد" والإحصائيات) ----------
create table if not exists public.search_misses (
  id          bigserial primary key,
  session_id  text,
  q           text not null,
  q_norm      text not null,
  created_at  timestamptz not null default now(),
  constraint sm_len check (char_length(q) <= 80 and char_length(q_norm) <= 80)
);
create index if not exists sm_created_idx on public.search_misses (created_at desc);
alter table public.search_misses enable row level security;
drop policy if exists "anon insert search misses" on public.search_misses;
create policy "anon insert search misses" on public.search_misses for insert to anon, authenticated with check (true);

-- ---------- رسائل الاتصال: اتصل بنا / DMCA / أريد العمل معكم (بتوصل لتبويب "الاتصالات" في الأدمن) ----------
create table if not exists public.contact_messages (
  id           bigserial primary key,
  kind         text not null check (kind in ('contact', 'dmca', 'join')),
  full_name    text,
  email        text,
  phone        text,
  organization text,
  subject      text,
  message      text not null,
  extra        text,
  status       text not null default 'new',   -- new | done
  created_at   timestamptz not null default now(),
  constraint cm_len check (char_length(message) <= 4000 and char_length(coalesce(subject, '')) <= 200 and char_length(coalesce(full_name, '')) <= 200
                           and char_length(coalesce(email, '')) <= 200 and char_length(coalesce(organization, '')) <= 200
                           and char_length(coalesce(phone, '')) <= 200 and char_length(coalesce(extra, '')) <= 200)
);
create index if not exists cm_kind_idx on public.contact_messages (kind, status, created_at desc);
alter table public.contact_messages enable row level security;
drop policy if exists "anon insert contact" on public.contact_messages;
create policy "anon insert contact" on public.contact_messages for insert to anon, authenticated with check (true);

-- ---------- الإحصائيات الشاملة (للأدمن فقط عبر service_role) ----------
create or replace function public.admin_overview(p_days int default 30) returns jsonb language plpgsql security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365))); r jsonb;
begin
  select jsonb_build_object(
    'visits',        (select count(*) from page_views where created_at >= since),
    'uniques',       (select count(distinct session_id) from page_views where created_at >= since),
    'adblock',       (select count(*) from page_views where created_at >= since and is_adblock),
    'visits_total',  (select count(*) from page_views),
    'uniques_total', (select count(distinct session_id) from page_views),
    'today_visits',  (select count(*) from page_views where created_at >= date_trunc('day', now())),
    'today_uniques', (select count(distinct session_id) from page_views where created_at >= date_trunc('day', now())),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'v', v, 'u', u) order by d), '[]'::jsonb) from (
                select date_trunc('day', created_at)::date d, count(*) v, count(distinct session_id) u from page_views where created_at >= since group by 1) t),
    'countries', (select coalesce(jsonb_agg(jsonb_build_object('c', c, 'n', n)), '[]'::jsonb) from (
                select coalesce(country, 'غير معروف') c, count(*) n from page_views where created_at >= since group by 1 order by 2 desc limit 8) t),
    'top_courses', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'n', n)), '[]'::jsonb) from (
                select course_id id, count(*) n from page_views where created_at >= since and page = 'course' and course_id is not null group by 1 order by 2 desc limit 8) t),
    'top_episodes', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ep', ep, 'n', n)), '[]'::jsonb) from (
                select course_id id, episode_index ep, count(*) n from page_views where created_at >= since and page = 'episode' and course_id is not null group by 1, 2 order by 3 desc limit 8) t),
    'ratings', (select jsonb_build_object('n', count(*), 'avg', coalesce(round(avg(rating)::numeric, 2), 0)) from episode_ratings where true),
    'users', (select count(*) from profiles),
    'users_7d', (select count(*) from profiles where created_at >= now() - interval '7 days'),
    'reports_new', (select count(*) from episode_reports where status = 'new'),
    'complaints', (select count(*) from complaints),
    'suggestions', (select count(*) from suggestions),
    'contact_new', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, count(*) n from contact_messages where status = 'new' group by 1) t),
    'search_misses', (select coalesce(jsonb_agg(jsonb_build_object('q', q, 'n', n, 'u', u, 'last', last_at) order by n desc), '[]'::jsonb) from (
                select min(q) q, count(*) n, count(distinct session_id) u, max(created_at) as last_at from search_misses where created_at >= since group by q_norm order by 2 desc limit 10) t),
    'health_24h', (select coalesce(jsonb_object_agg(type, n), '{}'::jsonb) from (
                select type, count(*) n from health_events where created_at >= now() - interval '24 hours' group by 1) t)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_overview(int) from public, anon, authenticated;
grant execute on function public.admin_overview(int) to service_role;

-- ملاحظة: نظام "التصنيف العالمي" للمستخدمين لسه ما اتصنعش — الموقع بيعرض مكانه "قريبًا".
