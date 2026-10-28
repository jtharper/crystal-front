#!/usr/bin/env bash
# Crystal Front - Raspberry Pi web server setup (Raspberry Pi OS / Debian).
#
#   sudo ./setup.sh local                 serve on http://<pi-address>/ for your home network (test this first)
#   sudo ./setup.sh play.example.com      public site with automatic HTTPS (needs DNS + router ports 80/443)
#   sudo ./setup.sh tunnel                serve on 127.0.0.1:8080 only, for a Cloudflare Tunnel
#
# Optional:  EMAIL=you@example.com   (certificate expiry notices)   WWW=1   (also answer www.<domain>, redirecting)
# Safe to run again: it re-copies the site and rewrites the web server config.
set -euo pipefail

MODE="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
WEBROOT=/var/www/crystal-front

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[!] %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m[x] %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run with sudo:  sudo ./setup.sh ${MODE:-local}"
[ -n "$MODE" ] || die "Say how to serve it:  sudo ./setup.sh local   |   sudo ./setup.sh your.domain.com   |   sudo ./setup.sh tunnel"
[ -f "$HERE/site/index.html" ] || die "site/ folder not found next to setup.sh - unzip the whole kit first"

case "$MODE" in
  local)  ADDR=":80"; OPEN_WEB=1 ;;
  tunnel) ADDR="http://127.0.0.1:8080"; OPEN_WEB=0 ;;
  *.*)    DOMAIN="${MODE#http*://}"; DOMAIN="${DOMAIN%%/*}"; ADDR="$DOMAIN"; OPEN_WEB=1 ;;
  *)      die "Unknown mode '$MODE' - use local, tunnel, or a domain name like play.example.com" ;;
esac

# ---------------------------------------------------------------- packages
say "Installing Caddy web server, firewall and automatic security updates"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q || warn "Some package sources could not be refreshed - carrying on with what is available"
CAND="$(apt-cache policy caddy 2>/dev/null | awk '/Candidate:/{print $2; exit}' || true)"
if [ -z "$CAND" ] || [ "$CAND" = "(none)" ]; then
  say "Caddy is not in this OS's repositories - adding Caddy's official repository"
  apt-get install -y -q debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q || warn "Some package sources could not be refreshed"
fi
apt-get install -y -q caddy ufw unattended-upgrades rsync

# ---------------------------------------------------------------- site files
say "Copying the game to $WEBROOT"
mkdir -p "$WEBROOT"
rsync -a --delete "$HERE/site/" "$WEBROOT/"
find "$WEBROOT" -type d -exec chmod 755 {} +
find "$WEBROOT" -type f -exec chmod 644 {} +

# ---------------------------------------------------------------- web server config
say "Writing /etc/caddy/Caddyfile"
[ -f /etc/caddy/Caddyfile ] && [ ! -f /etc/caddy/Caddyfile.orig ] && cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.orig
mkdir -p /var/log/caddy && chown caddy:caddy /var/log/caddy 2>/dev/null || true
{
  echo "# Crystal Front - written by setup.sh ($MODE)"
  if [ -n "${EMAIL:-}" ]; then printf '{\n\temail %s\n}\n\n' "$EMAIL"; fi
  cat <<EOF
$ADDR {
	root * $WEBROOT
	encode zstd gzip
	file_server {
		precompressed gzip
	}
	header {
		X-Content-Type-Options nosniff
		Referrer-Policy strict-origin-when-cross-origin
		X-Frame-Options SAMEORIGIN
		-Server
	}
	# models, textures and libraries rarely change: let browsers keep them for a day
	@assets path /models/* /tex/* /vendor/*
	header @assets Cache-Control "public, max-age=86400"
	# the page and game code always check for a newer version
	@code path / /index.html /js/* /css/*
	header @code Cache-Control "no-cache"
	log {
		output file /var/log/caddy/crystal-front.log {
			roll_size 10mb
			roll_keep 5
		}
	}
}
EOF
  if [ -n "${DOMAIN:-}" ] && [ "${WWW:-0}" = 1 ]; then
    printf '\nwww.%s {\n\tredir https://%s{uri} permanent\n}\n' "$DOMAIN" "$DOMAIN"
  fi
} > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null || die "Caddy rejected the config (see above)"
systemctl enable caddy >/dev/null 2>&1 || true
systemctl restart caddy

# ---------------------------------------------------------------- firewall
say "Configuring the firewall (SSH stays open)"
SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}' || true)"; SSH_PORT="${SSH_PORT:-22}"
ufw allow "$SSH_PORT"/tcp comment 'SSH' >/dev/null
if [ "$OPEN_WEB" = 1 ]; then
  ufw allow 80/tcp comment 'HTTP' >/dev/null
  ufw allow 443/tcp comment 'HTTPS' >/dev/null
fi
ufw --force enable >/dev/null
ufw status | sed 's/^/    /'

# ---------------------------------------------------------------- security updates
say "Turning on automatic security updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true

# ---------------------------------------------------------------- check + summary
sleep 2
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
if [ "$MODE" = tunnel ]; then URL="http://127.0.0.1:8080/"; else URL="http://127.0.0.1/"; fi
CODE="$(curl -s -o /dev/null -w '%{http_code}' "$URL" 2>/dev/null || true)"
[ "$MODE" != local ] && [ "$MODE" != tunnel ] && CODE="$(curl -sk -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" 2>/dev/null || true)"

say "Done"
echo "    Web server : $(systemctl is-active caddy)   (local check: HTTP ${CODE:-?})"
echo "    Game files : $WEBROOT"
echo "    Logs       : /var/log/caddy/crystal-front.log   and   journalctl -u caddy"
case "$MODE" in
  local)  echo; echo "    Open  http://$LAN_IP/  from any device on your home network." ;;
  tunnel) echo; echo "    Caddy is listening on 127.0.0.1:8080. Point your Cloudflare Tunnel's public hostname at  http://localhost:8080" ;;
  *)      echo
          echo "    Public address:  https://$DOMAIN/"
          echo "    For that to work:"
          echo "      1. DNS: an A record for $DOMAIN pointing at your home's public IP"
          echo "      2. Router: forward TCP ports 80 and 443 to this Pi ($LAN_IP)"
          echo "    Caddy fetches the HTTPS certificate by itself once both are in place."
          echo "    Watch it happen with:  journalctl -u caddy -f" ;;
esac
