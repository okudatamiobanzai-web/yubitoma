-- ============================================
-- nomikai-app: DB初期設定
-- ============================================

-- 1. プロフィール（Supabase Auth連携）
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  provider text, -- 'line' | 'google'
  line_user_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. イベント
create type event_type as enum ('nomikai', 'taiken');
create type event_status as enum ('recruiting', 'confirmed', 'closed', 'cancelled');
create type payment_method as enum ('cash', 'square', 'shirube_proxy');

create table events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references profiles(id),
  event_type event_type not null default 'nomikai',
  title text not null,
  description text,
  theme_tag text,
  date date not null,
  start_time time not null,
  venue_name text,
  venue_address text,
  venue_phone text,
  flyer_url text,
  -- 飲み会用
  min_people int default 2,
  max_people int,
  has_after_party boolean default false, -- 2次会@milk
  -- 体験イベント用
  fee_per_person int, -- 円/人
  target_revenue int, -- 目標売上（円）
  insurance_required boolean default false,
  -- 決済
  payment_method payment_method default 'cash',
  square_payment_url text,
  -- アクセス制御
  is_private boolean default false,
  invite_code text unique,
  -- ステータス
  status event_status default 'recruiting',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 参加者
create type transport_type as enum ('car', 'daikou', 'taxi', 'walk_bike', 'rideshare');

create table attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id),
  drink_preference text, -- 飲み物の好み
  transport transport_type,
  offer_rideshare boolean default false,
  rideshare_seats int default 0,
  insurance_agreed boolean default false,
  payment_completed boolean default false,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- 4. 代行・タクシーサービスマスタ
create type service_type as enum ('daikou', 'taxi');

create table transport_services (
  id uuid primary key default gen_random_uuid(),
  service_type service_type not null,
  name text not null,
  phone text not null,
  area text,
  hours text,
  note text
);

-- 初期データ: 中標津エリアの代行・タクシー
insert into transport_services (service_type, name, phone, area, hours) values
  ('daikou', '中標津運転代行', '0153-72-XXXX', '中標津町内', '20:00〜翌2:00'),
  ('taxi', '中標津ハイヤー', '0153-72-XXXX', '中標津・周辺町村', '24時間');

-- ============================================
-- トリガー: 参加者増減時にステータス自動判定
-- ============================================
create or replace function update_event_status()
returns trigger as $$
declare
  attendee_count int;
  current_revenue int;
  ev record;
begin
  select * into ev from events where id = coalesce(new.event_id, old.event_id);
  select count(*) into attendee_count from attendees where event_id = ev.id;

  if ev.event_type = 'nomikai' then
    if attendee_count >= ev.min_people then
      update events set status = 'confirmed', updated_at = now() where id = ev.id;
    else
      update events set status = 'recruiting', updated_at = now() where id = ev.id;
    end if;
  elsif ev.event_type = 'taiken' then
    current_revenue := attendee_count * coalesce(ev.fee_per_person, 0);
    if current_revenue >= coalesce(ev.target_revenue, 0) then
      update events set status = 'confirmed', updated_at = now() where id = ev.id;
    else
      update events set status = 'recruiting', updated_at = now() where id = ev.id;
    end if;
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger on_attendee_change
  after insert or delete on attendees
  for each row execute function update_event_status();

-- ============================================
-- RLS（Row Level Security）
-- ============================================
alter table profiles enable row level security;
alter table events enable row level security;
alter table attendees enable row level security;

-- profiles: 自分のプロフィールのみ編集可、全員閲覧可
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- events: 公開イベントは全員閲覧可、プライベートは招待コード保持者のみ
create policy "events_select" on events for select using (
  not is_private or organizer_id = auth.uid()
);
create policy "events_insert" on events for insert with check (auth.uid() = organizer_id);
create policy "events_update" on events for update using (auth.uid() = organizer_id);

-- attendees: 参加者は全員閲覧可、自分のレコードのみ作成・削除
create policy "attendees_select" on attendees for select using (true);
create policy "attendees_insert" on attendees for insert with check (auth.uid() = user_id);
create policy "attendees_delete" on attendees for delete using (auth.uid() = user_id);

-- ============================================
-- Storage: チラシ画像
-- ============================================
insert into storage.buckets (id, name, public) values ('flyers', 'flyers', true);

create policy "flyers_upload" on storage.objects for insert
  with check (bucket_id = 'flyers' and auth.role() = 'authenticated');
create policy "flyers_read" on storage.objects for select
  using (bucket_id = 'flyers');
