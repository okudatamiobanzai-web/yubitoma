-- ==========================================
-- MVP用: RLSを全テーブルオープンに
-- 小規模コミュニティアプリなので、まず動くことを優先
-- セキュリティ強化は利用者が増えてから
-- ==========================================

-- INSERT: 誰でもOK
DROP POLICY IF EXISTS "Authenticated insert" ON events;
DROP POLICY IF EXISTS "Authenticated insert" ON attendees;
DROP POLICY IF EXISTS "Authenticated insert" ON tane;
DROP POLICY IF EXISTS "Authenticated insert" ON projects;
DROP POLICY IF EXISTS "Authenticated insert" ON project_updates;
DROP POLICY IF EXISTS "Authenticated insert" ON supports;
DROP POLICY IF EXISTS "Authenticated insert" ON reviews;
DROP POLICY IF EXISTS "Authenticated insert" ON connection_requests;
DROP POLICY IF EXISTS "Authenticated insert" ON profiles;

CREATE POLICY "Open insert" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Open insert" ON attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Open insert" ON tane FOR INSERT WITH CHECK (true);
CREATE POLICY "Open insert" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Open insert" ON project_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Open insert" ON supports FOR INSERT WITH CHECK (true);
CREATE POLICY "Open insert" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Open insert" ON connection_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Open insert" ON profiles FOR INSERT WITH CHECK (true);

-- UPDATE: 誰でもOK
DROP POLICY IF EXISTS "Authenticated update" ON events;
DROP POLICY IF EXISTS "Authenticated update" ON tane;
DROP POLICY IF EXISTS "Authenticated update" ON projects;
DROP POLICY IF EXISTS "Authenticated update" ON profiles;

CREATE POLICY "Open update" ON events FOR UPDATE USING (true);
CREATE POLICY "Open update" ON tane FOR UPDATE USING (true);
CREATE POLICY "Open update" ON projects FOR UPDATE USING (true);
CREATE POLICY "Open update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Open update" ON notifications FOR UPDATE USING (true);

-- DELETE: 誰でもOK
DROP POLICY IF EXISTS "Auth delete own" ON attendees;
DROP POLICY IF EXISTS "Auth delete own" ON supports;

CREATE POLICY "Open delete" ON attendees FOR DELETE USING (true);
CREATE POLICY "Open delete" ON supports FOR DELETE USING (true);
