-- name: GetFacilityById :one
SELECT id, name
FROM facilities
WHERE id = $1;

-- name: Facilities :many
SELECT id, name
FROM facilities;