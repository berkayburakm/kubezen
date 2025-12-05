package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"kubezen/internal/api"
	"kubezen/internal/auth"
	"kubezen/internal/config"
	"kubezen/internal/k8s"
	"kubezen/internal/store"
)

func main() {
	// Load .env.development if exists (for local development)
	_ = godotenv.Load(".env.development")

	cfg := config.Load()
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Initialize SQLite user store
	userStore, err := store.New("./data/kubezen.db")
	if err != nil {
		logger.Error("failed to initialize user store", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer userStore.Close()
	logger.Info("user store initialized")

	authManager := auth.NewManager(cfg.Auth)
	var oidcClient *auth.OIDCClient
	if cfg.Auth.OIDCIssuerURL != "" {
		client, err := auth.NewOIDCClient(ctx, cfg.Auth)
		if err != nil {
			logger.Warn("oidc setup failed, continuing without OIDC", slog.String("error", err.Error()))
		} else {
			oidcClient = client
		}
	}

	cluster, err := k8s.NewCluster(cfg.Kube)
	if err != nil {
		logger.Error("failed to initialize kubernetes client", slog.String("error", err.Error()))
		os.Exit(1)
	}

	logger.Info("starting informer cache...")
	if err := cluster.Start(ctx); err != nil {
		logger.Error("informer start failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	logger.Info("informer cache synced")

	service := k8s.NewService(cluster.Client, cluster.Factory)
	router := api.NewRouter(cfg, service, userStore, authManager, oidcClient)

	server := &http.Server{
		Addr:         cfg.Server.Address,
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.Error("server shutdown error", slog.String("error", err.Error()))
		} else {
			logger.Info("server shutdown complete")
		}
	}()

	logger.Info("server listening", slog.String("addr", cfg.Server.Address))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("http server error", slog.String("error", err.Error()))
		os.Exit(1)
	}
}

