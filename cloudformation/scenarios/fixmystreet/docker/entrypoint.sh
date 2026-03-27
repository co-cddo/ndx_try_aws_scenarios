#!/bin/bash
set -euo pipefail

FMS_ROOT="${FMS_ROOT:-/var/www/fixmystreet/fixmystreet}"

echo "=== FixMyStreet NDX:Try Entrypoint ==="
echo "Generating configuration from environment variables..."

# Generate general.yml from environment variables
cat > "$FMS_ROOT/conf/general.yml" <<EOYAML
FMS_DB_HOST: '${DB_HOST:-localhost}'
FMS_DB_PORT: '${DB_PORT:-5432}'
FMS_DB_NAME: '${DB_NAME:-fixmystreet}'
FMS_DB_USER: '${DB_USER:-fixmystreet}'
FMS_DB_PASS: '${DB_PASSWORD:-}'
BASE_URL: '${BASE_URL:-http://fixmystreet.example}'
MAPIT_URL: 'https://mapit.mysociety.org/'
MAPIT_TYPES: ['DIS','LBO','MTD','UTA','CTY','COI','LGD']
MAP_TYPE: 'OSM'
GEOCODER: 'OSM'
ALLOWED_COBRANDS:
  - fixmystreet: '.*'
EMAIL_DOMAIN: 'example.org'
CONTACT_EMAIL: 'contact@example.org'
DO_NOT_REPLY_EMAIL: 'fms-DO-NOT-REPLY@example.org'
STAGING_SITE: 1
STAGING_FLAGS:
  skip_checks: 1
  skip_must_have_2fa: 1
  send_reports: 0
  hide_staging_banner: 0
MEMCACHED_HOST: '${FMS_MEMCACHE_HOST:-localhost}'
CACHE_TIMEOUT: 3600
ADMIN_BASE_URL: ''
LOGIN_REQUIRED: 0
ADMIN_BASE_URL: ''
using_frontend_proxy: 1
COBRAND_FEATURES:
  login_required:
    fixmystreet: 0
  never_confirm_reports:
    fixmystreet: 1
SECURE_PROXY_SSL_HEADER: 'X-Forwarded-Proto'
PHOTO_STORAGE_BACKEND: 'FileSystem'
PHOTO_STORAGE_OPTIONS:
  UPLOAD_DIR: '${FMS_ROOT}/upload_dir'
EOYAML

echo "Configuration written to $FMS_ROOT/conf/general.yml"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until PGPASSWORD="${DB_PASSWORD}" pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" 2>/dev/null; do
  echo "  PostgreSQL not ready, retrying in 3s..."
  sleep 3
done
echo "PostgreSQL is ready."

# Create PostGIS extension if not exists
echo "Ensuring PostGIS extension..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS pgcrypto;" 2>&1 || echo "Extensions may already exist"

# Run schema updates (idempotent — safe to re-run)
echo "Running database schema updates..."
cd "$FMS_ROOT"
su fms -c "bin/update-schema --commit" 2>&1 || echo "Schema update completed (may have warnings)"

# Ensure upload directory is writable before loading FMS app
# EFS access point maps access to UID 33 (www-data); fms user is in www-data group.
# chmod 775 needed because createAcl only runs on first mount.
chmod 0775 "$FMS_ROOT/upload_dir" 2>/dev/null || true
su fms -c "mkdir -p '$FMS_ROOT/upload_dir/.cache'" 2>/dev/null || true

# Create admin user if ADMIN_PASSWORD is set
# We create a superuser first (for full admin access), then also create a regular
# council admin user that bypasses the 2FA requirement superusers have.
if [ -n "${ADMIN_PASSWORD:-}" ]; then
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.org}"
  echo "Creating superuser: $ADMIN_EMAIL"
  su fms -c "bin/createsuperuser '$ADMIN_EMAIL' '$ADMIN_PASSWORD'" 2>&1 || echo "Superuser may already exist"

  # Create a council admin user using FMS Perl framework for proper password hashing
  COUNCIL_ADMIN_EMAIL="council-admin@example.org"
  echo "Creating council admin: $COUNCIL_ADMIN_EMAIL"
  cd "$FMS_ROOT"
  # Write the Perl script to a temp file — inject credentials directly (not via env)
  # because su fms -c does not preserve environment variables
  cat > /tmp/create-council-admin.pl <<PERLSCRIPT
use FixMyStreet::App;
my \$email = '$COUNCIL_ADMIN_EMAIL';
my \$password = '$ADMIN_PASSWORD';
my \$body = FixMyStreet::App->model("DB::Body")->find({name => "NDX Demo Council"});
die "No body found" unless \$body;
my \$user = FixMyStreet::App->model("DB::User")->find_or_new({email => \$email});
\$user->name("NDX Demo Admin");
\$user->from_body(\$body->id);
\$user->is_superuser(1);
if (\$user->in_storage) {
  \$user->update({password => \$password});
} else {
  \$user->insert;
  \$user->update({password => \$password});
}
for my \$perm (qw(moderate report_edit report_edit_category report_edit_priority
                  report_inspect report_instruct contribute_as_another_user
                  contribute_as_body user_edit user_manage_permissions
                  template_edit responsepriority_edit category_edit)) {
  \$user->user_body_permissions->find_or_create({body_id => \$body->id, permission_type => \$perm});
}
print "Council admin created with " . \$user->user_body_permissions->count . " permissions\\n";
PERLSCRIPT

  su fms -c "cd $FMS_ROOT && perl -I$FMS_ROOT/local/lib/perl5 -I$FMS_ROOT/commonlib/perllib -I$FMS_ROOT/perllib /tmp/create-council-admin.pl" 2>&1 || echo "Council admin creation may have failed"
  rm -f /tmp/create-council-admin.pl
fi

# Seed demo data using FMS Perl framework
SEED_MARKER="$FMS_ROOT/.ndx-seeded-v2"
if [ ! -f "$SEED_MARKER" ]; then
  echo "Seeding demo data..."
  cat > /tmp/seed-demo-data.pl <<'SEEDSCRIPT'
use DateTime;
use FixMyStreet::App;
use FixMyStreet::DB;
use mySociety::Locale;
mySociety::Locale::negotiate_language('en-gb,English,en_GB');

my $db = FixMyStreet::App->model("DB");

# Create demo body (council) if not exists
my $body = $db->resultset("Body")->find_or_create({
    name => "NDX Demo Council",
    send_method => "",
    can_be_devolved => 0,
    send_extended_statuses => 0,
    external_url => "",
    deleted => 0,
});
print "Body: " . $body->name . " (id=" . $body->id . ")\n";

# Link body to MapIt area (2514 = Camden, a London borough with good test coverage)
$body->body_areas->find_or_create({ area_id => 2514 });
print "Body linked to MapIt area 2514 (Camden)\n";

# Create categories
my @categories = (
    { category => 'Potholes', email => 'highways@example.org' },
    { category => 'Street Lighting', email => 'lighting@example.org' },
    { category => 'Graffiti', email => 'graffiti@example.org' },
    { category => 'Fly-tipping', email => 'waste@example.org' },
    { category => 'Broken Paving', email => 'pavements@example.org' },
);

for my $cat (@categories) {
    $body->contacts->find_or_create({
        category => $cat->{category},
        email => $cat->{email},
        state => 'confirmed',
        editor => 'NDX Setup',
        whenedited => DateTime->now,
        note => 'Demo category',
    });
}
print "Categories created: " . join(", ", map { $_->{category} } @categories) . "\n";

# Create citizen users for demo reports
my @citizen_names = (
    'Jane Smith', 'David Wilson', 'Sarah Ahmed', 'Michael O\'Brien', 'Emma Thompson',
    'James Patel', 'Lucy Chen', 'Robert Singh', 'Hannah Davies', 'Thomas Brown',
    'Olivia Taylor', 'William Jones', 'Sophie Martin', 'Daniel Garcia', 'Charlotte White',
);
my @citizens;
for my $i (0..$#citizen_names) {
    my $u = $db->resultset("User")->find_or_create({ email => "citizen" . ($i+1) . "\@example.org" });
    $u->update({ name => $citizen_names[$i] }) unless $u->name;
    push @citizens, $u;
}
print "Created " . scalar(@citizens) . " citizen users\n";

# Streets and locations around Camden, London (lat ~51.54, lon ~-0.14)
my @streets = (
    { name => 'Camden High Street', lat => 51.5392, lon => -0.1426 },
    { name => 'Kentish Town Road', lat => 51.5465, lon => -0.1427 },
    { name => 'Chalk Farm Road', lat => 51.5437, lon => -0.1533 },
    { name => 'Parkway', lat => 51.5376, lon => -0.1459 },
    { name => 'Haverstock Hill', lat => 51.5505, lon => -0.1640 },
    { name => 'Ferdinand Street', lat => 51.5365, lon => -0.1300 },
    { name => 'Royal College Street', lat => 51.5410, lon => -0.1340 },
    { name => 'Delancey Street', lat => 51.5380, lon => -0.1410 },
    { name => 'Arlington Road', lat => 51.5370, lon => -0.1440 },
    { name => 'Inverness Street', lat => 51.5395, lon => -0.1435 },
    { name => 'Regent\'s Park Road', lat => 51.5420, lon => -0.1560 },
    { name => 'Gloucester Avenue', lat => 51.5440, lon => -0.1530 },
    { name => 'Prince of Wales Road', lat => 51.5460, lon => -0.1460 },
    { name => 'Malden Road', lat => 51.5480, lon => -0.1490 },
    { name => 'Fleet Road', lat => 51.5550, lon => -0.1600 },
    { name => 'Mansfield Road', lat => 51.5570, lon => -0.1580 },
    { name => 'South End Green', lat => 51.5560, lon => -0.1635 },
    { name => 'Highgate Road', lat => 51.5530, lon => -0.1450 },
    { name => 'Swain\'s Lane', lat => 51.5620, lon => -0.1490 },
    { name => 'Fortress Road', lat => 51.5520, lon => -0.1380 },
);

# Report templates per category
my %templates = (
    'Potholes' => [
        ['Deep pothole outside number %d', 'Large pothole approximately %dcm wide. Dangerous for cyclists and causing vehicles to swerve.'],
        ['Pothole getting worse near junction', 'Pothole has been growing over the past week. Now about %dcm across and %dcm deep. Filled with water when it rains.'],
        ['Series of potholes along road', 'Multiple potholes in the %s carriageway. At least %d visible. Road surface is deteriorating rapidly.'],
        ['Pothole causing damage to vehicles', 'Hit a deep pothole here last night. Damaged my front wheel. The hole is at least %dcm deep and hidden by puddles.'],
        ['Crumbling road surface', 'Road surface breaking up badly near the bus stop. Large chunks of tarmac missing, creating multiple hazards.'],
    ],
    'Street Lighting' => [
        ['Street light not working', 'Light column number %d has been out for over a week. The stretch of pavement is very dark and feels unsafe at night.'],
        ['Flickering street light', 'The street light keeps flickering on and off. Has been doing this for several days. Disorienting for drivers.'],
        ['Multiple lights out', '%d consecutive street lights are not working along this stretch. The whole area is in darkness after 5pm.'],
        ['Light stays on during daytime', 'Street light has been on constantly for the past %d days, day and night. Wasting electricity.'],
        ['Damaged light column', 'Light column is leaning at an angle after being hit by a vehicle. Still has wires attached. Looks dangerous.'],
    ],
    'Graffiti' => [
        ['Offensive graffiti on wall', 'Spray-painted graffiti with offensive language appeared overnight. Visible from the pavement and to children.'],
        ['Graffiti on shop shutters', 'Several shop shutters along the parade have been tagged with graffiti over the weekend. Business owners are upset.'],
        ['Graffiti on railway bridge', 'Large graffiti covering most of the bridge parapet. Appeared in the last few days.'],
        ['Tags on residential wall', 'Someone has spray-painted tags across the front garden wall of several houses. Very unsightly.'],
        ['Graffiti on bus shelter', 'Bus shelter glass panels have been covered in marker pen graffiti. Makes it hard to see approaching buses.'],
    ],
    'Fly-tipping' => [
        ['Dumped mattresses and furniture', 'Someone has dumped %d mattresses and a sofa in the alley. Blocking pedestrian access and attracting vermin.'],
        ['Bags of rubbish dumped on pavement', 'Around %d black bin bags of household waste dumped on the pavement. Been here for days and starting to smell.'],
        ['Construction waste dumped', 'Pile of rubble, broken plasterboard and timber dumped at the roadside. Looks like it came from a building site.'],
        ['Overflowing bins attracting rats', 'The public bins have been overflowing for days. Rubbish scattered by foxes and I\'ve seen rats in the area.'],
        ['Garden waste dumped in park', 'Large pile of garden cuttings and branches dumped by the park entrance. Blocking the path.'],
    ],
    'Broken Paving' => [
        ['Cracked paving slab trip hazard', 'Paving slab has cracked and one edge is raised by about %dcm. Trip hazard especially for elderly pedestrians.'],
        ['Missing paving slab', 'A paving slab is completely missing leaving a hole in the pavement. Someone could easily twist an ankle.'],
        ['Loose paving slabs rocking', 'Several paving slabs are loose and rock when stepped on. Water splashes up from underneath when it rains.'],
        ['Tree roots lifting pavement', 'Tree roots have pushed up the paving slabs creating an uneven surface. Wheelchair users have to go into the road.'],
        ['Broken kerb stone', 'Kerb stone has broken and crumbled away. The dropped kerb for wheelchair access is now unusable.'],
    ],
);

my @states = ('confirmed', 'confirmed', 'confirmed', 'investigating', 'investigating', 'fixed', 'fixed', 'closed');
my @cat_names = keys %templates;
my $now = DateTime->now;
my $created = 0;

# Check how many reports already exist
my $existing = $db->resultset("Problem")->count;
my $target = 260;
my $to_create = $target - $existing;
print "Existing reports: $existing, target: $target, creating: $to_create\n";

for my $i (1..$to_create) {
    last if $to_create <= 0;

    my $cat_name = $cat_names[int(rand(scalar @cat_names))];
    my $tmpls = $templates{$cat_name};
    my $tmpl = $tmpls->[int(rand(scalar @$tmpls))];
    my $street = $streets[int(rand(scalar @streets))];
    my $citizen = $citizens[int(rand(scalar @citizens))];
    my $state = $states[int(rand(scalar @states))];

    # Randomize location slightly around the street center
    my $lat = $street->{lat} + (rand() - 0.5) * 0.004;
    my $lon = $street->{lon} + (rand() - 0.5) * 0.004;

    # Random number for templates
    my $n = int(rand(200)) + 10;
    my $n2 = int(rand(10)) + 2;
    my $dir = (qw(northbound southbound eastbound westbound))[int(rand(4))];

    my $title = sprintf($tmpl->[0], $n, $n2, $dir);
    $title .= " on " . $street->{name} unless $title =~ /\Q$street->{name}/;
    my $detail = sprintf($tmpl->[1], $n, $n2, $dir);

    # Spread over 8 days with more reports in recent days
    my $hours_ago = int(rand(192)); # 8 days = 192 hours
    # Weight toward recent: square root distribution
    $hours_ago = int(192 * (rand() ** 0.5));
    my $created_at = $now->clone->subtract(hours => $hours_ago);

    eval {
        $db->resultset("Problem")->create({
            title => $title,
            detail => $detail,
            category => $cat_name,
            state => $state,
            latitude => $lat,
            longitude => $lon,
            used_map => 1,
            name => $citizen->name,
            user => $citizen,
            bodies_str => $body->id,
            areas => ',2514,',
            postcode => '',
            confirmed => $created_at,
            created => $created_at,
            lastupdate => $state eq 'confirmed' ? $created_at : $created_at->clone->add(hours => int(rand(48))),
            anonymous => (rand() > 0.7 ? 1 : 0),
            send_questionnaire => 0,
            cobrand => 'fixmystreet',
        });
        $created++;
    };
    warn "Report $i failed: $@" if $@;
}
print "Created $created demo reports (total now: " . $db->resultset("Problem")->count . ")\n";

# Seed updates/comments on reports — 150 total, distributed unevenly
# Some reports get multiple updates, many get none
my @update_templates = (
    # Citizen updates
    { text => 'This is still a problem. Nothing seems to have been done about it.', from => 'citizen' },
    { text => 'Getting worse every day. Please can someone look into this urgently?', from => 'citizen' },
    { text => 'I nearly had an accident here today. This needs fixing ASAP.', from => 'citizen' },
    { text => 'My neighbour also reported this last week. Still no action.', from => 'citizen' },
    { text => 'Thank you for fixing this so quickly! Much appreciated.', from => 'citizen' },
    { text => 'This has been partially fixed but the problem is still there.', from => 'citizen' },
    { text => 'Noticed this has got worse since the heavy rain last weekend.', from => 'citizen' },
    { text => 'I walk past here every day with my children. Please prioritise this.', from => 'citizen' },
    { text => 'The same issue has appeared again after being fixed last month.', from => 'citizen' },
    { text => 'Can confirm this is now fixed. Thank you to the council team.', from => 'citizen' },
    # Council staff updates
    { text => 'Thank you for your report. This has been logged and assigned to our highways team.', from => 'council' },
    { text => 'Our inspector has visited the site and confirmed the issue. Repair works have been scheduled.', from => 'council' },
    { text => 'This has been added to our next scheduled maintenance round.', from => 'council' },
    { text => 'Repair works completed. Please let us know if there are any further issues.', from => 'council' },
    { text => 'We have arranged for a contractor to attend within the next 5 working days.', from => 'council' },
    { text => 'This has been assessed as a priority repair and will be addressed within 48 hours.', from => 'council' },
    { text => 'Our team attended the site today. A temporary fix has been applied pending a permanent repair.', from => 'council' },
    { text => 'We apologise for the delay. This area is currently scheduled for resurfacing works next month.', from => 'council' },
);

# Get the council admin user for council responses
my $council_user = $db->resultset("User")->find({ email => 'council-admin@example.org' });

my $existing_comments = $db->resultset("Comment")->count;
my $target_comments = 150;
my $comments_to_create = $target_comments - $existing_comments;
print "Existing comments: $existing_comments, target: $target_comments, creating: $comments_to_create\n";

if ($comments_to_create > 0) {
    # Get all problems, pick a weighted subset to receive comments
    my @all_problems = $db->resultset("Problem")->all;
    my $comment_count = 0;

    # Create a distribution: ~40% of reports get comments, some get multiple
    # Use a power-law-ish distribution: pick reports with replacement, biased toward recent
    my @sorted = sort { $b->created->epoch <=> $a->created->epoch } @all_problems;

    while ($comment_count < $comments_to_create) {
        # Pick a report — weighted toward the first half (more recent)
        my $idx = int(scalar(@sorted) * (rand() ** 1.5));
        my $problem = $sorted[$idx];

        my $tmpl = $update_templates[int(rand(scalar @update_templates))];
        my $commenter = $tmpl->{from} eq 'council' ? $council_user : $citizens[int(rand(scalar @citizens))];
        next unless $commenter;

        # Comment time: between report creation and now
        my $report_age_hours = ($now->epoch - $problem->created->epoch) / 3600;
        next if $report_age_hours < 1;
        my $comment_hours_after = int(rand($report_age_hours));
        my $comment_time = $problem->created->clone->add(hours => $comment_hours_after);

        eval {
            $db->resultset("Comment")->create({
                problem => $problem,
                user => $commenter,
                text => $tmpl->{text},
                name => $commenter->name,
                state => 'confirmed',
                confirmed => $comment_time,
                created => $comment_time,
                mark_fixed => ($tmpl->{text} =~ /fixed|completed|repair works completed/i ? 1 : 0),
                anonymous => (rand() > 0.8 ? 1 : 0),
                cobrand => 'fixmystreet',
                problem_state => $problem->state,
            });
            $comment_count++;

            # Update the problem's lastupdate to reflect this comment
            if ($comment_time->epoch > $problem->lastupdate->epoch) {
                $problem->update({ lastupdate => $comment_time });
            }
        };
        warn "Comment failed: $@" if $@;
    }
    print "Created $comment_count comments on reports\n";
}

SEEDSCRIPT

  su fms -c "cd $FMS_ROOT && perl -I$FMS_ROOT/local/lib/perl5 -I$FMS_ROOT/commonlib/perllib -I$FMS_ROOT/perllib /tmp/seed-demo-data.pl" 2>&1 || echo "Seed script may have had errors"
  rm -f /tmp/seed-demo-data.pl

  # Generate all-reports.json required by /reports page
  echo "Generating all-reports data..."
  mkdir -p "$FMS_ROOT/../data"
  chown fms:fms "$FMS_ROOT/../data"
  su fms -c "cd $FMS_ROOT && bin/update-all-reports" 2>&1 || echo "update-all-reports may have had errors"

  touch "$SEED_MARKER"
  echo "Demo data seeded."
else
  echo "Demo data already seeded, skipping."
  # Always regenerate reports data (fast, idempotent)
  mkdir -p "$FMS_ROOT/../data"
  chown fms:fms "$FMS_ROOT/../data"
  su fms -c "cd $FMS_ROOT && bin/update-all-reports" 2>&1 || true
fi

echo "=== Starting FixMyStreet via supervisord ==="
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/fixmystreet.conf
