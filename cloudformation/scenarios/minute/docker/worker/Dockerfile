FROM python:3.12-slim AS builder

ENV RAY_ROTATION_MAX_BYTES=10485760
ENV RAY_ROTATION_BACKUP_COUNT=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y ffmpeg curl git && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir poetry

WORKDIR /app

# Clone upstream minute repo
RUN git clone --depth 1 https://github.com/i-dot-ai/minute.git /upstream

# Copy upstream source
RUN cp /upstream/pyproject.toml /upstream/poetry.lock /upstream/README.md ./

# Configure poetry and install dependencies
RUN poetry config virtualenvs.create false
RUN poetry install --with worker --without dev --no-interaction --no-ansi --no-root || true

# Copy upstream application code
RUN cp -r /upstream/common /upstream/worker ./
RUN mkdir -p backend && cp /upstream/backend/__init__.py backend/__init__.py

RUN poetry install --only-root || true

# === PATCHES (clean file replacements, no sed) ===

# Replace client.py with patched version (adds bedrock, optional google imports)
COPY patches/client.py common/llm/client.py

# Add Bedrock adapter
COPY patches/bedrock.py common/llm/adapters/bedrock.py

# Patch settings to make Azure/Google fields optional with defaults
RUN sed -i 's/AZURE_SPEECH_KEY: str = Field(description="Azure STT speech key for API")/AZURE_SPEECH_KEY: str = Field(description="Azure STT speech key for API", default="not-configured")/' common/settings.py && \
    sed -i 's/AZURE_SPEECH_REGION: str = Field(description="Region for Azure STT")/AZURE_SPEECH_REGION: str = Field(description="Region for Azure STT", default="not-configured")/' common/settings.py && \
    sed -i 's/AUTH_API_URL: str = Field(description="The hostname of the Auth API")/AUTH_API_URL: str = Field(description="The hostname of the Auth API", default="http:\/\/localhost")/' common/settings.py && \
    sed -i 's/APP_URL: str = Field(description="used for CORS origin validation")/APP_URL: str = Field(description="used for CORS origin validation", default="*")/' common/settings.py && \
    sed -i 's/REPO: str = Field(description="The name of the GitHub repository")/REPO: str = Field(description="The name of the GitHub repository", default="minute")/' common/settings.py

# Custom entrypoint with wait-for-db and no Google creds
RUN cat > /app/entrypoint.sh << 'ENTRY'
#!/bin/bash

echo "Waiting for database to be ready..."
for i in $(seq 1 90); do
  if python -c "
import psycopg2, os
psycopg2.connect(
  host=os.environ['POSTGRES_HOST'],
  port=os.environ['POSTGRES_PORT'],
  dbname=os.environ['POSTGRES_DB'],
  user=os.environ['POSTGRES_USER'],
  password=os.environ['POSTGRES_PASSWORD']
)" 2>/dev/null; then
    echo "Database is ready!"
    break
  fi
  echo "Attempt $i/90: Database not ready, waiting 10s..."
  sleep 10
done

echo "Starting queue service..."
exec poetry run python worker/main.py
ENTRY
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
