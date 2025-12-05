package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
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

// generateCodeVerifier creates a random code verifier for PKCE
func generateCodeVerifier() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// generateCodeChallenge creates a S256 code challenge from verifier
func generateCodeChallenge(verifier string) string {
	h := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(h[:])
}

// AuthCodeURL returns the authorization URL with PKCE parameters
// Returns the URL and the code verifier (which must be saved for the callback)
func (c *OIDCClient) AuthCodeURL(state string) (string, string, error) {
	codeVerifier, err := generateCodeVerifier()
	if err != nil {
		return "", "", fmt.Errorf("generate code verifier: %w", err)
	}
	codeChallenge := generateCodeChallenge(codeVerifier)

	url := c.config.AuthCodeURL(state,
		oauth2.AccessTypeOffline,
		oauth2.SetAuthURLParam("code_challenge", codeChallenge),
		oauth2.SetAuthURLParam("code_challenge_method", "S256"),
	)

	return url, codeVerifier, nil
}

// Exchange trades the authorization code for tokens, using the code verifier for PKCE
func (c *OIDCClient) Exchange(ctx context.Context, code, codeVerifier string) (OIDCTokenPayload, error) {
	token, err := c.config.Exchange(ctx, code,
		oauth2.SetAuthURLParam("code_verifier", codeVerifier),
	)
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

