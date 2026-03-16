# Patch the tenant middleware to support single-tenant deployment.
# When no subdomain matches a local authority, fall back to DEFAULT_LOCAL_AUTHORITY.
Rails.application.config.after_initialize do
  BopsCore::Middleware::LocalAuthority.class_eval do
    alias_method :original_call, :call
    def call(env)
      request = ActionDispatch::Request.new(env)
      la = ::LocalAuthority.find_by(subdomain: request.subdomains.first)
      la ||= ::LocalAuthority.find_by(subdomain: ENV["DEFAULT_LOCAL_AUTHORITY"]) if ENV["DEFAULT_LOCAL_AUTHORITY"]
      env["bops.local_authority"] = la
      @app.call(env)
    end
  end
end
