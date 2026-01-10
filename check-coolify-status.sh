#!/bin/bash
# Coolify Deployment Status Checker for WinADeal

echo "=================================================="
echo "  WinADeal Coolify Deployment Status Check"
echo "=================================================="
echo ""

echo "1. Checking Docker containers..."
echo "-----------------------------------"
docker ps -a | grep -E "winadeal|coolify"
echo ""

echo "2. Checking Coolify proxy status..."
echo "-----------------------------------"
docker ps | grep coolify-proxy
echo ""

echo "3. Checking container logs (last 20 lines)..."
echo "-----------------------------------"
# Get the first WinADeal container name
CONTAINER=$(docker ps -a | grep winadeal | head -1 | awk '{print $1}')
if [ ! -z "$CONTAINER" ]; then
    echo "Logs for container: $CONTAINER"
    docker logs --tail 20 $CONTAINER
else
    echo "No WinADeal containers found!"
fi
echo ""

echo "4. Checking Nginx/Traefik configuration..."
echo "-----------------------------------"
docker exec coolify-proxy cat /etc/nginx/nginx.conf 2>/dev/null || echo "Coolify proxy config not accessible"
echo ""

echo "5. Checking disk space..."
echo "-----------------------------------"
df -h
echo ""

echo "6. Checking memory usage..."
echo "-----------------------------------"
free -h
echo ""

echo "7. Checking network connectivity..."
echo "-----------------------------------"
curl -I http://localhost 2>/dev/null | head -5 || echo "Local web server not responding"
echo ""

echo "8. Checking if backend port 5000 is accessible..."
echo "-----------------------------------"
netstat -tlnp | grep :5000 || echo "Port 5000 not in use"
echo ""

echo "=================================================="
echo "  Status Check Complete"
echo "=================================================="
echo ""
echo "Next steps:"
echo "- If containers are 'Exited', restart them in Coolify dashboard"
echo "- If containers are missing, redeploy in Coolify"
echo "- If 'unhealthy', check container logs for errors"
echo ""
