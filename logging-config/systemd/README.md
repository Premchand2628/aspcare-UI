# Car Wash — systemd units for prod backend services

Replaces the current `nohup java -jar ... &` launch pattern with proper
systemd-managed services (auto-start on boot, auto-restart on crash).

## Files

| File | Purpose |
|---|---|
| `carwash-uigatewayservice.service` | Spring Cloud Gateway (port 10080) |
| `carwash-otploginauth.service`     | OTP login / auth service |
| `carwash-bookingservice.service`   | Booking service |
| `carwash-membership.service`       | Membership service |
| `carwash-carwashrates.service`     | Rates service |
| `install-carwash-services.sh`      | One-time migration script |

All unit files share the same launch command structure observed in prod:

```
/usr/bin/java -jar /opt/carwash/jars/<name>.jar \
  --spring.profiles.active=prod \
  --logging.config=/etc/carwash/logback-prod.xml \
  --spring.config.additional-location=file:/opt/carwash/config/env.properties
```

Logback continues to write to `/var/log/carwash/prod/<name>_prod.log` — no change
to Promtail / Grafana Loki pipeline.

## Deploy (one time)

From your Windows machine:

```powershell
scp -i "C:\Users\chand\.ssh\aspcarcare.pem" -r `
  "e:\Car wash\MainApp\logging-config\systemd" `
  ubuntu@43.205.204.87:/tmp/carwash-systemd
```

On the server:

```bash
sudo bash /tmp/carwash-systemd/install-carwash-services.sh
```

The script:
1. Verifies unit files, jars, config, logback exist.
2. Stops existing `nohup`-started Java processes (SIGTERM, then SIGKILL if needed).
3. Copies unit files to `/etc/systemd/system/`.
4. Runs `systemctl daemon-reload`.
5. `enable --now` each service (gateway first, then microservices).
6. Prints status.

## Day-to-day operations

| Task | Command |
|---|---|
| Status of all | `sudo systemctl list-units 'carwash-*'` |
| Status of one | `sudo systemctl status carwash-bookingservice` |
| Restart one | `sudo systemctl restart carwash-bookingservice` |
| Stop one | `sudo systemctl stop carwash-bookingservice` |
| Live logs (journald) | `sudo journalctl -u carwash-bookingservice -f` |
| Live logs (logback file) | `tail -f /var/log/carwash/prod/bookingservice_prod.log` |
| Deploy new jar | `sudo cp new.jar /opt/carwash/jars/bookingservice.jar && sudo systemctl restart carwash-bookingservice` |

## Restart policy

Each unit has:
- `Restart=always` — revive on any exit
- `RestartSec=10s` — wait before retry
- `StartLimitBurst=5` / `StartLimitIntervalSec=300` — give up after 5 failures in 5 min (prevents crash loops)
- `TimeoutStopSec=30s` — graceful shutdown window

## Rollback

If anything goes wrong:

```bash
# Stop all
sudo systemctl stop 'carwash-*'
sudo systemctl disable 'carwash-*'

# Remove units
sudo rm /etc/systemd/system/carwash-*.service
sudo systemctl daemon-reload

# Relaunch the old way (example for booking)
cd /opt/carwash
nohup /usr/bin/java -jar /opt/carwash/jars/bookingservice.jar \
  --spring.profiles.active=prod \
  --logging.config=/etc/carwash/logback-prod.xml \
  --spring.config.additional-location=file:/opt/carwash/config/env.properties \
  > /var/log/carwash/prod/bookingservice_prod.log 2>&1 &
```
