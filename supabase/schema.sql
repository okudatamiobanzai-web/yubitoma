-- ==========================================
-- 指とま（yubi-toma）DBスキーマ
-- Supabase SQL Editor で実行
-- ==========================================

-- 1. プロフィール
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  provider TEXT CHECK (provider IN ('line', 'google')),
  line_user_id TEXT UNIQUE,
  bio TEXT,
  area TEXT,
  interest_tags TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. イベント（飲み会・イベント）
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('nomikai', 'event')),
  title TEXT NOT NULL,
  description TEXT,
  theme_tag TEXT,
  date DATE NOT NULL,
  start_time TEXT,
  venue_name TEXT,
  venue_address TEXT,
  venue_phone TEXT,
  flyer_url TEXT,
  cover_image_url TEXT,
  min_people INT DEFAULT 2,
  max_people INT,
  has_after_party BOOLEAN DEFAULT false,
  fee_per_person INT,
  target_revenue INT,
  insurance_required BOOLEAN DEFAULT false,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'square', 'shirube_proxy')),
  square_payment_url TEXT,
  is_private BOOLEAN DEFAULT false,
  invite_code TEXT,
  requires_approval BOOLEAN DEFAULT true,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'confirmed', 'closed', 'cancelled')),
  related_project_id UUID,
  rich_content JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 参加者
CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  drink_preference TEXT,
  transport TEXT CHECK (transport IN ('car', 'daikou', 'taxi', 'walk_bike', 'rideshare', 'stay')),
  stay_needs_info BOOLEAN DEFAULT false,
  offer_rideshare BOOLEAN DEFAULT false,
  rideshare_seats INT DEFAULT 0,
  insurance_agreed BOOLEAN DEFAULT false,
  payment_completed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  referred_by UUID REFERENCES profiles(id),
  terms_agreed BOOLEAN DEFAULT false,
  sns_ng BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 4. タネ（🌱）
CREATE TABLE tane (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  promotion_threshold INT DEFAULT 20,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reached', 'promoted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. プロジェクト（🚀）
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed')),
  external_links JSONB DEFAULT '[]',
  tane_id UUID REFERENCES tane(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- events.related_project_id の外部キー（projects作成後に追加）
ALTER TABLE events ADD CONSTRAINT fk_related_project
  FOREIGN KEY (related_project_id) REFERENCES projects(id);

-- 6. プロジェクトコアメンバー
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'core' CHECK (role IN ('owner', 'core')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 7. プロジェクト進捗投稿
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 応援（タネ・プロジェクト・イベント共通）
CREATE TABLE supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('event', 'tane', 'project')),
  target_id UUID NOT NULL,
  role TEXT DEFAULT 'supporter' CHECK (role IN ('core', 'supporter', 'watcher')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- 9. コアメンバー招待リンク
CREATE TABLE core_member_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  used_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. つながりリクエスト
CREATE TABLE connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id),
  to_user_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- 11. 通知
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  tane_id UUID REFERENCES tane(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES profiles(id),
  is_read BOOLEAN DEFAULT false,
  action_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. 代行・タクシー
CREATE TABLE transport_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL CHECK (service_type IN ('daikou', 'taxi')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  area TEXT,
  hours TEXT,
  note TEXT
);

-- 13. レビュー（振り返り）
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  media_urls TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- ==========================================
-- インデックス
-- ==========================================
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_attendees_event ON attendees(event_id);
CREATE INDEX idx_attendees_user ON attendees(user_id);
CREATE INDEX idx_supports_target ON supports(target_type, target_id);
CREATE INDEX idx_supports_user ON supports(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_tane_status ON tane(status);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_updates_project ON project_updates(project_id);

-- ==========================================
-- RLS（Row Level Security）
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tane ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_member_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員OK（公開データ）
CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read" ON events FOR SELECT USING (true);
CREATE POLICY "Public read" ON attendees FOR SELECT USING (true);
CREATE POLICY "Public read" ON tane FOR SELECT USING (true);
CREATE POLICY "Public read" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read" ON project_members FOR SELECT USING (true);
CREATE POLICY "Public read" ON project_updates FOR SELECT USING (true);
CREATE POLICY "Public read" ON supports FOR SELECT USING (true);
CREATE POLICY "Public read" ON transport_services FOR SELECT USING (true);
CREATE POLICY "Public read" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public read" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public read" ON core_member_invites FOR SELECT USING (true);
CREATE POLICY "Public read" ON connection_requests FOR SELECT USING (true);

-- 書き込みは認証ユーザーのみ
CREATE POLICY "Auth insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Auth insert" ON events FOR INSERT WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Auth update own" ON events FOR UPDATE USING (organizer_id = auth.uid());
CREATE POLICY "Auth insert" ON attendees FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth insert" ON tane FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Auth update own" ON tane FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Auth insert" ON projects FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Auth update own" ON projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Auth insert" ON project_updates FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Auth insert" ON supports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth insert" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth insert" ON connection_requests FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "Auth insert" ON notifications FOR INSERT WITH CHECK (true);
