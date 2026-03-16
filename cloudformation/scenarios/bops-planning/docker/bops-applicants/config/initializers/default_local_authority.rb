# Two patches for single-tenant BOPS-Applicants deployment:
# 1. Tenant fallback when subdomain lookup returns nil
# 2. HttpClient URL construction without subdomain prefix

Rails.application.config.after_initialize do
  # Patch tenant resolution to fall back to DEFAULT_LOCAL_AUTHORITY
  if defined?(BopsApplicants::Middleware::LocalAuthority)
    BopsApplicants::Middleware::LocalAuthority.class_eval do
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

  # Patch HttpClient to skip subdomain prefix in single-tenant mode.
  # Without this, BOPS-Applicants tries to resolve ndx-demo.{ALB-DNS} which fails.
  if defined?(HttpClient) && ENV["DEFAULT_LOCAL_AUTHORITY"]
    HttpClient.class_eval do
      private

      def base_url
        "#{Rails.application.config.api_protocol}://#{Rails.application.config.api_host}/api/v1/"
      end
    end
  end
end
