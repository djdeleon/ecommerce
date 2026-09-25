package main

import (
	"fmt"
	"context"
	"os"
	_ "github.com/jackc/pgx/v5/stdlib"
	"log"
	"database/sql"
	"logistics-engine/db"
)

func main() {
	ctx := context.Background()

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_NAME"))

	conn, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Failed to list facilities: %v", err)
	}
	defer conn.Close()

	queries := db.New(conn)

	facilities, err := queries.Facilities(ctx)
	if err != nil {
		log.Fatalf("Failed to list facilities: %v", err)
	}

	for _, f := range facilities {
		fmt.Printf("Facility: %s \n", f.Location)
	}
}
