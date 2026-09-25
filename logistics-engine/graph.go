package main

type Coordinates struct {
	Latitude float64
	Longitude float64
}

type Edge struct {
	To string
	Coordinates Coordinates
	Distance float64
}

type Graph map[string][]Edge