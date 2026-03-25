-- NDX:Try Demo Seed Data for PlanX
-- Idempotent — safe to run multiple times (ON CONFLICT DO NOTHING)

-- 1. Team
INSERT INTO teams (id, slug, name, created_at, updated_at)
VALUES (26, 'ndx-demo', 'NDX Demo Council', now(), now())
ON CONFLICT (slug) DO NOTHING;

-- 2. Team theme
INSERT INTO team_themes (team_id, primary_colour, action_colour, link_colour)
VALUES (26, '#0B0C0C', '#1D70B8', '#1D70B8')
ON CONFLICT (team_id) DO NOTHING;

-- 3. Team settings
INSERT INTO team_settings (team_id, homepage, help_email, help_phone, help_opening_hours, external_planning_site_name, external_planning_site_url)
VALUES (26, 'https://ndx-demo.example.com', 'planning@ndx-demo.example.com', '020 7946 0958', 'Monday to Friday, 9am to 5pm', 'NDX Demo Planning Portal', 'https://ndx-demo.example.com/planning')
ON CONFLICT (team_id) DO NOTHING;

-- 4. Demo user
INSERT INTO users (id, first_name, last_name, email, created_at, updated_at, is_platform_admin)
VALUES (1001, 'Demo', 'User', 'demo@ndx-demo.example.com', now(), now(), true)
ON CONFLICT (email) DO NOTHING;

-- 5. Team membership
INSERT INTO team_members (team_id, user_id, role)
VALUES (26, 1001, 'teamEditor')
ON CONFLICT DO NOTHING;

-- 6. Sample flows
INSERT INTO flows (id, team_id, slug, name, data, status, created_at, updated_at, creator_id)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 26,
  'householder-planning-permission',
  'Apply for householder planning permission',
  '{"_root":{"edges":["n1","n2","n3"]},"n1":{"type":300,"data":{"title":"Householder Planning Permission","description":"<p>Apply for planning permission for works to a house or its grounds.</p>"}},"n2":{"type":110,"data":{"title":"Describe the proposed works","fn":"proposal.description"}},"n3":{"type":725,"data":{"title":"Application submitted","description":"<p>Your application has been submitted.</p>"}}}'::jsonb,
  'online', now(), now(), 1001
) ON CONFLICT (id) DO NOTHING;

INSERT INTO flows (id, team_id, slug, name, data, status, created_at, updated_at, creator_id)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 26,
  'lawful-development-certificate',
  'Apply for a lawful development certificate',
  '{"_root":{"edges":["l1","l2","l3"]},"l1":{"type":300,"data":{"title":"Lawful Development Certificate","description":"<p>Find out if your development is lawful.</p>"}},"l2":{"type":110,"data":{"title":"Describe the development","fn":"proposal.description"}},"l3":{"type":725,"data":{"title":"Application submitted"}}}'::jsonb,
  'online', now(), now(), 1001
) ON CONFLICT (id) DO NOTHING;
