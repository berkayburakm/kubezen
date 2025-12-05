FROM golang:1.24 as builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY cmd cmd
COPY internal internal

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/kubezen-server ./cmd/server

FROM alpine:3.20

RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /out/kubezen-server /app/kubezen-server

ENV KZ_ADDRESS=:8080
EXPOSE 8080

ENTRYPOINT ["/app/kubezen-server"]
