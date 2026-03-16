# BOPS (Back Office Planning System) Docker image for NDX:Try
# Built from the upstream BOPS Dockerfile.production with overlay files
#
# This Dockerfile is NOT used directly — the GitHub Actions workflow:
# 1. Clones the BOPS repo at a pinned commit
# 2. Copies our overlay files into the clone
# 3. Builds using the upstream Dockerfile.production
#
# This file exists as documentation and for local development reference.
# See .github/workflows/docker-build-bops.yml for the actual build process.

# To build locally:
#   ./build.sh
# Or manually:
#   git clone --depth 1 https://github.com/unboxed/bops.git bops-src
#   cp config/initializers/default_local_authority.rb bops-src/config/initializers/
#   cp scripts/seed_sample_data.rb bops-src/scripts/
#   cp scripts/seed-entrypoint.sh bops-src/scripts/
#   cp entrypoint.sh bops-src/
#   docker build -f bops-src/Dockerfile.production -t bops:latest bops-src/
