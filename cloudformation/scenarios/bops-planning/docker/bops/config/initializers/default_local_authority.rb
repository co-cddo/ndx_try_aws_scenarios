# Patch BOPS for single-tenant deployment without subdomains.
#
# BOPS uses subdomain-based tenant routing:
#   1. Middleware sets env["bops.local_authority"] from subdomain lookup
#   2. Route constraints (class methods) check request.subdomains.first == local_authority.subdomain
#
# On CloudFront/ALB domains there are no subdomains, so both fail.
# This initializer patches:
#   - The middleware: falls back to DEFAULT_LOCAL_AUTHORITY when no subdomain matches
#   - The route constraints: trust env["bops.local_authority"] when DEFAULT_LOCAL_AUTHORITY is set

Rails.application.config.after_initialize do
  # Patch middleware — set tenant from DEFAULT_LOCAL_AUTHORITY when no subdomain
  BopsCore::Middleware::LocalAuthority.class_eval do
    alias_method :original_call, :call
    def call(env)
      request = ActionDispatch::Request.new(env)
      subdomain = begin
        request.subdomains.first
      rescue
        nil
      end
      la = ::LocalAuthority.find_by(subdomain: subdomain) if subdomain.present?
      la ||= ::LocalAuthority.find_by(subdomain: ENV["DEFAULT_LOCAL_AUTHORITY"]) if ENV["DEFAULT_LOCAL_AUTHORITY"]
      env["bops.local_authority"] = la
      @app.call(env)
    end
  end

  # Patch route constraints (singleton/class methods) — trust middleware in single-tenant mode
  if ENV["DEFAULT_LOCAL_AUTHORITY"]
    # LocalAuthoritySubdomain.matches? — allow if middleware set a tenant
    BopsCore::Routing::LocalAuthoritySubdomain.define_singleton_method(:matches?) do |request|
      request.env["bops.local_authority"].present?
    end

    # DeviseSubdomain.matches? — allow if middleware set a tenant
    BopsCore::Routing::DeviseSubdomain.define_singleton_method(:matches?) do |request|
      BopsCore::Routing::ConfigSubdomain.matches?(request) ||
        request.env["bops.local_authority"].present?
    end

    # BopsDomain.matches? — always match in single-tenant mode
    BopsCore::Routing::BopsDomain.define_singleton_method(:matches?) do |request|
      true
    end

    # Reload routes so constraints are re-evaluated with patches
    Rails.application.reload_routes!
  end
end
