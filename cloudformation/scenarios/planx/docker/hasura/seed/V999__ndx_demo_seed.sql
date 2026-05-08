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
-- Upstream removed external_planning_site_name/_url and added is_trial. Without
-- a row here at all, the editor's Team route does `team.settings.isTrial` on a
-- null settings relation and the page crashes with "Cannot read properties of
-- null (reading 'isTrial')".
INSERT INTO team_settings (team_id, homepage, help_email, help_phone, help_opening_hours, is_trial)
VALUES (26, 'https://ndx-demo.example.com', 'planning@ndx-demo.example.com', '020 7946 0958', 'Monday to Friday, 9am to 5pm', false)
ON CONFLICT (team_id) DO NOTHING;

-- 4. Demo user
INSERT INTO users (id, first_name, last_name, email, created_at, updated_at, is_platform_admin)
VALUES (1001, 'Demo', 'User', 'demo@ndx-demo.example.com', now(), now(), true)
ON CONFLICT (email) DO NOTHING;

-- 5. Team membership
INSERT INTO team_members (team_id, user_id, role)
VALUES (26, 1001, 'teamEditor')
ON CONFLICT DO NOTHING;

-- 6. Team integrations
-- Editor's GIS settings page reads `team.integrations.has_planning_data`. If
-- no row exists, team.integrations is null and the page crashes with
-- "Cannot read properties of undefined (reading 'hasPlanningData')".
INSERT INTO team_integrations (team_id, has_planning_data)
VALUES (26, false)
ON CONFLICT (team_id) DO NOTHING;

-- 7. Sample multi-step flow so the demo isn't a blank canvas.
-- Component types come from upstream's planx-core ComponentType enum:
--   Notice=8, Question=100, Answer=200, Content=250, TextInput=110,
--   Confirmation=725. A Question node lists its Answer children in `edges`;
--   each Answer can chain its own follow-up via `edges` (Content here).
-- Node ids are 10-char strings; ShareDB doesn't care about format, only
-- that they're unique within the flow.
INSERT INTO flows (id, team_id, slug, name, data, status, created_at, updated_at, creator_id, version)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 26,
  'apply-for-householder-planning-permission',
  'Apply for householder planning permission',
  $${
    "_root": {"edges": ["intro_001","question_1","describe_1","confirm_01"]},
    "intro_001": {
      "type": 8,
      "data": {
        "title": "Apply for householder planning permission",
        "description": "<p>This sample service walks through the kind of questions a council might ask before you submit a planning application. NDX:Try lets you customise it freely.</p>",
        "color": "#EFEFEF",
        "resetButton": false
      }
    },
    "question_1": {
      "type": 100,
      "data": {
        "text": "What type of work are you proposing?",
        "description": "<p>Pick the option that best matches your project. The questions afterwards adjust based on your answer.</p>",
        "neverAutoAnswer": false,
        "alwaysAutoAnswerBlank": false
      },
      "edges": ["ans_ext_001","ans_loft_01","ans_garden1"]
    },
    "ans_ext_001": {"type": 200, "data": {"text": "Single-storey rear extension"}, "edges": ["content_ext"]},
    "ans_loft_01": {"type": 200, "data": {"text": "Loft conversion"}, "edges": ["content_lft"]},
    "ans_garden1": {"type": 200, "data": {"text": "Garden room or outbuilding"}, "edges": ["content_grd"]},
    "content_ext": {
      "type": 250,
      "data": {"content": "<h2>Single-storey rear extension</h2><p>Most single-storey rear extensions on terraced or semi-detached homes can be built under <em>permitted development</em> rights without a full planning application, provided they meet size and design limits.</p><p>Check the latest limits on the <a href=\"https://www.gov.uk/guidance/permitted-development-rights\">Planning Portal</a> before you continue.</p>"}
    },
    "content_lft": {
      "type": 250,
      "data": {"content": "<h2>Loft conversion</h2><p>Loft conversions are usually permitted development, but rear dormer windows on the principal elevation of a terraced house are not. You may need full planning permission and Building Regulations approval.</p>"}
    },
    "content_grd": {
      "type": 250,
      "data": {"content": "<h2>Garden room or outbuilding</h2><p>Outbuildings under 2.5m high near a boundary, with a footprint less than half the garden, are usually permitted development. Designs over that, or with sleeping accommodation, need planning permission.</p>"}
    },
    "describe_1": {
      "type": 110,
      "data": {
        "title": "Describe your proposed works",
        "description": "<p>Tell us briefly what you want to build, in your own words.</p>",
        "type": "long",
        "fn": "proposal.description",
        "isRequired": true
      }
    },
    "confirm_01": {
      "type": 725,
      "data": {
        "heading": "Application submitted",
        "color": "#EFEFEF",
        "moreInfo": "<p><strong>What happens next?</strong></p><p>A planning officer will review your application within 8 weeks. You will be contacted if they need more information.</p>",
        "contactInfo": "<p>Need to chase? Email <a href=\"mailto:planning@ndx-demo.example.com\">planning@ndx-demo.example.com</a>.</p>"
      }
    }
  }$$::jsonb,
  'online', now(), now(), 1001, 1
) ON CONFLICT (id) DO UPDATE SET
  -- Existing leases that came up with an older revision of this seed
  -- (e.g. the legacy two-flow shape) keep the same UUID but need their
  -- slug, name, data, AND version refreshed when the Hasura image is
  -- rebuilt. flows.version must be non-null or sharedb-postgresql's
  -- getSnapshot falls into its "no document" branch, the editor's
  -- subscribeToDoc calls doc.create({nodes:{}, edges:[]}) and the seeded
  -- data is silently replaced with an empty doc on first open.
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  data = EXCLUDED.data,
  status = EXCLUDED.status,
  version = EXCLUDED.version,
  updated_at = now();

-- Drop any other team-26 flows that pre-date this seed revision (the old
-- two-flow seed inserted a second UUID that's no longer referenced).
DELETE FROM operations WHERE flow_id IN (
  SELECT id FROM flows WHERE team_id = 26 AND id <> 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);
DELETE FROM published_flows WHERE flow_id IN (
  SELECT id FROM flows WHERE team_id = 26 AND id <> 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);
DELETE FROM flows WHERE team_id = 26 AND id <> 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ShareDB requires at least one matching `operations` row per flow; the
-- editor's flow list also reads operations[0].createdAt for "last edited"
-- (a missing op makes the team page crash with "RangeError: Invalid time
-- value"). One op at version 1 with the snapshot data is the minimum.
INSERT INTO operations (flow_id, actor_id, version, data, created_at, updated_at)
SELECT id, 1001, 1, '{}'::jsonb, now(), now() FROM flows WHERE team_id = 26
ON CONFLICT DO NOTHING;

-- 8. Pre-publish the demo flow so the public viewer at
-- /<team>/<flow>/published renders without the user having to click Publish
-- in the editor first. The published_flows row stores a frozen snapshot of
-- flow.data at the moment of publish; we copy the same data here.
INSERT INTO published_flows (
  flow_id, publisher_id, summary, data,
  has_send_component, has_pay_component, has_sections, service_charge_enabled,
  created_at
)
SELECT id, 1001, 'Initial publish', data,
       false, false, false, false, now()
FROM flows WHERE team_id = 26
ON CONFLICT DO NOTHING;
