FROM golang:1.27-bookworm AS builder
WORKDIR /app

ENV GOMODCACHE=/app/.go-cache/pkg/mod
ENV GOCACHE=/app/.go-cache/cache/go-build

RUN go install github.com/air-verse/air@latest

COPY go.mod go.sum* ./
COPY . .

CMD ["air"]

RUN CGO_ENABLED=0 GOOS=linux go build -o logistics-binary .

FROM alpine:3.21
RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /app/logistics-binary .

EXPOSE 8080

CMD ["./logistics-binary"]