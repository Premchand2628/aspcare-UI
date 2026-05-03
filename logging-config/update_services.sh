#!/bin/bash
SERVICES=(bookingservice carwasherservice carwashrates invitation mailnotification membership otploginauth paymentservice supportchatservice uigatewayservice)
for svc in "${SERVICES[@]}"; do
  FILE="/etc/systemd/system/${svc}.service"
  if [ -f "$FILE" ]; then
    if ! grep -q "logging.config" "$FILE"; then
      sudo sed -i 's|--spring.profiles.active=prod|--spring.profiles.active=prod --logging.config=/etc/carwash/logback-prod.xml|' "$FILE"
      echo "Updated: $svc"
    else
      echo "Already done: $svc"
    fi
  else
    echo "Not found: $svc"
  fi
done
echo "--- Reloading systemd ---"
sudo systemctl daemon-reload
echo "--- Done ---"
