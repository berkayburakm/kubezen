package auth

import (
	"context"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"

	"kubezen/internal/config"
)

type OIDCClient struct {
	provider *oidc.Provider
	verifier *oidc.IDTokenVerifier
	config   *oauth2.Config
}

func NewOIDCClient(ctx context.Context, cfg config.AuthConfig) (*OIDCClient, error) {
	if cfg.OIDCIssuerURL == "" || cfg.OIDCClientID == "" || cfg.OIDCClientSecret == "" || cfg.OIDCRedirectURL == "" {
		return nil, fmt.Errorf("oidc configuration incomplete")
	}

	provider, err := oidc.NewProvider(ctx, cfg.OIDCIssuerURL)
	if err != nil {
		return nil, fmt.Errorf("discover oidc provider: %w", err)
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: cfg.OIDCClientID})
	oauthConfig := &oauth2.Config{
		ClientID:     cfg.OIDCClientID,
		ClientSecret: cfg.OIDCClientSecret,
		RedirectURL:  cfg.OIDCRedirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       cfg.OIDCScopes,
	}

	return &OIDCClient{
		provider: provider,
		verifier: verifier,
		config:   oauthConfig,
	}, nil
}

func (c *OIDCClient) AuthCodeURL(state string) string {
	return c.config.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func (c *OIDCClient) Exchange(ctx context.Context, code string) (OIDCTokenPayload, error) {
	token, err := c.config.Exchange(ctx, code)
	if err != nil {
		return OIDCTokenPayload{}, fmt.Errorf("exchange code: %w", err)
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	var claims struct {
		Email string `json:"email"`
		Name  string `json:"name"`
		Sub   string `json:"sub"`
	}

	if ok && rawIDToken != "" {
		idToken, err := c.verifier.Verify(ctx, rawIDToken)
		if err != nil {
			return OIDCTokenPayload{}, fmt.Errorf("verify id token: %w", err)
		}
		_ = idToken.Claims(&claims)
	}

	return OIDCTokenPayload{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.Expiry,
		Subject:      claims.Sub,
		Email:        claims.Email,
		Name:         claims.Name,
	}, nil
}
