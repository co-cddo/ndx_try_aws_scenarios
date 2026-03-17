# NDX:Try BOPS Sample Data Generator
# Creates a demo local authority and admin user for the NDX Demo Borough
#
# Usage: bundle exec rails runner scripts/seed_sample_data.rb
# NOTE: ActionMailer must be set to :test BEFORE loading this script
#       to avoid GOV.UK Notify auth errors from the dummy API key.

puts "=== NDX:Try Sample Data Seed ==="

# Idempotency guard
if LocalAuthority.exists?(subdomain: "ndx-demo")
  puts "NDX Demo Borough already exists — skipping seed."
  exit 0
end

ActiveRecord::Base.transaction do
  # --- Create Local Authority ---
  puts "Creating local authority..."
  local_authority = LocalAuthority.new(
    council_name: "NDX Demo Borough Council",
    short_name: "NDX Demo",
    subdomain: "ndx-demo",
    council_code: "BUC",
    signatory_name: "Alex Morgan",
    signatory_job_title: "Head of Planning",
    enquiries_paragraph: "For enquiries about planning applications, please contact the planning department.",
    email_address: "planning@ndx-demo.example.com",
    feedback_email: "feedback@ndx-demo.example.com",
    press_notice_email: "press@ndx-demo.example.com",
    reviewer_group_email: "reviewers@ndx-demo.example.com",
    email_reply_to_id: "00000000-0000-0000-0000-000000000002",
    applicants_url: ENV.fetch("APPLICANTS_DOMAIN", "http://localhost:8080"),
    submission_url: ENV.fetch("APPLICANTS_DOMAIN", "http://localhost:8080")
  )
  local_authority.save!(validate: false)
  puts "Created local authority: #{local_authority.council_name} (#{local_authority.subdomain})"

  # --- Create Users (skip validations + disable mailer to avoid Notify) ---
  puts "Creating users..."
  admin_password = ENV.fetch("ADMIN_PASSWORD", "BopsDemo2024!")

  [
    { email: "ndx-demo_administrator@example.com", role: "administrator" },
    { email: "ndx-demo_assessor@example.com", role: "assessor" },
    { email: "ndx-demo_reviewer@example.com", role: "reviewer" }
  ].each do |attrs|
    user = User.new(
      email: attrs[:email],
      password: admin_password,
      password_confirmation: admin_password,
      local_authority: local_authority,
      role: attrs[:role]
    )
    user.confirmed_at = Time.current
    user.otp_required_for_login = false
    user.mobile_number = "07000000000" if user.respond_to?(:mobile_number=)
    user.skip_confirmation! if user.respond_to?(:skip_confirmation!)
    user.save!(validate: false)
    puts "  Created #{attrs[:role]}: #{attrs[:email]}"
  end

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

  puts "=== Sample Data Seed Complete ==="
end
