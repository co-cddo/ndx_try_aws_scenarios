# Patch the tenant middleware to support single-tenant deployment.
# When no subdomain matches a local authority, fall back to DEFAULT_LOCAL_AUTHORITY.
# On CloudFront/ALB domains, subdomains parsing may return nil or unexpected values,
# so we always fall back to DEFAULT_LOCAL_AUTHORITY when set.
Rails.application.config.after_initialize do
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
end
