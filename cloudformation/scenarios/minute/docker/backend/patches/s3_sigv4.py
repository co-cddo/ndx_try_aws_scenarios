"""Patch: Force S3 signature v4 for presigned URLs in us-east-1."""
# This is applied via sed in the Dockerfile to patch common/services/storage_services/s3.py
# Adds: config=Config(signature_version="s3v4") to the S3 client creation
