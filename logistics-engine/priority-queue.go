package main

type LocationPoint struct {
	ID string
	Coordinates [2]float64
	Distance float64
}

type PriorityQueue []LocationPoint

func (pq PriorityQueue) Len() int {
	return len(pq)
}

func (pq *PriorityQueue) Push(x any) {
	*pq = append(*pq, x.(LocationPoint))
}

func (pq *PriorityQueue) Pop() any {
	current := *pq
	last := len(current)-1
	*pq = current[0:last]

	return current[last]
}

func (pq PriorityQueue) Less(i, j int) bool {
	return pq[i].Distance < pq[j].Distance
}

func (pq PriorityQueue) Swap(i, j int) {
	pq[i], pq[j] = pq[j], pq[i]
}
