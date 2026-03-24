# PlanX Hasura image with migrations, metadata, seed data,
# and a boot script that waits for DB + pre-creates PostgreSQL extensions.
FROM hasura/graphql-engine:v2.48.1.cli-migrations-v3

# Install PostgreSQL client for DB wait + extension creation
USER root
RUN apt-get update -qq && apt-get install -y -qq postgresql-client dnsutils > /dev/null 2>&1 && rm -rf /var/lib/apt/lists/*

# Copy PlanX Hasura migrations and metadata
COPY migrations/ /hasura-migrations/
COPY metadata/ /hasura-metadata/

# Copy seed data (applied by entrypoint-wrapper.sh after migrations)
COPY seed/ /seed/

# Custom entrypoint that waits for DB and creates extensions before Hasura starts
COPY entrypoint-wrapper.sh /entrypoint-wrapper.sh
RUN chmod +x /entrypoint-wrapper.sh

ENTRYPOINT ["/entrypoint-wrapper.sh"]
