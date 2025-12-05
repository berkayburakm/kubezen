# KubeZen Keycloak Development Image
# Pre-configured with kubezen realm, client, and test users
FROM quay.io/keycloak/keycloak:26.0

# Copy realm configuration
COPY kubezen-realm.json /opt/keycloak/data/import/kubezen-realm.json

# Set environment variables for development
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_HTTP_ENABLED=true
ENV KC_HOSTNAME_STRICT=false
ENV KC_PROXY_HEADERS=xforwarded

# Import realm on startup
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]
