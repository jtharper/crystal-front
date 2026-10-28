#!/usr/bin/env bash
# Crystal Front - keep an IONOS-managed name pointed at this Pi's home internet address (IONOS Dynamic DNS).
#
#   sudo ./ddns-ionos.sh <prefix.secret> play.example.com [more.names ...]
#
# <prefix.secret> is an IONOS API key from https://developer.hosting.ionos.com/keys (the two parts joined with a dot).
# The script asks IONOS for an update URL covering the names you list, stores only that URL (root-only file),
# calls it now, and then every 10 minutes. IONOS sets the names' A records to whatever public IP the call comes from.
# Only the names you list are touched - your main domain and anything hosted at IONOS stay as they are.
# Note: IONOS keeps one Dynamic DNS configuration per account; running this again replaces the previous one,
# so list every name you want kept up to date in the same command.
set -euo pipefail
die() { printf '\033[1;31m[x] %s\033[0m\n' "$*" >&2; exit 1; }
[ "$(id -u)" -eq 0 ] || die "Run with sudo:  sudo ./ddns-ionos.sh <prefix.secret> play.example.com"
[ $# -ge 2 ] || die "Usage:  sudo ./ddns-ionos.sh <prefix.secret> play.example.com [more.names ...]"
KEY="$1"; shift
case "$KEY" in *.*) ;; *) die "The API key must be prefix.secret (both parts joined with a dot)" ;; esac
command -v curl >/dev/null || apt-get install -y -q curl
command -v python3 >/dev/null || apt-get install -y -q python3

NAMES_JSON="$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1:]))' "$@")"
echo "Asking IONOS for a Dynamic DNS update URL for: $*"
RESP="$(curl -sS -X POST 'https://api.hosting.ionos.com/dns/v1/dyndns' \
  -H 'accept: application/json' -H 'Content-Type: application/json' -H "X-API-Key: $KEY" \
  -d "{\"domains\": $NAMES_JSON, \"description\": \"Crystal Front Raspberry Pi\"}")" || die "Could not reach IONOS"
URL="$(printf '%s' "$RESP" | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("updateUrl",""))
except Exception: print("")')"
[ -n "$URL" ] || die "IONOS did not return an update URL. Its answer was: $RESP"

install -d -m 700 /etc/crystal-front
umask 077; printf '%s\n' "$URL" > /etc/crystal-front/ionos-ddns-url
cat > /usr/local/bin/crystal-front-ddns <<'EOF'
#!/bin/sh
# called every 10 minutes by crystal-front-ddns.timer; IONOS only changes DNS when the IP has changed
curl -fsS --max-time 30 "$(cat /etc/crystal-front/ionos-ddns-url)" >/dev/null
EOF
chmod 755 /usr/local/bin/crystal-front-ddns
cat > /etc/systemd/system/crystal-front-ddns.service <<'EOF'
[Unit]
Description=Update IONOS Dynamic DNS for Crystal Front
After=network-online.target
Wants=network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/bin/crystal-front-ddns
EOF
cat > /etc/systemd/system/crystal-front-ddns.timer <<'EOF'
[Unit]
Description=Update IONOS Dynamic DNS for Crystal Front every 10 minutes
[Timer]
OnBootSec=1min
OnUnitActiveSec=10min
[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now crystal-front-ddns.timer >/dev/null
/usr/local/bin/crystal-front-ddns && echo "Sent this Pi's public IP ($(curl -s --max-time 10 https://api.ipify.org || echo unknown)) to IONOS."
echo "Done. The names will follow your home IP automatically (checked every 10 minutes)."
echo "Check it with:  systemctl list-timers crystal-front-ddns.timer   and   getent hosts $1"
