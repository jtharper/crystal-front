# Crystal Front on a Raspberry Pi 5

This kit turns a Raspberry Pi (Raspberry Pi OS, 64-bit) into the game's web server.

- **Web server:** Caddy, which gets and renews the HTTPS certificate for your domain by itself.
- **Firewall:** opens only SSH and the web ports.
- **Updates:** Raspberry Pi OS installs its security updates automatically.

The game is a static website, so the Pi only sends files. The game itself runs in each player's browser, and one Pi can serve many players.

## 1. Copy the kit to the Pi

On your computer, in the folder holding `crystal-front-pi.zip`:

```
scp crystal-front-pi.zip <user>@<pi-address>:~
ssh <user>@<pi-address>
```

On the Pi:

```
unzip -o crystal-front-pi.zip
cd crystal-front-pi
```

## 2. Test it on your home network first

```
sudo ./setup.sh local
```

Open the address it prints, `http://<pi-address>/`, from a phone or laptop on the same Wi-Fi. Make sure the game loads and plays.

## 3. Go public on your domain (domain at IONOS)

Use a **subdomain** such as `play.yourdomain.com`. Your main domain, and anything IONOS hosts on it, stays exactly as it is.

**a. Let IONOS follow your home IP.** At https://developer.hosting.ionos.com/keys choose **Create New Key**. Copy both parts, the prefix and the secret. Then on the Pi:

```
sudo ./ddns-ionos.sh <prefix>.<secret> play.yourdomain.com
```

This creates the DNS record for `play.yourdomain.com` and points it at your home's public IP. It then rechecks every 10 minutes, so the address follows your ISP if your IP changes. Only the update link is stored on the Pi, not your API key.

**b. Router:** forward **TCP 80** and **TCP 443** to the Pi's home address (the one from step 2). Ask your router to always give the Pi that address; this is usually called a DHCP reservation.

**c. Turn on HTTPS:**

```
sudo EMAIL=you@example.com ./setup.sh play.yourdomain.com
```

Caddy gets a free Let's Encrypt certificate for `play.yourdomain.com` and renews it by itself. Your IONOS SSL certificate stays with your IONOS-hosted site and isn't needed here. Watch it happen with `journalctl -u caddy -f`, then open `https://play.yourdomain.com/`.

**If it can't get a certificate:** check that `getent hosts play.yourdomain.com` shows the same IP as https://ifconfig.me. Then check that ports 80 and 443 reach the Pi; test from a phone on mobile data, not your Wi-Fi.

**If port forwarding isn't possible:** some ISPs (CGNAT, mobile or satellite internet) block incoming connections. Use a Cloudflare Tunnel instead (`sudo ./setup.sh tunnel`). That needs your domain's DNS moved to Cloudflare, so ask first.

## Updating the game later

Copy the new `crystal-front-pi.zip` over, then on the Pi:

```
unzip -o crystal-front-pi.zip && cd crystal-front-pi && sudo ./update.sh
```

The previous version is saved first, and the last five versions are kept, so you can roll back. Players get the new version the next time they load the page.

## Handy commands

| What | Command |
|---|---|
| Is the server running? | `systemctl status caddy` |
| Live server log | `journalctl -u caddy -f` |
| Who is visiting | `sudo tail -f /var/log/caddy/crystal-front.log` |
| Restart the server | `sudo systemctl restart caddy` |
| Firewall rules | `sudo ufw status` |
| Server config | `/etc/caddy/Caddyfile` |
