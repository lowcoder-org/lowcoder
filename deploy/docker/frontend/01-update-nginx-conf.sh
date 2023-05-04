#!/bin/sh

set -e

sed -i "s@__LOWCODER_API_SERVICE_URL__@${LOWCODER_API_SERVICE_URL:=http://localhost:8080}@" /etc/nginx/nginx.conf
sed -i "s@__LOWCODER_NODE_SERVICE_URL__@${LOWCODER_NODE_SERVICE_URL:=http://localhost:6060}@" /etc/nginx/nginx.conf

echo "nginx config updated with:"
echo "    Lowcoder api service URL: ${LOWCODER_API_SERVICE_URL}"
echo "   Lowcoder node service URL: ${LOWCODER_NODE_SERVICE_URL}"
