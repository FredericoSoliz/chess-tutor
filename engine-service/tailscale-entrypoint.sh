#!/bin/sh
set -e

if [ -n "$TAILSCALE_AUTHKEY" ]; then
    echo "Starting tailscaled..."
    /usr/sbin/tailscaled \
        --tun=userspace-networking \
        --outbound-http-proxy-listen=localhost:1055 &

    sleep 3

    echo "Authenticating to tailnet..."
    /usr/bin/tailscale up \
        --authkey="${TAILSCALE_AUTHKEY}" \
        --hostname=cloud-run-engine \
        --accept-routes

    /usr/bin/tailscale status || true
else
    echo "TAILSCALE_AUTHKEY not set, running without tailnet."
fi

exec "$@"
