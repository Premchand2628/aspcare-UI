#!/usr/bin/env bash
# ============================================================================
# One-time migration: move Car Wash backend services from nohup-background
# Java processes to systemd-managed services.
#
# Run ON THE SERVER:
#   sudo bash install-carwash-services.sh
#
# Prereqs:
#   - Unit files copied to /tmp/carwash-systemd/  (5 .service files)
#   - Jars already in place at /opt/carwash/jars/
#   - Config at /opt/carwash/config/env.properties
#   - Logback at /etc/carwash/logback-prod.xml
# ============================================================================

set -euo pipefail

SRC_DIR="${SRC_DIR:-/tmp/carwash-systemd}"
SYSTEMD_DIR="/etc/systemd/system"

SERVICES=(
  carwash-uigatewayservice
  carwash-otploginauth
  carwash-bookingservice
  carwash-membership
  carwash-carwashrates
)

log()  { echo -e "\e[36m[$(date +%T)]\e[0m $*"; }
warn() { echo -e "\e[33m[$(date +%T)] WARN:\e[0m $*" >&2; }
die()  { echo -e "\e[31m[$(date +%T)] ERROR:\e[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run with sudo."

# ---------- 1. Sanity checks ----------
log "Checking prerequisites..."
for svc in "${SERVICES[@]}"; do
  [[ -f "$SRC_DIR/$svc.service" ]] || die "Missing $SRC_DIR/$svc.service"
done
[[ -d /opt/carwash/jars ]]                   || die "/opt/carwash/jars not found"
[[ -f /opt/carwash/config/env.properties ]]  || die "/opt/carwash/config/env.properties not found"
[[ -f /etc/carwash/logback-prod.xml ]]       || die "/etc/carwash/logback-prod.xml not found"

# ---------- 2. Stop the existing nohup'd processes ----------
log "Stopping existing Java processes (nohup-started)..."
EXISTING_PIDS=$(pgrep -f 'java -jar /opt/carwash/jars/' || true)
if [[ -n "$EXISTING_PIDS" ]]; then
  log "Found PIDs: $EXISTING_PIDS — sending SIGTERM..."
  kill $EXISTING_PIDS || true
  # Wait up to 30s for graceful shutdown
  for i in {1..30}; do
    sleep 1
    STILL_RUNNING=$(pgrep -f 'java -jar /opt/carwash/jars/' || true)
    [[ -z "$STILL_RUNNING" ]] && break
  done
  STILL_RUNNING=$(pgrep -f 'java -jar /opt/carwash/jars/' || true)
  if [[ -n "$STILL_RUNNING" ]]; then
    warn "Forcing kill of: $STILL_RUNNING"
    kill -9 $STILL_RUNNING || true
    sleep 2
  fi
else
  log "No existing Java processes to stop."
fi

# ---------- 3. Install unit files ----------
log "Installing unit files to $SYSTEMD_DIR..."
for svc in "${SERVICES[@]}"; do
  install -m 0644 -o root -g root "$SRC_DIR/$svc.service" "$SYSTEMD_DIR/$svc.service"
  log "  installed $svc.service"
done

systemctl daemon-reload

# ---------- 4. Enable (auto-start on boot) + start now ----------
log "Enabling and starting services..."

# Gateway first, then others
systemctl enable --now carwash-uigatewayservice
sleep 8   # give gateway time to bind port 10080

for svc in carwash-otploginauth carwash-bookingservice carwash-membership carwash-carwashrates; do
  systemctl enable --now "$svc"
  log "  started $svc"
done

# ---------- 5. Report status ----------
sleep 5
log ""
log "===== STATUS ====="
for svc in "${SERVICES[@]}"; do
  STATE=$(systemctl is-active "$svc" || true)
  printf "  %-35s %s\n" "$svc" "$STATE"
done
log ""
log "Done. Useful commands:"
cat <<EOF
  sudo systemctl status carwash-bookingservice
  sudo systemctl restart carwash-bookingservice
  sudo systemctl stop carwash-bookingservice
  sudo journalctl -u carwash-bookingservice -f
  sudo systemctl list-units 'carwash-*'

Your log files at /var/log/carwash/prod/*.log continue to work unchanged (logback).
EOF
