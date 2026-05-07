#!/bin/sh
set -e

# Default to local backend if not specified
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"

echo "Starting frontend with BACKEND_URL=${BACKEND_URL}"

# Substitute env vars in nginx template
envsubst '${BACKEND_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
