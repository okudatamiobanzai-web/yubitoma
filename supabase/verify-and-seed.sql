-- ==========================================
-- ゆびとま Supabase スキーマ確認 & 初期データ
-- Supabase SQL Editor で実行してください
-- ==========================================

-- ■ ステップ1: テーブル存在確認
-- 以下を実行して、全テーブルが存在するか確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 期待結果（13テーブル + admin_users）:
-- admin_users, attendees, connection_requests, core_member_invites,
-- events, notifications, profiles, project_members, project_updates,
-- projects, reviews, supports, tane, transport_services

-- ■ ステップ2: テーブルがない場合は schema.sql を先に実行
-- → supabase/schema.sql の内容を Supabase SQL Editor に貼り付けて実行
-- → その後 supabase/migrations/001_admin_users.sql を実行

-- ■ ステップ3: RLS ポリシー確認
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ■ ステップ4: Supabase Storage バケット作成
-- Supabase Dashboard → Storage → New Bucket
-- バケット名: media
-- Public: ON（公開バケット）

-- ■ ステップ5: 交通サービス初期データ（代行・タクシー）
INSERT INTO transport_services (service_type, name, phone, area, hours, note)
VALUES
  ('daikou', 'なかしべつ運転代行', '0153-72-XXXX', '中標津エリア', '20:00〜翌2:00', '要予約'),
  ('daikou', '別海運転代行', '0153-75-XXXX', '別海エリア', '20:00〜翌1:00', NULL),
  ('taxi', '中標津ハイヤー', '0153-72-XXXX', '中標津エリア', '24時間', NULL),
  ('taxi', '標津ハイヤー', '0153-82-XXXX', '標津エリア', '8:00〜22:00', '深夜は要相談')
ON CONFLICT DO NOTHING;

-- ■ ステップ6: admin_users に久保さんが登録済みか確認
SELECT * FROM admin_users;

-- 未登録の場合:
-- INSERT INTO admin_users (email, display_name, role)
-- VALUES ('info@shirubelab.jp', '久保竜太郎', 'super_admin')
-- ON CONFLICT (email) DO NOTHING;
