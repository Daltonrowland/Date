#!/bin/sh
# Replace port placeholder with Railway's $PORT (default 80)
sed -i "s/PORT_PLACEHOLDER/${PORT:-80}/g" /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
