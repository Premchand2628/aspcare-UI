#!/bin/bash
# ============================================================
#  Logging Setup Script for ASP Car Care
# ============================================================
#  Run this on your EC2 server: sudo bash setup-logging.sh
# ============================================================

set -e

echo "=== Creating log directories ==="
sudo mkdir -p /var/log/carwash/prod
sudo mkdir -p /var/log/carwash/qa
sudo mkdir -p /var/log/carwash/stg
sudo chown -R www-data:www-data /var/log/carwash
sudo chmod -R 755 /var/log/carwash

echo "=== Copying logback configs ==="
sudo mkdir -p /etc/carwash
sudo cp logback-prod.xml /etc/carwash/
sudo cp logback-qa.xml /etc/carwash/

echo "=== Installing Promtail ==="
# Download latest Promtail binary (amd64)
PROMTAIL_VERSION="2.9.4"
cd /tmp
curl -fSL "https://github.com/grafana/loki/releases/download/v${PROMTAIL_VERSION}/promtail-linux-amd64.zip" -o promtail.zip
unzip -o promtail.zip
sudo mv promtail-linux-amd64 /usr/local/bin/promtail
sudo chmod +x /usr/local/bin/promtail

echo "=== Setting up Promtail config ==="
sudo mkdir -p /etc/promtail
sudo cp promtail-config.yml /etc/promtail/config.yml

echo "=== Creating Promtail systemd service ==="
sudo tee /etc/systemd/system/promtail.service > /dev/null <<'EOF'
[Unit]
Description=Promtail Log Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/promtail -config.file=/etc/promtail/config.yml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable promtail
sudo systemctl start promtail

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Log directories created:"
echo "  /var/log/carwash/prod/  (bookingservice_prod.log, otploginauth_prod.log, etc.)"
echo "  /var/log/carwash/qa/    (bookingservice_qa.log, otploginauth_qa.log, etc.)"
echo "  /var/log/carwash/stg/   (staging logs)"
echo ""
echo "NEXT STEPS:"
echo "1. Edit /etc/promtail/config.yml — add your Grafana Cloud credentials"
echo "2. Start PROD backend:  java -jar gateway.jar --spring.profiles.active=prod --server.port=10080 -Dlogging.config=/etc/carwash/logback-prod.xml"
echo "3. Start QA backend:    java -jar gateway.jar --spring.profiles.active=qa   --server.port=10081 -Dlogging.config=/etc/carwash/logback-qa.xml"
echo "4. Restart nginx:       sudo nginx -t && sudo systemctl reload nginx"
echo "5. Restart promtail:    sudo systemctl restart promtail"
echo "6. Create dashboards in Grafana Cloud (see LOGGING_SETUP.md)"
