FROM fixmystreet/fixmystreet:stable

# The official image uses a systemd-like init (boot-debian-base) which requires
# cgroup mounts that Fargate doesn't support. We override with our own entrypoint
# that starts services directly.

USER root

# Install postgresql-client for pg_isready and supervisord for process management
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      postgresql-client \
      supervisor \
      curl && \
    rm -rf /var/lib/apt/lists/*

# Add fms user to www-data group so it can write to EFS (owned by www-data via access point)
RUN usermod -a -G www-data fms

# Copy configuration files
COPY entrypoint.sh /entrypoint.sh
COPY supervisord.conf /etc/supervisor/conf.d/fixmystreet.conf
RUN chmod +x /entrypoint.sh

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:9000/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
