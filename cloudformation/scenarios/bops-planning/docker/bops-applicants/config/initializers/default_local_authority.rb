# Patches for single-tenant BOPS-Applicants deployment (no subdomains).
#
# 1. ApplicationController#current_local_authority returns subdomain — override to DEFAULT_LOCAL_AUTHORITY
# 2. HttpClient#api_base prepends subdomain to API host — override to use API_HOST directly

Rails.application.config.after_initialize do
  if ENV["DEFAULT_LOCAL_AUTHORITY"]
    # Patch current_local_authority to return DEFAULT_LOCAL_AUTHORITY instead of subdomain
    ApplicationController.class_eval do
      def current_local_authority
        ENV["DEFAULT_LOCAL_AUTHORITY"]
      end
    end

    # Patch HttpClient to NOT prepend subdomain to API host
    # Original: "#{Current.local_authority}.#{Rails.configuration.api_host}/api/v1"
    # Patched:  "#{Rails.configuration.api_host}/api/v1"
    HttpClient.class_eval do
      private

      def api_base
        "#{Rails.configuration.api_host}/api/v1"
      end
    end
  end
end
