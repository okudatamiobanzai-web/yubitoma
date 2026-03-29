-- ==========================================
-- 管理者テーブル + RLSポリシー
-- ==========================================

-- 管理者テーブル
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'moderator'
    CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS有効化
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 管理者は自身のレコードを読める
CREATE POLICY "Admin read own" ON admin_users
  FOR SELECT USING (true);

-- 既存テーブルへの管理者フルアクセスポリシー
CREATE POLICY "Admin full access" ON events FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON attendees FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON tane FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON projects FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON project_updates FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON supports FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON connection_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON core_member_invites FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admin full access" ON transport_services FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- 久保さんをsuper_adminとして初期登録
INSERT INTO admin_users (email, display_name, role)
VALUES ('info@shirubelab.jp', '久保竜太郎', 'super_admin');
