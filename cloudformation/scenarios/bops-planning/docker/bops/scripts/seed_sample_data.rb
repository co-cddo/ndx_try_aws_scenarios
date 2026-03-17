# NDX:Try BOPS Comprehensive Seed Script
# Creates LocalAuthority, users, application types from fixtures,
# and 35 planning applications with proper case_records.
#
# Run with ActionMailer disabled:
#   bundle exec rails runner 'ActionMailer::Base.delivery_method = :test; load "scripts/seed_sample_data.rb"'
#
# All dates are relative to Time.current so data looks realistic whenever deployed.

puts "=== NDX:Try BOPS Seed ==="

la = LocalAuthority.find_by(subdomain: "ndx-demo")
unless la
  puts "ERROR: ndx-demo LocalAuthority not found — run db:seed first"
  exit 1
end

# 1. Activate council
la.update_column(:active, true)
puts "Council active: #{la.reload.active}"

# 2. Fix ApplicationType::Config categories (needed for filters)
ApplicationType::Config.all.each do |c|
  cat = case c.code
  when /^ldc/ then "lawfulness_certificate"
  when /^pa/ then "prior_approval"
  when /^pp/ then "planning_permission"
  when /^preApp/ then "pre_application"
  else "other"
  end
  c.update_column(:category, cat) if c.category.blank? || c.category != cat
end

# 3. Create ApplicationTypes from fixtures if missing
if ApplicationType.where(local_authority: la).count == 0
  puts "Creating application types from fixtures..."
  fixture = YAML.load_file(File.expand_path("db/seeds/application_types.yml", Rails.root))
  fixture.each do |attrs|
    config = ApplicationType::Config.find_or_initialize_by(code: attrs["code"])
    config.name = attrs["name"]
    config.suffix = attrs["suffix"]
    config.category = case attrs["code"]
      when /^ldc/ then "lawfulness_certificate"
      when /^pa/ then "prior_approval"
      when /^pp/ then "planning_permission"
      when /^preApp/ then "pre_application"
      else "other"
    end
    config.configured = true
    config.determination_period_days = attrs["determination_period_days"]
    config.features = attrs["features"] || {}
    config.steps = attrs["steps"]
    config.decisions = attrs["decisions"]
    config.assessment_details = attrs["assessment_details"]
    config.consistency_checklist = attrs["consistency_checklist"]
    config.disclaimer = attrs["disclaimer"]
    config.save(validate: false)

    app_type = ApplicationType.find_or_initialize_by(local_authority: la, config: config)
    app_type.name = attrs["name"]
    app_type.code = attrs["code"]
    app_type.suffix = attrs["suffix"]
    app_type.determination_period_days = attrs["determination_period_days"] || 56
    app_type.save(validate: false)
    puts "  #{app_type.name} (#{app_type.code})"
  end
end

# 4. Create users if missing
assessor = User.find_by(email: "ndx-demo_assessor@example.com", local_authority: la)
admin = User.find_by(email: "ndx-demo_administrator@example.com", local_authority: la)

unless assessor
  puts "Creating users..."
  admin_password = ENV.fetch("ADMIN_PASSWORD", "BopsDemo2024!")
  [
    { email: "ndx-demo_administrator@example.com", role: "administrator" },
    { email: "ndx-demo_assessor@example.com", role: "assessor" },
    { email: "ndx-demo_reviewer@example.com", role: "reviewer" }
  ].each do |attrs|
    user = User.new(
      email: attrs[:email], password: admin_password,
      password_confirmation: admin_password,
      local_authority: la, role: attrs[:role]
    )
    user.confirmed_at = Time.current
    user.otp_required_for_login = false
    user.mobile_number = "07000000000" if user.respond_to?(:mobile_number=)
    user.skip_confirmation! if user.respond_to?(:skip_confirmation!)
    user.save!(validate: false)
    puts "  #{attrs[:role]}: #{attrs[:email]}"
  end
  assessor = User.find_by(email: "ndx-demo_assessor@example.com", local_authority: la)
  admin = User.find_by(email: "ndx-demo_administrator@example.com", local_authority: la)
end

# 5. Create planning applications
if PlanningApplication.where(local_authority: la).count > 0
  puts "Already have #{PlanningApplication.where(local_authority: la).count} applications — skipping"
  exit 0
end

householder = ApplicationType.find_by(local_authority: la, code: "pp.full.householder")
prior = ApplicationType.find_by(local_authority: la, code: "pa.part1.classA")
ldc = ApplicationType.find_by(local_authority: la, code: "ldc.existing")

streets = ["Oakwood Terrace","Victoria Road","Church Lane","Mill Street","Park Avenue",
           "High Street","Station Road","Elm Grove","Cedar Close","Willow Way"]
descs = {
  householder => [
    "Single storey rear extension measuring 4m in depth with flat roof and bi-fold doors",
    "Loft conversion with rear dormer window and 2 Velux rooflights to front elevation",
    "Two storey side extension to create additional bedroom and en-suite bathroom",
    "Detached timber garden room (4m x 3m) for home office use",
    "Installation of solar panels to south-facing roof elevation (16 panels)",
    "New vehicular crossover and dropped kerb to create off-street parking",
    "Replacement conservatory with single storey rear extension",
    "Front porch addition (2m x 1.5m) with pitched roof",
  ],
  prior => [
    "Change of use from office (Class E) to 4no. residential units (Class C3)",
    "Larger home extension: single storey rear extending 6m from original rear wall",
    "Agricultural building conversion to 3no. dwelling houses",
  ],
  ldc => [
    "Certificate of lawfulness for proposed single storey rear extension (permitted development)",
    "Certificate of lawfulness for existing loft conversion completed in 2018",
  ],
}
first_names = ["James","Sarah","Michael","Emma","David","Lucy","Robert","Anna","Thomas","Helen"]
last_names = ["Smith","Jones","Williams","Brown","Taylor","Davies","Wilson","Evans","Thomas","Roberts"]

types = [[householder, 20], [prior, 10], [ldc, 5]].select { |t, _| t }
created = 0
errors = 0

puts "Creating planning applications..."
types.each do |app_type, count|
  type_descs = descs[app_type] || ["Development proposal"]
  count.times do |i|
    idx = created
    begin
      pa = PlanningApplication.new(
        local_authority: la,
        application_type: app_type,
        applicant_email: "applicant#{idx}@example.com",
        applicant_first_name: first_names[idx % first_names.length],
        applicant_last_name: last_names[idx % last_names.length],
        address_1: "#{(idx * 3 + 1) % 120 + 1} #{streets[idx % streets.length]}",
        town: "NDX Demo Borough",
        postcode: "SW1A 1AA",
        description: type_descs[i % type_descs.length],
      )
      pa.build_case_record(local_authority: la)
      pa.save!
      pa.mark_accepted! if pa.may_mark_accepted?

      # Assign 50% to the assessor
      if idx % 2 == 0 && pa.case_record
        pa.case_record.update_column(:user_id, assessor.id)
      end

      # Progress ~66% to in_assessment
      if idx % 3 != 0
        pa.update_columns(validated_at: Time.current - rand(5..30).days)
        pa.start! if pa.may_start?
      end

      created += 1
    rescue => e
      errors += 1
      puts "  ERR #{idx}: #{e.message[0..80]}" if errors <= 5
    end
  end
end

# 6. Backdate for realistic "days to determination" display
PlanningApplication.where(local_authority: la).each_with_index do |pa, idx|
  days_ago = case pa.status
  when "not_started" then rand(1..7)
  when "in_assessment" then rand(7..35)
  else rand(1..14)
  end

  received = Time.current - days_ago.days
  validated = pa.validated_at ? received + rand(1..5).days : nil
  target = received + 56.days
  expiry = received + 56.days

  pa.update_columns(
    received_at: received,
    created_at: received - rand(0..2).days,
    validated_at: validated,
    target_date: target,
    expiry_date: expiry,
    started_at: validated ? validated + rand(0..3).days : pa.started_at,
    in_assessment_at: pa.status == "in_assessment" ? (validated || received) + rand(1..5).days : pa.in_assessment_at,
  )
end

# 7. Publish ~30% of in_assessment apps for the applicants portal
# Applicants portal only shows apps where published_at is set
geojson = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[[-0.128, 51.507], [-0.127, 51.507], [-0.127, 51.508], [-0.128, 51.508], [-0.128, 51.507]]]
  }
}.to_json

published = 0
PlanningApplication.where(local_authority: la, status: "in_assessment", published_at: nil).limit(10).each do |pa|
  pa.update_columns(published_at: Time.current - rand(1..7).days, boundary_geojson: geojson)
  consultation = pa.consultation || pa.create_consultation!
  consultation.update_columns(end_date: Time.current + 14.days, start_date: Time.current - 7.days) unless consultation.end_date
  published += 1
end
puts "Published #{published} apps for applicants portal"

puts "Created: #{created}, Errors: #{errors}"
puts "By status: #{PlanningApplication.where(local_authority: la).group(:status).count}"
assigned = PlanningApplication.where(local_authority: la).joins(:case_record).where(case_records: { user_id: assessor.id }).count
puts "Assigned to assessor: #{assigned}/#{created}"
puts "Published: #{PlanningApplication.where(local_authority: la).where.not(published_at: nil).count}"
puts "=== Seed Complete ==="
