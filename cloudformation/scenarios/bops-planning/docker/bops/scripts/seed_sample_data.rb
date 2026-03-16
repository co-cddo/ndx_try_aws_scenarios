# NDX:Try BOPS Sample Data Generator
# Creates 80 realistic planning applications for the NDX Demo Borough
#
# This script runs after db:seed (which creates application types, statuses, etc.)
# It uses AASM state machine transitions where possible to ensure consistent state.
#
# Usage: bundle exec rails runner scripts/seed_sample_data.rb

puts "=== NDX:Try Sample Data Seed ==="

# Idempotency guard
if LocalAuthority.exists?(subdomain: "ndx-demo")
  puts "NDX Demo Borough already exists — skipping seed."
  exit 0
end

ActiveRecord::Base.transaction do
  # --- Create Local Authority ---
  puts "Creating local authority..."
  local_authority = LocalAuthority.create!(
    name: "NDX Demo Borough Council",
    subdomain: "ndx-demo",
    council_code: "NDX",
    signatory_name: "Alex Morgan",
    signatory_job_title: "Head of Planning",
    enquiries_paragraph: "For enquiries about planning applications, please contact the planning department.",
    email_address: "planning@ndx-demo.example.com",
    feedback_email: "feedback@ndx-demo.example.com",
    press_notice_email: "press@ndx-demo.example.com",
    letter_template_id: "00000000-0000-0000-0000-000000000001",
    reviewer_group_email: "reviewers@ndx-demo.example.com",
    email_reply_to_id: "00000000-0000-0000-0000-000000000002",
    notify_api_key_for: nil
  )

  # --- Create Users ---
  puts "Creating users..."
  admin_password = ENV.fetch("ADMIN_PASSWORD", "BopsDemo2024!")

  administrator = User.create!(
    email: "ndx-demo_administrator@example.com",
    password: admin_password,
    password_confirmation: admin_password,
    name: "Demo Administrator",
    local_authority: local_authority,
    role: "administrator"
  )
  administrator.confirm if administrator.respond_to?(:confirm)

  assessor = User.create!(
    email: "ndx-demo_assessor@example.com",
    password: admin_password,
    password_confirmation: admin_password,
    name: "Demo Assessor",
    local_authority: local_authority,
    role: "assessor"
  )
  assessor.confirm if assessor.respond_to?(:confirm)

  reviewer = User.create!(
    email: "ndx-demo_reviewer@example.com",
    password: admin_password,
    password_confirmation: admin_password,
    name: "Demo Reviewer",
    local_authority: local_authority,
    role: "reviewer"
  )
  reviewer.confirm if reviewer.respond_to?(:confirm)

  # --- Create API User (for BOPS-Applicants Bearer token auth) ---
  puts "Creating API user..."
  api_bearer = ENV.fetch("API_BEARER", "ndx-demo-api-bearer-token-placeholder")
  if defined?(ApiUser)
    ApiUser.create!(
      name: "BOPS Applicants",
      token: api_bearer,
      local_authority: local_authority
    )
  end

  # --- Planning Constraints ---
  puts "Creating planning constraints..."
  constraints = []
  constraint_definitions = [
    { category: "conservation_area", description: "NDX Demo Conservation Area" },
    { category: "flood_zone_2", description: "Environment Agency Flood Zone 2" },
    { category: "flood_zone_3", description: "Environment Agency Flood Zone 3" },
    { category: "tree_preservation_order", description: "Tree Preservation Order (Area)" },
    { category: "listed_building", description: "Grade II Listed Building" },
    { category: "area_of_outstanding_natural_beauty", description: "Area of Outstanding Natural Beauty" },
    { category: "green_belt", description: "Metropolitan Green Belt" }
  ]

  constraint_definitions.each do |cd|
    if defined?(PlanningConstraint)
      constraint = PlanningConstraint.find_or_create_by!(
        category: cd[:category],
        local_authority: local_authority
      ) do |c|
        c.description = cd[:description]
      end
      constraints << constraint
    end
  end

  # --- Street address data ---
  streets = [
    "Oakwood Terrace", "Victoria Road", "Church Lane", "Mill Street",
    "Park Avenue", "High Street", "Station Road", "Elm Grove",
    "Cedar Close", "Willow Way", "Bridge Street", "Manor Drive"
  ]

  borough = "NDX Demo Borough"
  postcode_prefix = "ND"

  # Geographic cluster: fictional coordinates near central England
  base_lat = 51.5
  base_lng = -0.12

  # --- Application Type Definitions ---
  # These map to BOPS ApplicationType records created by db:seed
  application_types = {
    householder: {
      code: "householder",
      descriptions: [
        "Single storey rear extension measuring 4m in depth with flat roof and bi-fold doors",
        "Loft conversion with rear dormer window and 2 Velux rooflights to front elevation",
        "Front porch addition (2m x 1.5m) with pitched roof and new block-paved driveway",
        "Two storey side extension to create additional bedroom and en-suite bathroom",
        "Detached timber garden room (4m x 3m) for home office use",
        "Replacement of existing conservatory with single storey rear extension",
        "Installation of solar panels to south-facing roof elevation (16 panels)",
        "Demolition of existing garage and construction of car port with storage",
        "Raised rear patio area with retaining wall and steps to garden level",
        "New vehicular crossover and dropped kerb to create off-street parking"
      ],
      count: 25
    },
    prior_approval: {
      code: "prior_approval",
      descriptions: [
        "Change of use from office (Class E) to 4no. residential units (Class C3)",
        "Change of use from retail shop to mixed-use cafe and residential above",
        "Larger home extension: single storey rear extending 6m from original rear wall",
        "Installation of telecommunications mast (15m) with equipment cabinet",
        "Agricultural building conversion to 3no. dwelling houses"
      ],
      count: 12
    },
    lawful_development_certificate: {
      code: "lawful_development_certificate",
      descriptions: [
        "Certificate of lawfulness for proposed single storey rear extension (permitted development)",
        "Certificate of lawfulness for existing loft conversion completed in 2018",
        "Certificate of lawfulness for proposed outbuilding within curtilage",
        "Certificate of lawfulness for existing change of use from C3 to C4 (HMO)"
      ],
      count: 8
    },
    listed_building: {
      code: "listed",
      descriptions: [
        "Internal alterations to Grade II listed building including new kitchen and bathroom",
        "Replacement windows to Grade II listed property (like-for-like timber sash)",
        "Installation of secondary glazing to all windows of listed building",
        "Repairs to boundary wall including repointing with lime mortar"
      ],
      count: 8
    },
    full_planning: {
      code: "full",
      descriptions: [
        "Demolition of existing garage and erection of two-storey side extension with rooms in roof",
        "Erection of 2no. semi-detached dwellings on land adjacent to existing property",
        "Change of use from public house to 6no. residential apartments with parking",
        "Mixed use development: ground floor commercial (Class E) with 3no. flats above",
        "Erection of detached 3-bedroom dwelling on infill plot with associated landscaping"
      ],
      count: 15
    },
    discharge_of_conditions: {
      code: "discharge_of_conditions",
      descriptions: [
        "Discharge of condition 3 (materials) and condition 5 (landscaping scheme)",
        "Discharge of condition 2 (construction management plan)",
        "Discharge of conditions 4, 7 and 9 relating to drainage and ecology"
      ],
      count: 6
    },
    tree_works: {
      code: "tree",
      descriptions: [
        "Crown reduction by 3m to 1no. mature oak tree (T1) protected by TPO",
        "Felling of 1no. dead ash tree and replanting with native species",
        "Crown thin by 20% to 2no. lime trees in conservation area",
        "Removal of overhanging branches from 1no. sycamore tree adjacent to highway"
      ],
      count: 6
    }
  }

  # --- Status Distribution ---
  # ~12 new, ~24 in assessment, ~12 under review, ~24 decided (18 granted + 6 refused), ~8 withdrawn
  def target_status(index, total)
    pct = index.to_f / total
    case
    when pct < 0.15 then :new
    when pct < 0.45 then :in_assessment
    when pct < 0.60 then :under_review
    when pct < 0.83 then :decided_granted
    when pct < 0.90 then :decided_refused
    else :withdrawn
    end
  end

  # --- Generate Applications ---
  puts "Generating planning applications..."
  app_index = 0
  total_apps = application_types.values.sum { |t| t[:count] }

  application_types.each do |type_key, type_def|
    # Find the ApplicationType record
    app_type = if defined?(ApplicationType)
      ApplicationType.find_by(code: type_def[:code]) ||
      ApplicationType.find_by(name: type_def[:code])
    end

    type_def[:count].times do |i|
      street = streets[app_index % streets.length]
      house_num = (app_index * 3 + 1) % 120 + 1
      postcode = "#{postcode_prefix}#{(app_index % 9) + 1} #{(app_index % 26 + 65).chr}#{(app_index * 7 % 26 + 65).chr}"
      description = type_def[:descriptions][i % type_def[:descriptions].length]
      status = target_status(app_index, total_apps)

      # Slight geographic variation around base point
      lat = base_lat + (app_index % 12) * 0.002 - 0.012
      lng = base_lng + (app_index / 12) * 0.003 - 0.009

      begin
        # Create the planning application
        app_params = {
          local_authority: local_authority,
          description: description,
          address_1: "#{house_num} #{street}",
          town: borough,
          postcode: postcode,
          uprn: "1000#{app_index.to_s.rjust(5, '0')}",
          created_at: Time.current - rand(1..90).days
        }

        # Set application type if the model supports it
        app_params[:application_type] = app_type if app_type

        # Set coordinates if model supports it
        if PlanningApplication.column_names.include?("latitude")
          app_params[:latitude] = lat
          app_params[:longitude] = lng
        end

        planning_app = PlanningApplication.new(app_params)

        # Try to save — BOPS may have additional required fields
        planning_app.save!(validate: false) # Skip validations for seed data

        # Associate constraints (30% of applications)
        if constraints.any? && app_index % 3 == 0
          num_constraints = rand(1..3)
          selected = constraints.sample(num_constraints)
          selected.each do |constraint|
            if planning_app.respond_to?(:planning_application_constraints)
              planning_app.planning_application_constraints.find_or_create_by!(
                planning_constraint: constraint
              )
            end
          end
        end

        # Transition through states using AASM if available
        # Note: actual event names depend on the BOPS codebase — these are best-effort
        case status
        when :in_assessment
          planning_app.validate! if planning_app.respond_to?(:validate!)
          planning_app.start! if planning_app.respond_to?(:start!)
        when :under_review
          planning_app.validate! if planning_app.respond_to?(:validate!)
          planning_app.start! if planning_app.respond_to?(:start!)
          planning_app.assess! if planning_app.respond_to?(:assess!)
        when :decided_granted
          planning_app.validate! if planning_app.respond_to?(:validate!)
          planning_app.start! if planning_app.respond_to?(:start!)
          planning_app.assess! if planning_app.respond_to?(:assess!)
          planning_app.review! if planning_app.respond_to?(:review!)
          if planning_app.respond_to?(:determine!)
            planning_app.determine! rescue nil
          end
          # Fallback: set status directly if transitions fail
          if planning_app.respond_to?(:decision) && planning_app.decision.nil?
            planning_app.update_columns(status: "determined", decision: "granted") rescue nil
          end
        when :decided_refused
          planning_app.validate! if planning_app.respond_to?(:validate!)
          planning_app.start! if planning_app.respond_to?(:start!)
          planning_app.assess! if planning_app.respond_to?(:assess!)
          planning_app.review! if planning_app.respond_to?(:review!)
          if planning_app.respond_to?(:determine!)
            planning_app.determine! rescue nil
          end
          if planning_app.respond_to?(:decision)
            planning_app.update_columns(status: "determined", decision: "refused") rescue nil
          end
        when :withdrawn
          planning_app.validate! if planning_app.respond_to?(:validate!)
          planning_app.start! if planning_app.respond_to?(:start!)
          planning_app.withdraw! if planning_app.respond_to?(:withdraw!)
          # Fallback
          planning_app.update_columns(status: "withdrawn") rescue nil if planning_app.status != "withdrawn"
        end

        app_index += 1
        print "." if app_index % 10 == 0

      rescue => e
        puts "\nWarning: Failed to create application #{app_index}: #{e.message}"
        # Use update_columns fallback for problematic records
        if planning_app&.persisted?
          target = case status
                   when :in_assessment then "in_assessment"
                   when :under_review then "under_review"
                   when :decided_granted then "determined"
                   when :decided_refused then "determined"
                   when :withdrawn then "withdrawn"
                   else "not_started"
                   end
          planning_app.update_columns(status: target) rescue nil
        end
        app_index += 1
      end
    end
  end

  puts "\n"
  puts "Created #{PlanningApplication.where(local_authority: local_authority).count} planning applications"
  puts "=== Sample Data Seed Complete ==="
end
