package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all runtime configuration for the backend server.
type Config struct {
	Env    string
	Server ServerConfig
	Kube   KubeConfig
	Auth   AuthConfig
}

type ServerConfig struct {
	Address        string
	ReadTimeout    time.Duration
	WriteTimeout   time.Duration
	AllowedOrigins []string
}

type KubeConfig struct {
	KubeconfigPath        string
	Context               string
	QPS                   float32
	Burst                 int
	InsecureSkipTLSVerify bool
}

type AuthConfig struct {
	// EnableDevBypass allows running without auth in local environments.
	EnableDevBypass  bool
	SessionName      string
	SessionSecret    string
	SessionTTL       time.Duration
	SessionSecure    bool
	SessionDomain    string
	OIDCIssuerURL    string
	OIDCClientID     string
	OIDCClientSecret string
	OIDCRedirectURL  string
	OIDCScopes       []string
}

// Load builds a Config from environment variables with reasonable defaults.
func Load() Config {
	return Config{
		Env: getEnv("KZ_ENV", "development"),
		Server: ServerConfig{
			Address:        getEnv("KZ_ADDRESS", ":8080"),
			ReadTimeout:    getDuration("KZ_READ_TIMEOUT", 15*time.Second),
			WriteTimeout:   getDuration("KZ_WRITE_TIMEOUT", 15*time.Second),
			AllowedOrigins: splitCSV(getEnv("KZ_ALLOWED_ORIGINS", "*")),
		},
		Kube: KubeConfig{
			KubeconfigPath:        getEnv("KZ_KUBECONFIG", os.Getenv("KUBECONFIG")),
			Context:               getEnv("KZ_KUBE_CONTEXT", ""),
			QPS:                   getFloat32("KZ_KUBE_QPS", 20),
			Burst:                 getInt("KZ_KUBE_BURST", 40),
			InsecureSkipTLSVerify: getBool("KZ_KUBE_INSECURE", false),
		},
		Auth: AuthConfig{
			EnableDevBypass:  getBool("KZ_AUTH_DEV_BYPASS", true),
			SessionName:      getEnv("KZ_AUTH_SESSION_NAME", "kz_session"),
			SessionSecret:    getEnv("KZ_AUTH_SESSION_SECRET", "dev-secret-change-me"),
			SessionTTL:       getDuration("KZ_AUTH_SESSION_TTL", 24*time.Hour),
			SessionSecure:    getBool("KZ_AUTH_SESSION_SECURE", true),
			SessionDomain:    getEnv("KZ_AUTH_SESSION_DOMAIN", ""),
			OIDCIssuerURL:    getEnv("KZ_AUTH_OIDC_ISSUER", ""),
			OIDCClientID:     getEnv("KZ_AUTH_OIDC_CLIENT_ID", ""),
			OIDCClientSecret: getEnv("KZ_AUTH_OIDC_CLIENT_SECRET", ""),
			OIDCRedirectURL:  getEnv("KZ_AUTH_OIDC_REDIRECT_URL", ""),
			OIDCScopes:       splitCSV(getEnv("KZ_AUTH_OIDC_SCOPES", "openid,profile,email")),
		},
	}
}

func getEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if parsed, err := time.ParseDuration(value); err == nil {
			return parsed
		}
	}
	return fallback
}

func getFloat32(key string, fallback float32) float32 {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseFloat(value, 32); err == nil {
			return float32(parsed)
		}
	}
	return fallback
}

func getInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return fallback
}

func getBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return fallback
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}
		result = append(result, trimmed)
	}
	if len(result) == 0 {
		return []string{"*"}
	}
	return result
}
