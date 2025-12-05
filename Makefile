APP_NAME := kubezen-server
BIN_DIR := bin

.PHONY: run build test fmt vet tidy clean

run:
	go run ./cmd/server

build:
	CGO_ENABLED=0 go build -o $(BIN_DIR)/$(APP_NAME) ./cmd/server

test:
	go test ./...

fmt:
	gofmt -w $$(go list -f '{{.Dir}}' ./...)

vet:
	go vet ./...

tidy:
	go mod tidy

clean:
	rm -rf $(BIN_DIR)

