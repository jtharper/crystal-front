#!/usr/bin/env bash
# Crystal Front - install a newer version of the game on the Pi.
# Unzip the new kit, then from inside it run:   sudo ./update.sh
# The web server keeps running; players get the new version on their next page load.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WEBROOT=/var/www/crystal-front
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo:  sudo ./update.sh" >&2; exit 1; }
[ -f "$HERE/site/index.html" ] || { echo "site/ folder not found next to update.sh" >&2; exit 1; }
[ -d "$WEBROOT" ] || { echo "$WEBROOT does not exist yet - run setup.sh first" >&2; exit 1; }
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p /var/backups/crystal-front
tar -czf "/var/backups/crystal-front/site-$STAMP.tgz" -C "$WEBROOT" .
ls -1t /var/backups/crystal-front/site-*.tgz | tail -n +6 | xargs -r rm -f      # keep the last 5 backups
rsync -a --delete "$HERE/site/" "$WEBROOT/"
find "$WEBROOT" -type d -exec chmod 755 {} +
find "$WEBROOT" -type f -exec chmod 644 {} +
echo "Updated. Previous version saved as /var/backups/crystal-front/site-$STAMP.tgz"
echo "To roll back:  sudo rm -rf $WEBROOT/* && sudo tar -xzf /var/backups/crystal-front/site-$STAMP.tgz -C $WEBROOT"
